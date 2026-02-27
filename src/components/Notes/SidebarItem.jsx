import React from "react";
import { Folder, FileText, ChevronRight, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const FileRow = ({ 
  noteId, noteData, activeNote, selectNote, onDragStart, onContextMenu, onDelete 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={() => selectNote(noteId)}
    onContextMenu={(e) => onContextMenu(e, 'file', noteId, noteData.title)}
    draggable
    onDragStart={(e) => onDragStart(e, noteId)}
    className={`group flex items-center justify-between px-4 py-2.5 my-1 cursor-pointer rounded-xl transition-all duration-300 border ${
      activeNote === noteId 
        ? "bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_4px_20px_rgba(249,115,22,0.1)]" 
        : "hover:bg-white/[0.05] text-gray-400 hover:text-gray-100 border-transparent"
    }`}
  >
    <div className="flex items-center gap-3 overflow-hidden">
      <FileText size={16} className={activeNote === noteId ? "text-orange-400" : "text-gray-500"} />
      <span className="truncate text-sm font-medium tracking-tight">{noteData.title}</span>
    </div>
    
    <button 
      onClick={(e) => { e.stopPropagation(); onDelete('file', noteId, noteData.title); }}
      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg transition-all"
    >
      <Trash2 size={14} />
    </button>
  </motion.div>
);

export const RenderFolderRecursive = ({
  node, notes, folders, openFolders, setOpenFolders, selectedFolder, setSelectedFolder,
  onDrop, activeNote, selectNote, onDragStart, onContextMenu, onDelete
}) => {
  const folderNotes = Object.keys(notes).filter((nid) => notes[nid].folder === node.id);
  const isOpen = openFolders[node.id] || false;

  return (
    <div className="flex flex-col mb-1">
      <div
        onClick={() => {
          setOpenFolders((p) => ({ ...p, [node.id]: !p[node.id] }));
          setSelectedFolder(node.id);
        }}
        onContextMenu={(e) => onContextMenu(e, 'folder', node.id, node.name)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onDrop(e, node.id); }}
        className={`group flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 border ${
          selectedFolder === node.id ? "bg-white/[0.08] border-white/10" : "hover:bg-white/[0.04] border-transparent"
        }`}
      >
        <div className="flex items-center gap-3">
          <ChevronRight size={14} className={`text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-90 text-orange-500" : ""}`} />
          <Folder size={18} className={isOpen ? "text-orange-500 fill-orange-500/10" : "text-gray-400"} />
          <span className="text-sm font-bold text-gray-200 tracking-tight">{node.name}</span>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onDelete('folder', node.id, node.name); }}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="ml-6 pl-2 border-l border-white/5 mt-1 space-y-0.5">
              {node.children.map((child) => (
                <RenderFolderRecursive key={child.id} node={child} {...{notes, folders, openFolders, setOpenFolders, selectedFolder, setSelectedFolder, onDrop, activeNote, selectNote, onDragStart, onContextMenu, onDelete}} />
              ))}
              {folderNotes.map((nid) => (
                <FileRow key={nid} noteId={nid} noteData={notes[nid]} {...{activeNote, selectNote, onDragStart, onContextMenu, onDelete}} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};