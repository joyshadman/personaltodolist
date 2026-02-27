import React, { useState, useEffect, useRef, useCallback } from "react";
import { ref, set, onValue, remove, update } from "firebase/database";
import { db } from "../Config/firebaseConfig";
import Navbar from "./navbar";
import Watermark from "./Watermark";
import ClipLoader from "react-spinners/ClipLoader";
import { motion, AnimatePresence } from "framer-motion";

// Components
import { FileRow, RenderFolderRecursive } from "./Notes/SidebarItem";
import EditorToolbar from "./Notes/EditorToolbar";
import NamingModal from "./Notes/NamingModal";
import DeleteModal from "./Notes/DeleteModal";
import { Plus, FolderPlus, Save, ChevronRight, Command, CloudCheck, CloudUpload, PanelLeftOpen, Layout } from "lucide-react";

const Notes = ({ user, onSignOut }) => {
  const [notes, setNotes] = useState({});
  const [folders, setFolders] = useState({});
  const [activeNote, setActiveNote] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [openFolders, setOpenFolders] = useState({});
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle, saving, saved

  const [modal, setModal] = useState({ isOpen: false, type: "Note" });
  const [delModal, setDelModal] = useState({ isOpen: false, type: "", id: "", name: "" });

  const editorRef = useRef(null);
  const autoSaveTimer = useRef(null);

  // 1. Responsive & Initial Logic
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setLeftCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Data Fetching
  useEffect(() => {
    if (!user) return;
    const unsubNotes = onValue(ref(db, `users/${user.uid}/notes`), (snap) => {
      const data = snap.val() || {};
      setNotes(data);
      setLoading(false);
      if (activeNote && data[activeNote] && !isDirty && editorRef.current) {
        editorRef.current.innerHTML = data[activeNote].content_enc || "";
      }
    });
    const unsubFolders = onValue(ref(db, `users/${user.uid}/folders`), (snap) => setFolders(snap.val() || {}));
    return () => { unsubNotes(); unsubFolders(); };
  }, [user, activeNote, isDirty]);

  // 3. Save Logic
  const saveNote = useCallback(async () => {
    if (!activeNote || !user || !isDirty) return;
    
    setSaveStatus("saving");
    try {
      await update(ref(db, `users/${user.uid}/notes/${activeNote}`), {
        title: title || "Untitled",
        content_enc: editorRef.current?.innerHTML || "",
        updatedAt: new Date().toISOString()
      });
      setIsDirty(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus("idle");
    }
  }, [activeNote, user, isDirty, title]);

  const selectNote = (id) => {
    if (isDirty) saveNote();
    setActiveNote(id);
    setTitle(notes[id]?.title || "Untitled");
    setIsDirty(false);
    if (editorRef.current) editorRef.current.innerHTML = notes[id]?.content_enc || "";
    if (window.innerWidth < 768) setLeftCollapsed(true);
  };

  const handleCreateSubmit = async (name) => {
    const id = Date.now().toString();
    const type = modal.type === "Note" ? 'notes' : 'folders';
    const data = modal.type === "Note" 
      ? { title: name, content_enc: "", updatedAt: new Date().toISOString(), folder: selectedFolder || null }
      : { name, parent: selectedFolder || null };

    await set(ref(db, `users/${user.uid}/${type}/${id}`), data);
    if (modal.type === "Note") selectNote(id);
    setModal({ ...modal, isOpen: false });
  };

  const buildFolderTree = (f) => {
    const nodes = {};
    Object.keys(f).forEach(id => nodes[id] = { id, ...f[id], children: [] });
    const roots = [];
    Object.values(nodes).forEach(n => {
      if (n.parent && nodes[n.parent]) nodes[n.parent].children.push(n);
      else roots.push(n);
    });
    return roots;
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><ClipLoader color="#f97316" /></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden relative font-sans selection:bg-orange-500/30">
      
      <style>{`
        .editor-container h1 { font-size: 3.5rem; font-weight: 900; color: white; margin: 1rem 0; letter-spacing: -0.05em; }
        .editor-container h2 { font-size: 2.2rem; font-weight: 800; color: #f97316; margin: 0.8rem 0; }
        .editor-container blockquote { border-left: 4px solid #f97316; padding-left: 1.5rem; font-style: italic; color: #9ca3af; margin: 1.5rem 0; background: rgba(255,255,255,0.02); padding-block: 0.5rem; }
        
        /* Glassy Sidebar Scrollbar Fix */
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(249, 115, 22, 0.4); }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>

      {/* BACKGROUND ANIMATION */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [0, 30, -30, 0], y: [0, -20, 20, 0], opacity: [0.08, 0.12, 0.08] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-5%] left-[-5%] w-[60%] h-[60%] bg-orange-600 blur-[130px] rounded-full"
        />
        <motion.div 
          animate={{ x: [0, -30, 30, 0], y: [0, 20, -20, 0], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 blur-[130px] rounded-full"
        />
      </div>

      <Navbar user={user} onSignOut={onSignOut} />

      {/* FLOATING TOGGLE ICON */}
      <AnimatePresence>
        {leftCollapsed && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setLeftCollapsed(false)}
            className="fixed top-24 left-6 z-[60] p-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl text-orange-500 hover:bg-white/10 transition-all shadow-2xl"
          >
            <PanelLeftOpen size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="flex flex-1 h-screen z-10 w-full relative">
        
        {/* SIDEBAR */}
        <motion.aside 
          initial={false}
          animate={{ 
            width: leftCollapsed ? 0 : (window.innerWidth < 768 ? "100%" : 340),
            opacity: leftCollapsed ? 0 : 1
          }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="relative z-50 h-full mt-20 bg-white/[0.02] backdrop-blur-[40px] border-r border-white/[0.05] flex flex-col overflow-hidden"
        >
          <div className="flex flex-col h-full p-6 min-w-[340px]">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                  <Layout size={18} className="text-white" />
                </div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-white">Library</h2>
              </div>
              <button onClick={() => setLeftCollapsed(true)} className="p-2.5 hover:bg-white/5 rounded-full text-gray-400 transition-colors">
                <ChevronRight className="rotate-180" size={18}/>
              </button>
            </div>

            <div className="flex gap-3 mb-10 px-2">
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => setModal({ isOpen: true, type: "Folder" })} 
                className="flex-1 py-3.5 bg-white/[0.04] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-300 flex items-center justify-center gap-2 hover:bg-white/[0.08] transition-all"
              >
                <FolderPlus size={14}/> {selectedFolder ? "Sub" : "Folder"}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => setModal({ isOpen: true, type: "Note" })} 
                className="flex-1 py-3.5 bg-orange-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 hover:bg-orange-500 shadow-lg shadow-orange-600/20 transition-all"
              >
                <Plus size={14}/> Note
              </motion.button>
            </div>

            {/* SCROLLABLE AREA FIX */}
            <div 
              className="flex-1 overflow-y-auto sidebar-scroll pr-2 transition-all"
              style={{ maxHeight: "calc(100vh - 280px)" }} // Limits height to prevent screen overflow
              onClick={(e) => e.target === e.currentTarget && setSelectedFolder(null)}
            >
              {buildFolderTree(folders).map((root) => (
                <RenderFolderRecursive 
                  key={root.id} 
                  isRoot={true} // Triggers the root styling in SidebarItem
                  node={root} notes={notes} folders={folders} openFolders={openFolders} setOpenFolders={setOpenFolders} selectedFolder={selectedFolder} setSelectedFolder={setSelectedFolder} activeNote={activeNote} selectNote={selectNote} 
                  onContextMenu={(e, t, i, n) => { e.preventDefault(); }}
                  onDelete={(t, i, n) => setDelModal({ isOpen: true, type: t, id: i, name: n })}
                />
              ))}
              {/* Bottom padding to ensure last items aren't cut off */}
              <div className="h-20" /> 
            </div>
          </div>
        </motion.aside>

        {/* MAIN EDITOR */}
        <main className="flex-1 overflow-y-auto custom-scrollbar mt-20">
          <motion.div 
            layout
            className="p-6 md:p-20 pt-10 max-w-5xl mx-auto transition-all duration-500"
          >
            <AnimatePresence mode="wait">
              {activeNote ? (
                <motion.div key={activeNote} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
                    <div className="flex-1 w-full">
                      <input 
                        value={title} 
                        onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }} 
                        className="bg-transparent text-6xl md:text-8xl font-black outline-none text-white w-full tracking-tighter placeholder:text-white/[0.03]" 
                        placeholder="Untitled"
                      />
                      <div className="mt-6 flex items-center gap-3">
                        {saveStatus === "saving" ? (
                          <div className="text-orange-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><CloudUpload size={12} className="animate-bounce" /> Syncing...</div>
                        ) : saveStatus === "saved" ? (
                          <div className="text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><CloudCheck size={12} /> Cloud Secured</div>
                        ) : (
                          <div className="text-white/10 text-[10px] font-black uppercase tracking-widest italic">All changes secured</div>
                        )}
                      </div>
                    </div>
                    
                    <motion.button 
                      whileHover={{ scale: 1.1 }} 
                      whileTap={{ scale: 0.9 }} 
                      onClick={saveNote} 
                      className={`p-6 rounded-[2rem] transition-all shadow-2xl ${isDirty ? 'bg-orange-600 shadow-orange-600/20' : 'bg-white/5 text-gray-600'}`}
                    >
                      <Save size={24} />
                    </motion.button>
                  </div>
                  
                  <div className="sticky top-4 z-30 mb-12 p-1.5 bg-white/[0.01] border border-white/5 backdrop-blur-3xl rounded-3xl shadow-2xl">
                    <EditorToolbar execCmd={(cmd, val) => {
                       if (editorRef.current) editorRef.current.focus();
                       document.execCommand(cmd, false, val);
                       setIsDirty(true);
                    }} />
                  </div>

                  <div 
                    ref={editorRef} 
                    contentEditable 
                    spellCheck="false"
                    className="editor-container mt-10 outline-none text-2xl text-white/80 min-h-[70vh] leading-relaxed pb-60" 
                    onInput={() => setIsDirty(true)} 
                  />
                </motion.div>
              ) : (
                <div className="h-[70vh] flex flex-col items-center justify-center opacity-[0.03]">
                  <Command size={150} />
                  <h3 className="text-2xl font-black uppercase tracking-[1em] mt-8">System Idle</h3>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>

      {/* MODALS */}
      <NamingModal 
        isOpen={modal.isOpen} 
        type={modal.type} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
        onSubmit={handleCreateSubmit} 
      />
      
      <DeleteModal 
        isOpen={delModal.isOpen} 
        itemName={delModal.name} 
        itemType={delModal.type === 'file' ? 'Note' : 'Folder'} 
        onClose={() => setDelModal({ ...delModal, isOpen: false })} 
        onConfirm={async () => {
           await remove(ref(db, `users/${user.uid}/${delModal.type === 'file' ? 'notes' : 'folders'}/${delModal.id}`));
           if (activeNote === delModal.id) setActiveNote(null);
           setDelModal({ ...delModal, isOpen: false });
        }} 
      />

      <Watermark />
    </div>
  );
};

export default Notes;