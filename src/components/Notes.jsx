// src/components/Notes.jsx
import React, { useState, useEffect, useRef } from "react";
import { ref, set, onValue } from "firebase/database";
import { db } from "../Config/firebaseConfig";
import Navbar from "./Navbar";
import Watermark from "./Watermark";
import ClipLoader from "react-spinners/ClipLoader";
import clickSoundFile from "../assets/click.mp3";
import errorSoundFile from "../assets/error.mp3";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CheckSquare
} from "lucide-react";

const Notes = ({ user, onSignOut }) => {
  const [notes, setNotes] = useState({});
  const [activeNote, setActiveNote] = useState(null);
  const [title, setTitle] = useState("");
  const [currentColor, setCurrentColor] = useState("#ffffff");
  const [loading, setLoading] = useState(true);

  const editorRef = useRef(null);
  const clickSound = useRef(new Audio(clickSoundFile));
  const errorSound = useRef(new Audio(errorSoundFile));

  clickSound.current.volume = 0.1;
  errorSound.current.volume = 0.1;

  useEffect(() => {
    if (!user) return;
    const userNotesRef = ref(db, `users/${user.uid}/notes`);

    const unsubscribe = onValue(userNotesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setNotes(data);

      if (!activeNote && Object.keys(data).length > 0) {
        const firstKey = Object.keys(data)[0];
        setActiveNote(firstKey);
        setTitle(data[firstKey].title);
        if (editorRef.current) editorRef.current.innerHTML = data[firstKey].content;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, activeNote]);

  const saveNote = () => {
    if (!activeNote || !user) return;
    set(ref(db, `users/${user.uid}/notes/${activeNote}`), {
      title,
      content: editorRef.current.innerHTML,
      updatedAt: new Date().toISOString(),
    });
    clickSound.current.play();
  };

  const addNewNote = () => {
    if (!user) return;
    try {
      const newId = Date.now().toString();
      set(ref(db, `users/${user.uid}/notes/${newId}`), {
        title: "New Note",
        content: "",
        updatedAt: new Date().toISOString(),
      });
      setActiveNote(newId);
      setTitle("New Note");
      if (editorRef.current) editorRef.current.innerHTML = "";
      clickSound.current.play();
    } catch (err) {
      console.error(err);
      errorSound.current.play();
    }
  };

  const deleteNote = (id) => {
    if (!id || !user) return;
    set(ref(db, `users/${user.uid}/notes/${id}`), null);
    clickSound.current.play();
    setActiveNote(null);
    setTitle("");
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  const selectNote = (id) => {
    setActiveNote(id);
    const note = notes[id];
    if (note) {
      setTitle(note.title);
      if (editorRef.current) editorRef.current.innerHTML = note.content;
    }
  };

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

    document.execCommand(command, false, value);
    if (command === "foreColor") setCurrentColor(value);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ClipLoader color="#f97316" size={50} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-gray-100">
      <Navbar user={user} onSignOut={onSignOut} />

      <div className="flex flex-col md:flex-row pt-20">
        {/* Left Panel */}
        <div className="w-full md:w-1/4 bg-black/30 backdrop-blur-lg border-r border-gray-700 p-4 h-screen overflow-auto space-y-3">
          <button
            onClick={addNewNote}
            className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition"
          >
            + New Note
          </button>

          {loading ? (
            <div className="flex justify-center mt-10">
              <ClipLoader color="#f97316" size={35} />
            </div>
          ) : Object.keys(notes).length === 0 ? (
            <p className="text-gray-400 mt-4">No notes yet.</p>
          ) : (
            Object.keys(notes).map((id) => (
              <div
                key={id}
                onClick={() => selectNote(id)}
                className={`p-2 cursor-pointer rounded-lg ${activeNote === id ? "bg-orange-600/50" : "hover:bg-white/10"} transition`}
              >
                <div className="flex justify-between items-center">
                  <span>{notes[id].title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(id);
                    }}
                    className="text-red-500 hover:text-red-400"
                  >
                    X
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-3/4 p-6 h-screen overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <ClipLoader color="#f97316" size={50} />
            </div>
          ) : activeNote ? (
            <div className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveNote}
                className="w-full bg-black/20 backdrop-blur-md border border-gray-700 p-2 rounded-lg text-white font-semibold text-xl"
              />

              {/* Toolbar */}
              <div className="flex flex-wrap gap-2 mb-2">
                <select
                  onChange={(e) => execCmd("fontName", e.target.value)}
                  className="p-1 rounded bg-black/20 backdrop-blur-md border border-gray-700 text-white"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Inter">Inter</option>
                </select>
                <select
                  onChange={(e) => execCmd("fontSize", e.target.value)}
                  className="p-1 rounded bg-black/20 backdrop-blur-md border border-gray-700 text-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((size) => (
                    <option key={size} value={size}>{size * 2 + 8}px</option>
                  ))}
                </select>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => execCmd("foreColor", e.target.value)}
                  className="w-10 h-10 p-0 rounded border border-gray-700"
                />

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
                style={{
                  minHeight: "60vh",
                  padding: "10px",
                  borderRadius: "10px",
                  fontSize: "16px",
                  color: "#ffffff",
                  backgroundColor: "rgba(255,255,255,0.05)",
                }}
                className="w-full outline-none resize-none overflow-auto bg-black/20 backdrop-blur-md p-4"
              />
            </div>
          ) : (
            <p className="text-gray-400">Select a note or create a new one.</p>
          )}
        </div>
      </div>

      <Watermark />
    </div>
  );
};

export default Notes;
