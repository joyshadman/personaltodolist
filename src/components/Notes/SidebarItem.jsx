// src/components/Notes/NoteTree.jsx
import React, { useState } from "react";
import { Folder, FileText, ChevronRight, Trash2, Pencil, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Inline Edit Component
 * Used for both Files and Folders to provide a glassy input field.
 */
const InlineRenameInput = ({ initialValue, onSave, onCancel }) => {
  const [val, setVal] = useState(initialValue);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") onSave(val);
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="flex items-center gap-2 w-full bg-white/5 p-1 rounded-lg border border-white/10">
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={handleKeyDown}
        className="bg-transparent text-xs md:text-sm text-white outline-none w-full px-1 font-medium"
      />
      <button onClick={() => onSave(val)} className="text-green-500 hover:text-green-400 p-0.5">
        <Check size={14} />
      </button>
      <button onClick={onCancel} className="text-gray-500 hover:text-white p-0.5">
        <X size={14} />
      </button>
    </div>
  );
};

export const FileRow = ({ 
  noteId, noteData, activeNote, selectNote, onDragStart, onContextMenu, onDelete, onRename 
}) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      onClick={() => !isEditing && selectNote(noteId)}
      className={`group flex items-center justify-between px-3 py-2 md:px-4 md:py-2.5 my-1 cursor-pointer rounded-xl transition-all duration-300 border backdrop-blur-md ${
        activeNote === noteId 
          ? "bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-[0_8px_20px_rgba(249,115,22,0.15)]" 
          : "bg-white/[0.02] hover:bg-white/[0.06] text-gray-400 hover:text-gray-100 border-white/[0.03] hover:border-white/10"
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
        <FileText size={16} className={`shrink-0 ${activeNote === noteId ? "text-orange-400" : "text-gray-500"}`} />
        {isEditing ? (
          <InlineRenameInput 
            initialValue={noteData.title} 
            onSave={(newTitle) => { onRename('file', noteId, newTitle); setIsEditing(false); }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <span className="truncate text-xs md:text-sm font-medium tracking-tight">
            {noteData.title}
          </span>
        )}
      </div>
      
      {!isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="p-1.5 hover:bg-white/10 text-gray-500 hover:text-orange-400 rounded-lg transition-all"
          >
            <Pencil size={13} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete('file', noteId, noteData.title); }}
            className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export const RenderFolderRecursive = ({
  node, notes, folders, openFolders, setOpenFolders, selectedFolder, setSelectedFolder,
  onDrop, activeNote, selectNote, onDragStart, onContextMenu, onDelete, onRename,
  isRoot = false // Added flag to handle scrolling on the root container
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const folderNotes = Object.keys(notes).filter((nid) => notes[nid].folder === node.id);
  const isOpen = openFolders[node.id] || false;
  const isSelected = selectedFolder === node.id;

  // Custom Scrollbar Logic injected via Style Tag
  const scrollbarCSS = `
    .sidebar-scroll::-webkit-scrollbar { width: 4px; }
    .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
    .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
    .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(249, 115, 22, 0.5); }
  `;

  const content = (
    <div className="flex flex-col mb-1 w-full overflow-hidden">
      <div
        onClick={() => {
          if(!isEditing) {
            setOpenFolders((p) => ({ ...p, [node.id]: !p[node.id] }));
            setSelectedFolder(node.id);
          }
        }}
        className={`group flex items-center justify-between px-3 py-2 md:px-4 md:py-2.5 rounded-xl cursor-pointer transition-all duration-300 border backdrop-blur-lg ${
          isSelected 
            ? "bg-white/[0.1] border-white/20 shadow-lg" 
            : "bg-white/[0.01] hover:bg-white/[0.04] border-transparent"
        }`}
      >
        <div className="flex items-center gap-2 md:gap-3 overflow-hidden flex-1">
          <ChevronRight 
            size={14} 
            className={`shrink-0 text-gray-500 transition-transform duration-500 ${isOpen ? "rotate-90 text-orange-500" : ""}`} 
          />
          <Folder size={18} className={`shrink-0 ${isOpen ? "text-orange-500 fill-orange-500/10" : "text-gray-400"}`} />
          {isEditing ? (
            <InlineRenameInput 
              initialValue={node.name} 
              onSave={(newName) => { onRename('folder', node.id, newName); setIsEditing(false); }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <span className="text-xs md:text-sm font-bold text-gray-200 tracking-tight truncate">
              {node.name}
            </span>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="p-1.5 hover:bg-white/10 text-gray-500 hover:text-orange-400 rounded-lg transition-all"
            >
              <Pencil size={13} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete('folder', node.id, node.name); }}
              className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg transition-all"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-4 md:ml-6 pl-2 border-l border-white/[0.05] mt-1 space-y-0.5">
              {node.children.map((child) => (
                <RenderFolderRecursive 
                  key={child.id} 
                  node={child} 
                  {...{notes, folders, openFolders, setOpenFolders, selectedFolder, setSelectedFolder, onDrop, activeNote, selectNote, onDragStart, onContextMenu, onDelete, onRename}} 
                />
              ))}
              {folderNotes.map((nid) => (
                <FileRow 
                  key={nid} 
                  noteId={nid} 
                  noteData={notes[nid]} 
                  {...{activeNote, selectNote, onDragStart, onContextMenu, onDelete, onRename}} 
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // If this is the root call, wrap it in a scrollable div
  if (isRoot) {
    return (
      <>
        <style>{scrollbarCSS}</style>
        <div className="sidebar-scroll overflow-y-auto max-h-[calc(100vh-200px)] pr-2 transition-all">
          {content}
        </div>
      </>
    );
  }

  return content;
};