// src/components/Notes.jsx
import React, { useState, useEffect, useRef } from "react";
import { ref, set, onValue, remove, update } from "firebase/database";
import { db } from "../Config/firebaseConfig";
import Navbar from "./Navbar";
import Watermark from "./Watermark";
import ClipLoader from "react-spinners/ClipLoader";
import {
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, CheckSquare,
  Folder, FileText, Trash2
} from "lucide-react";
import createSoundFile from "../assets/error.mp3";
import clickSoundFile from "../assets/click.mp3";

/* --------------------------- Notes.jsx (DRY single file, improved) ---------------------------
  - Added nested folders (parent field)
  - You can create a file without making a folder (folder: null)
  - Prefer to open the most recently updated note on load (helps "old files not detected")
  - Minimal structural changes only; original features preserved
  - Small toast system, delete confirmation modal preserved
-------------------------------------------------------------------------------------------*/

const ENCRYPTION_SALT = "notes-app-fixed-salt-please-change"; // change if you want
const ITERATIONS = 100000;

const Notes = ({ user, onSignOut }) => {
  // state
  const [notes, setNotes] = useState({});
  const [folders, setFolders] = useState({});
  const [activeNote, setActiveNote] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [openFolders, setOpenFolders] = useState({});
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [newFolderInput, setNewFolderInput] = useState("");
  const [newFileInput, setNewFileInput] = useState("");
  const [title, setTitle] = useState("");
  const [currentColor, setCurrentColor] = useState("#ffffff");
  const [currentFont, setCurrentFont] = useState("Arial");
  const [currentSize, setCurrentSize] = useState("16px");
  const [loading, setLoading] = useState(true);
  const [leftCollapsed, setLeftCollapsed] = useState(false);

  // modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, id: null, name: "" });

  // toast state (small top-right)
  const [toasts, setToasts] = useState([]);

  // when adding new folder, choose parent option
  const [newFolderParent, setNewFolderParent] = useState(null);

  const editorRef = useRef(null);
  const createSound = useRef(null);
  const clickSound = useRef(null);
  const autoSaveTimer = useRef(null);
  let toastIdCounter = useRef(0);

  // audio init
  useEffect(() => {
    createSound.current = new Audio(createSoundFile);
    clickSound.current = new Audio(clickSoundFile);
    createSound.current.volume = 0.12;
    clickSound.current.volume = 0.08;
  }, []);

  /* --------------------- small DB helpers --------------------- */
  const dbSet = (path, data) => set(ref(db, path), data);
  const dbRemove = (path) => remove(ref(db, path));
  const dbUpdate = (path, data) => update(ref(db, path), data);

  /* --------------------- encryption helpers (AES-GCM) --------------------- */
  async function deriveKeyFromUid(uid) {
    const enc = new TextEncoder();
    const passKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(uid),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: enc.encode(ENCRYPTION_SALT), iterations: ITERATIONS, hash: "SHA-256" },
      passKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  function ab2b64(buf) {
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function b642ab(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  async function encryptText(plain) {
    if (!user?.uid) return { content_enc: null };
    const key = await deriveKeyFromUid(user.uid);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
    const combined = new Uint8Array(iv.byteLength + ct.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ct), iv.byteLength);
    return { content_enc: ab2b64(combined.buffer) };
  }

  async function decryptText(content_enc) {
    if (!user?.uid) return "";
    try {
      const key = await deriveKeyFromUid(user.uid);
      const combined = new Uint8Array(b642ab(content_enc));
      const iv = combined.slice(0, 12);
      const ct = combined.slice(12).buffer;
      const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
      return new TextDecoder().decode(dec);
    } catch (err) {
      console.warn("decrypt failed:", err);
      return "";
    }
  }

  /* --------------------- Toast helpers --------------------- */
  const showToast = (message, kind = "info", timeout = 3000) => {
    const id = ++toastIdCounter.current;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, timeout);
  };

  /* --------------------- utility: build folder tree --------------------- */
  const buildFolderTree = (foldersObj) => {
    const nodes = {};
    Object.keys(foldersObj).forEach(id => {
      nodes[id] = { id, ...foldersObj[id], children: [] };
    });
    const roots = [];
    Object.values(nodes).forEach(node => {
      const parent = node.parent || null;
      if (parent && nodes[parent]) {
        nodes[parent].children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  };

  /* --------------------- load notes & folders (with decryption of active) --------------------- */
  useEffect(() => {
    if (!user) return;
    const notesRef = ref(db, `users/${user.uid}/notes`);
    const foldersRef = ref(db, `users/${user.uid}/folders`);

    const unsubNotes = onValue(notesRef, async (snap) => {
      const raw = snap.val() || {};
      setNotes(raw);

      // if active note exists and is present in raw, make sure editor shows it
      if (activeNote && raw[activeNote]) {
        const note = raw[activeNote];
        setTitle(note.title || "");
        if (note.content_enc) {
          const dec = await decryptText(note.content_enc);
          if (editorRef.current) editorRef.current.innerHTML = dec || note.content || "";
        } else {
          if (editorRef.current) editorRef.current.innerHTML = note.content || "";
        }
      } else {
        // pick note to open: prefer most recently updated, fallback to first key
        const keys = Object.keys(raw);
        if (keys.length > 0) {
          let chosen = keys[0];
          try {
            chosen = keys.reduce((best, k) => {
              const a = raw[best];
              const b = raw[k];
              const aTime = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
              const bTime = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
              return bTime > aTime ? k : best;
            }, keys[0]);
          } catch (_) {}
          setActiveNote(chosen);
          const note = raw[chosen];
          setTitle(note.title || "");
          if (note.content_enc) {
            const dec = await decryptText(note.content_enc);
            if (editorRef.current) editorRef.current.innerHTML = dec || note.content || "";
          } else {
            if (editorRef.current) editorRef.current.innerHTML = note.content || "";
          }
        } else {
          // no notes
          setActiveNote(null);
          setTitle("");
          if (editorRef.current) editorRef.current.innerHTML = "";
        }
      }

      setLoading(false);
    });

    const unsubFolders = onValue(foldersRef, (snap) => {
      const data = snap.val() || {};
      setFolders(data);
      const initialOpen = {};
      Object.keys(data).forEach(id => (initialOpen[id] = true));
      setOpenFolders(initialOpen);
    });

    return () => {
      unsubNotes();
      unsubFolders();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* --------------------- save note (encrypt) --------------------- */
  const saveNote = async () => {
    if (!activeNote || !user) return;
    const rawHtml = editorRef.current ? editorRef.current.innerHTML : "";
    const { content_enc } = await encryptText(rawHtml);
    await dbSet(`users/${user.uid}/notes/${activeNote}`, {
      title,
      content_enc,
      updatedAt: new Date().toISOString(),
      folder: notes[activeNote]?.folder || null,
    });
  };

  /* --------------------- play sound --------------------- */
  const playCreateSound = () => {
    try {
      if (createSound.current) {
        createSound.current.currentTime = 0;
        createSound.current.play();
      }
    } catch (_) {}
  };

  /* --------------------- folder & file ops (now open modal for delete) --------------------- */
  const addFolder = (parent = null) => {
    setEditingFolder("new");
    setNewFolderParent(parent);
  };

  const saveNewFolder = async () => {
    if (!newFolderInput.trim()) {
      showToast("Folder name cannot be empty", "error");
      return;
    }
    if (!user) return;
    const id = Date.now().toString();
    // store parent id for nesting
    await dbSet(`users/${user.uid}/folders/${id}`, { name: newFolderInput, parent: newFolderParent || null });
    setOpenFolders(prev => ({ ...prev, [id]: true }));
    setSelectedFolder(id);
    setEditingFolder(null);
    setNewFolderInput("");
    setNewFolderParent(null);
    playCreateSound();
  };

  const renameFolder = async (folderId, newName) => {
    if (!newName.trim()) {
      showToast("Folder name cannot be empty", "error");
      return;
    }
    if (!user) return;
    await dbUpdate(`users/${user.uid}/folders/${folderId}`, { name: newName });
    setEditingFolder(null);
  };

  // Now opening modal instead of immediate deletion
  const deleteFolder = (folderId) => {
    const name = folders?.[folderId]?.name || "this folder";
    setConfirmModal({ open: true, type: "folder", id: folderId, name });
  };

  const performDeleteFolder = async (folderId) => {
    if (!user) return;
    // delete notes in that folder (and optionally child folders' notes) - recursive
    const collectNotesToDelete = (fid) => {
      let toDelete = [];
      Object.keys(notes).forEach(nid => {
        if (notes[nid].folder === fid) toDelete.push(nid);
      });
      // children
      Object.keys(folders).forEach(childId => {
        if (folders[childId].parent === fid) {
          toDelete = toDelete.concat(collectNotesToDelete(childId));
        }
      });
      return toDelete;
    };
    const notesToDelete = collectNotesToDelete(folderId);
    notesToDelete.forEach(nid => dbRemove(`users/${user.uid}/notes/${nid}`));

    // delete child folders recursively
    const collectFoldersToDelete = (fid) => {
      let fdel = [fid];
      Object.keys(folders).forEach(childId => {
        if (folders[childId].parent === fid) {
          fdel = fdel.concat(collectFoldersToDelete(childId));
        }
      });
      return fdel;
    };
    const foldersToDelete = collectFoldersToDelete(folderId);
    for (const fid of foldersToDelete) {
      await dbRemove(`users/${user.uid}/folders/${fid}`);
    }

    setSelectedFolder(null);
  };

  const addFile = (folderId = null) => setEditingFile("new") || setSelectedFolder(folderId);

  const saveNewFile = async () => {
    if (!newFileInput.trim()) {
      showToast("File name cannot be empty", "error");
      return;
    }
    if (!user) return;
    const id = Date.now().toString();
    const { content_enc } = await encryptText("");
    await dbSet(`users/${user.uid}/notes/${id}`, {
      title: newFileInput,
      content_enc,
      updatedAt: new Date().toISOString(),
      folder: selectedFolder || null
    });
    setActiveNote(id);
    setTitle(newFileInput);
    if (editorRef.current) editorRef.current.innerHTML = "";
    setEditingFile(null);
    setNewFileInput("");
    playCreateSound();
  };

  // Now opening modal instead of immediate deletion
  const deleteNote = (id) => {
    const name = notes?.[id]?.title || "this file";
    setConfirmModal({ open: true, type: "file", id, name });
  };

  const performDeleteNote = async (id) => {
    if (!user) return;
    await dbRemove(`users/${user.uid}/notes/${id}`);
    setActiveNote(null);
    setTitle("");
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  const renameNote = async (noteId, newName) => {
    if (!newName.trim()) {
      showToast("File name cannot be empty", "error");
      return;
    }
    if (!user) return;
    await dbUpdate(`users/${user.uid}/notes/${noteId}`, { title: newName });
    setEditingFile(null);
  };

  const selectNote = async (id) => {
    setActiveNote(id);
    const note = notes[id];
    if (!note) return;
    setTitle(note.title || "");
    if (note.content_enc) {
      const dec = await decryptText(note.content_enc);
      if (editorRef.current) editorRef.current.innerHTML = dec || note.content || "";
    } else {
      if (editorRef.current) editorRef.current.innerHTML = note.content || "";
    }
  };

  /* --------------------- editor commands --------------------- */
  const execCmd = (command, value = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    if (command === "insertTodo") {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.style.marginRight = "8px";
      const span = document.createElement("span");
      span.innerHTML = "&nbsp;";
      const container = document.createElement("div");
      container.appendChild(checkbox);
      container.appendChild(span);
      const sel = window.getSelection();
      if (!sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(container);
      range.setStartAfter(container);
      range.setEndAfter(container);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    if (command === "insertUnorderedList" || command === "insertOrderedList") {
      document.execCommand(command, false, null);
      return;
    }
    document.execCommand(command, false, value);
    if (command === "foreColor") setCurrentColor(value);
    if (command === "fontName") setCurrentFont(value);
    if (command === "fontSize") setCurrentSize(value + "px");
  };

  /* --------------------- drag & drop --------------------- */
  const onDragStart = (e, noteId) => e.dataTransfer.setData("text/plain", noteId);
  const onDrop = async (e, folderId) => {
    const noteId = e.dataTransfer.getData("text/plain");
    if (!noteId || !user) return;
    await dbUpdate(`users/${user.uid}/notes/${noteId}`, { folder: folderId });
    setSelectedFolder(folderId);
  };
  const onDragOver = (e) => e.preventDefault();

  /* --------------------- autosave silent --------------------- */
  useEffect(() => {
    if (!activeNote) return;
    autoSaveTimer.current = setInterval(() => {
      saveNote().catch(err => console.error("autosave failed:", err));
    }, 5000);
    return () => clearInterval(autoSaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNote, title]);

  /* --------------------- responsive left toggle --------------------- */
  const toggleLeft = () => setLeftCollapsed(s => !s);

  if (!user) return <div className="min-h-screen flex items-center justify-center"><ClipLoader color="#f97316" size={50} /></div>;

  /* --------------------- small render helpers (DRY) --------------------- */
  const RenderFileRow = ({ noteId }) => (
    <div
      key={noteId}
      onClick={() => selectNote(noteId)}
      onContextMenu={(e) => { e.preventDefault(); setEditingFile(noteId); }}
      draggable
      onDragStart={(e) => onDragStart(e, noteId)}
      className={`flex items-center justify-between p-1 cursor-pointer rounded-lg ${activeNote === noteId ? "bg-orange-600/50" : "hover:bg-white/10"} transition-all duration-200`}
    >
      <span className="flex items-center gap-2">
        <FileText size={14} />
        {editingFile === noteId ? (
          <input type="text" defaultValue={notes[noteId].title} autoFocus onBlur={(e) => renameNote(noteId, e.target.value)} className="bg-gray-700/50 text-white rounded px-1" />
        ) : (
          <span className="flex items-center gap-2">
            <span>{notes[noteId].title}</span>
            <button onClick={(e) => { e.stopPropagation(); setEditingFile(noteId); }} className="text-gray-400 hover:text-white text-xs ml-1" title="Edit file name">✎</button>
          </span>
        )}
      </span>
      <button onClick={(e) => { e.stopPropagation(); deleteNote(noteId); }} className="text-red-500 hover:text-red-400">X</button>
    </div>
  );

  const RenderFolderRecursive = ({ node, level = 0 }) => {
    const folderNotes = Object.keys(notes).filter(nid => notes[nid].folder === node.id);
    const isOpen = openFolders[node.id] || false;
    return (
      <div key={node.id} className="flex flex-col">
        <div
          onClick={() => { setOpenFolders(prev => ({ ...prev, [node.id]: !prev[node.id] })); setSelectedFolder(node.id); }}
          onDrop={(e) => onDrop(e, node.id)}
          onDragOver={onDragOver}
          className={`flex items-center justify-between cursor-pointer p-2 rounded-lg ${selectedFolder === node.id ? "bg-gray-700/50" : "hover:bg-white/10"} transition-all duration-200`}>
          <div className="flex items-center gap-2">
            <Folder size={16} className={`transform transition-transform duration-150 ${isOpen ? "rotate-90" : "rotate-0"}`} />
            {editingFolder === node.id ? (
              <input
                type="text"
                defaultValue={folders[node.id].name}
                autoFocus
                onBlur={(e) => renameFolder(node.id, e.target.value)}
                className="bg-gray-700/50 text-white rounded px-1"
              />
            ) : (
              <span className="flex items-center gap-2">
                <span className="font-medium">{folders[node.id].name}</span>
                <button onClick={(e) => { e.stopPropagation(); setEditingFolder(node.id); }} className="text-gray-400 hover:text-white ml-1" title="Edit folder name">✎</button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); addFolder(node.id); }} className="text-green-400 hover:text-green-300 text-sm">+Sub</button>
            <button onClick={(e) => { e.stopPropagation(); deleteFolder(node.id); }} className="text-red-500 hover:text-red-400"><Trash2 size={14} /></button>
          </div>
        </div>

        {isOpen && folderNotes.length > 0 && (
          <div className="pl-6 mt-1 space-y-1">
            {folderNotes.map(nid => <RenderFileRow key={nid} noteId={nid} />)}
          </div>
        )}

        {isOpen && node.children.length > 0 && (
          <div className="pl-4 mt-2 space-y-2">
            {node.children.map(child => <RenderFolderRecursive key={child.id} node={child} />)}
          </div>
        )}
      </div>
    );
  };

  /* --------------------- render UI --------------------- */
  const folderRoots = buildFolderTree(folders);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-gray-100">
      <Navbar user={user} onSignOut={onSignOut} />

      <div className="flex flex-col md:flex-row pt-20">
        {/* Left Panel */}
        <aside className={`transition-all duration-300 ${leftCollapsed ? "w-0 md:w-16 overflow-hidden" : "w-full md:w-1/4"} bg-black/30 backdrop-blur-lg border-r border-gray-700 p-4 h-screen`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button onClick={toggleLeft} className="md:hidden text-gray-300 px-2 py-1 rounded bg-black/40">☰</button>
              {!leftCollapsed && <h3 className="text-white font-semibold">Files</h3>}
            </div>
            {!leftCollapsed && (
              <div className="flex gap-2">
                <button onClick={() => addFolder(null)} className="py-1 px-2 bg-green-600 rounded text-white text-sm">+ Folder</button>
                <button onClick={() => { setSelectedFolder(null); addFile(null); }} className="py-1 px-2 bg-orange-600 rounded text-white text-sm">+ File</button>
              </div>
            )}
          </div>

          {!leftCollapsed && (
            <div className="space-y-3 overflow-auto h-[calc(100vh-7.5rem)] pr-2">
              {/* New folder input */}
              {editingFolder === "new" && (
                <div className="flex gap-2 items-center">
                  <input type="text" value={newFolderInput} onChange={(e) => setNewFolderInput(e.target.value)} placeholder="Folder name..." className="flex-1 bg-gray-800 text-white rounded px-2 py-1" autoFocus />
                  <select value={newFolderParent || ""} onChange={(e) => setNewFolderParent(e.target.value || null)} className="bg-gray-800 text-white rounded px-2 py-1">
                    <option value="">No parent (root)</option>
                    {Object.keys(folders).map(fid => <option key={fid} value={fid}>{folders[fid].name}</option>)}
                  </select>
                  <button onClick={saveNewFolder} className="bg-green-600 px-3 py-1 rounded text-white">Save</button>
                </div>
              )}

              {/* New file input */}
              {editingFile === "new" && (
                <div className="flex gap-2">
                  <input type="text" value={newFileInput} onChange={(e) => setNewFileInput(e.target.value)} placeholder="File name..." className="flex-1 bg-gray-800 text-white rounded px-2 py-1" autoFocus />
                  <button onClick={saveNewFile} className="bg-orange-600 px-3 py-1 rounded text-white">Save</button>
                </div>
              )}

              {/* Folders */}
              {loading ? (
                <div className="flex justify-center mt-10"><ClipLoader color="#f97316" size={28} /></div>
              ) : Object.keys(folders).length === 0 ? (
                <p className="text-gray-400">No folders yet.</p>
              ) : (
                <div className="space-y-2">
                  {folderRoots.map(root => <RenderFolderRecursive key={root.id} node={root} />)}
                </div>
              )}

              {/* show loose files (not in any folder) */}
              <div className="mt-4">
                <h4 className="text-sm text-gray-300 mb-2">Files (no folder)</h4>
                <div className="space-y-1">
                  {Object.keys(notes).filter(nid => !notes[nid].folder).map(nid => <RenderFileRow key={nid} noteId={nid} />)}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Right Panel */}
        <main className="w-full md:w-3/4 p-6 h-screen overflow-auto">
          {activeNote ? (
            <div className="space-y-4">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveNote} className="w-full bg-black/20 backdrop-blur-md border border-gray-700 p-2 rounded-lg text-white font-semibold text-xl" />

              {/* Toolbar */}
              <div className="flex flex-wrap gap-2 mb-2">
                <select value={currentFont} onChange={(e) => execCmd("fontName", e.target.value)} className="p-1 rounded bg-black/20 border border-gray-700 text-white">
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Inter">Inter</option>
                </select>

                <select value={parseInt(currentSize)} onChange={(e) => execCmd("fontSize", e.target.value)} className="p-1 rounded bg-black/20 border border-gray-700 text-white">
                  {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32].map(size => <option key={size} value={size}>{size}px</option>)}
                </select>

                <input type="color" value={currentColor} onChange={(e) => execCmd("foreColor", e.target.value)} className="w-10 h-10 p-0 rounded border border-gray-700" />

                <button onClick={() => execCmd("bold")} className="px-2 py-1 bg-gray-700/50 rounded text-white"><Bold size={16} /></button>
                <button onClick={() => execCmd("italic")} className="px-2 py-1 bg-gray-700/50 rounded text-white"><Italic size={16} /></button>
                <button onClick={() => execCmd("underline")} className="px-2 py-1 bg-gray-700/50 rounded text-white"><Underline size={16} /></button>

                <button onClick={() => execCmd("justifyLeft")} className="px-2 py-1 bg-gray-700/50 rounded text-white"><AlignLeft size={16} /></button>
                <button onClick={() => execCmd("justifyCenter")} className="px-2 py-1 bg-gray-700/50 rounded text-white"><AlignCenter size={16} /></button>
                <button onClick={() => execCmd("justifyRight")} className="px-2 py-1 bg-gray-700/50 rounded text-white"><AlignRight size={16} /></button>

                <button onClick={() => execCmd("insertOrderedList")} className="px-2 py-1 bg-gray-700/50 rounded text-white"><ListOrdered size={16} /></button>
                <button onClick={() => execCmd("insertUnorderedList")} className="px-2 py-1 bg-gray-700/50 rounded text-white"><List size={16} /></button>
                <button onClick={() => execCmd("insertTodo")} className="px-2 py-1 bg-gray-700/50 rounded text-white"><CheckSquare size={16} /></button>

                <button onClick={saveNote} className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg">Save</button>
              </div>

              {/* Editor */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                style={{ minHeight: "60vh", padding: "10px", borderRadius: "10px", fontSize: currentSize, color: currentColor, fontFamily: currentFont, backgroundColor: "rgba(255,255,255,0.05)" }}
                className="w-full outline-none resize-none overflow-auto bg-black/20 backdrop-blur-md p-4"
              />
            </div>
          ) : (
            <p className="text-gray-400">Select a note or create a new one.</p>
          )}
        </main>
      </div>

      <Watermark />

      {/* ------------------ Toasts (top-right small) ------------------ */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`min-w-[200px] px-3 py-2 rounded shadow ${t.kind === "error" ? "bg-red-700 text-white" : "bg-gray-800 text-white"}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* ------------------ Confirm Modal (centered dark gray) ------------------ */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmModal({ open: false, type: null, id: null, name: "" })} />
          <div className="relative z-70 bg-[#222226] max-w-lg w-full mx-4 rounded-lg p-6 shadow-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Are you sure?</h3>
            <p className="text-gray-300 mb-4">You are about to delete <span className="font-medium text-white">{confirmModal.name}</span>. This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ open: false, type: null, id: null, name: "" })}
                className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // perform deletion according to type
                  const { type, id } = confirmModal;
                  setConfirmModal({ open: false, type: null, id: null, name: "" });
                  if (type === "folder") await performDeleteFolder(id);
                  if (type === "file") await performDeleteNote(id);
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
