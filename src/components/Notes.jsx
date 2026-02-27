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
import { Plus, FolderPlus, Save, ChevronRight, Command, CloudCheck, CloudUpload } from "lucide-react";

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

  // 1. Data Fetching
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

  // 2. Manual/Auto Save Logic
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

  // 3. Auto-Save Effect (Debounced)
  useEffect(() => {
    if (isDirty) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        saveNote();
      }, 3000); // Saves after 3 seconds of inactivity
    }
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [isDirty, saveNote]);

  const execCmd = (command, value = null) => {
    if (editorRef.current) editorRef.current.focus();
    if (command === "formatBlock") {
      document.execCommand(command, false, `<${value}>`);
    } else {
      document.execCommand(command, false, value);
    }
    setIsDirty(true);
  };

  const selectNote = (id) => {
    if (isDirty) saveNote(); // Save current note before switching
    setActiveNote(id);
    setTitle(notes[id]?.title || "Untitled");
    setIsDirty(false);
    if (editorRef.current) editorRef.current.innerHTML = notes[id]?.content_enc || "";
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

  const confirmDelete = async () => {
    const { type, id } = delModal;
    await remove(ref(db, `users/${user.uid}/${type === 'file' ? 'notes' : 'folders'}/${id}`));
    if (activeNote === id) setActiveNote(null);
    setDelModal({ ...delModal, isOpen: false });
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
        .editor-container pre { background: rgba(0,0,0,0.3); padding: 1.2rem; border-radius: 1rem; font-family: 'JetBrains Mono', monospace; border: 1px solid rgba(255,255,255,0.1); color: #fdba74; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>

      {/* BACKGROUND ANIMATION */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [0, 50, -30, 0], y: [0, -30, 30, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-600 blur-[120px] rounded-full"
        />
      </div>

      <Navbar user={user} onSignOut={onSignOut} />

      <div className="flex flex-1 h-screen pt-16 z-10 w-full">
        {/* SIDEBAR */}
        <aside className={`transition-all duration-500 bg-white/[0.01] backdrop-blur-3xl border-r border-white/5 flex flex-col ${leftCollapsed ? "w-0 overflow-hidden" : "w-full md:w-80"}`}>
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col h-full p-6">
            <div className="flex items-center justify-between mb-8 mt-10">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 italic">Library</h2>
              <button onClick={() => setLeftCollapsed(true)} className="p-2 hover:bg-white/5 rounded-full text-gray-400"><ChevronRight className="rotate-180" size={16}/></button>
            </div>

            <div className="flex gap-3 mb-10">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setModal({ isOpen: true, type: "Folder" })} className="flex-1 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-300 flex items-center justify-center gap-2 transition-all">
                <FolderPlus size={14}/> {selectedFolder ? "Sub" : "Folder"}
              </motion.button>
              <motion.button whileHover={{ scale: 1.02, backgroundColor: '#ea580c' }} whileTap={{ scale: 0.98 }} onClick={() => setModal({ isOpen: true, type: "Note" })} className="flex-1 py-3 bg-orange-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2">
                <Plus size={14}/> Note
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2" onClick={(e) => e.target === e.currentTarget && setSelectedFolder(null)}>
              {buildFolderTree(folders).map((root, i) => (
                <motion.div key={root.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <RenderFolderRecursive 
                    node={root} notes={notes} folders={folders} openFolders={openFolders} setOpenFolders={setOpenFolders} selectedFolder={selectedFolder} setSelectedFolder={setSelectedFolder} activeNote={activeNote} selectNote={selectNote} 
                    onContextMenu={(e, t, i, n) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, type: t, id: i, name: n }); }}
                    onDelete={(t, i, n) => setDelModal({ isOpen: true, type: t, id: i, name: n })}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </aside>

        {/* MAIN EDITOR */}
        <main className="mt-20 flex-1 p-8 md:p-20 overflow-y-auto relative bg-transparent backdrop-blur-[15px] custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeNote ? (
              <motion.div key={activeNote} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto w-full">
                <div className="flex justify-between items-start mb-16">
                  <div className="flex-1">
                    <input 
                      value={title} 
                      onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }} 
                      className="bg-transparent text-6xl md:text-8xl font-black outline-none text-white w-full tracking-tighter placeholder:opacity-5" 
                      placeholder="Untitled"
                    />
                    <div className="flex items-center gap-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      {saveStatus === "saving" ? (
                        <span className="flex items-center gap-2 text-orange-400"><CloudUpload size={12} className="animate-bounce" /> Cloud Syncing...</span>
                      ) : saveStatus === "saved" ? (
                        <span className="flex items-center gap-2 text-green-500"><CloudCheck size={12} /> Sync Complete</span>
                      ) : (
                        <span className="opacity-40">All changes secured</span>
                      )}
                    </div>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }} 
                    onClick={saveNote} 
                    className={`p-5 rounded-full transition-all relative ${isDirty ? 'bg-orange-600 shadow-[0_0_30px_rgba(234,88,12,0.4)]' : 'bg-white/5 text-gray-500'}`}
                  >
                    {isDirty && <motion.span layoutId="glow" className="absolute inset-0 rounded-full bg-orange-400 blur-md opacity-30" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} />}
                    <Save size={24} className="relative z-10" />
                  </motion.button>
                </div>
                
                <div className="sticky top-0 z-30 mb-12 p-1 bg-white/[0.01] border border-white/5 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl">
                  <EditorToolbar execCmd={execCmd} />
                </div>

                <div 
                  ref={editorRef} 
                  contentEditable 
                  spellCheck="false"
                  className="editor-container mt-10 outline-none text-2xl text-gray-300 min-h-[60vh] leading-relaxed pb-40" 
                  onInput={() => setIsDirty(true)} 
                />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center opacity-10">
                <Command size={80} className="mb-8 text-orange-500" />
                <h3 className="text-3xl font-black uppercase tracking-[0.5em]">System Idle</h3>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <NamingModal isOpen={modal.isOpen} type={modal.type} onClose={() => setModal({ ...modal, isOpen: false })} onSubmit={handleCreateSubmit} />
      <DeleteModal isOpen={delModal.isOpen} itemName={delModal.name} itemType={delModal.type === 'file' ? 'Note' : 'Folder'} onClose={() => setDelModal({ ...delModal, isOpen: false })} onConfirm={confirmDelete} />
      <Watermark />
    </div>
  );
};

export default Notes;