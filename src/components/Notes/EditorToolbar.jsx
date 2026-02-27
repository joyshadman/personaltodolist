import React, { useState } from "react";
import { 
  Bold, Italic, Underline, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, Type, 
  Palette, Undo2, Redo2, Heading1, Heading2, 
  Highlighter, Quote, Strikethrough, Code, ChevronDown,
  Settings2, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EditorToolbar = ({ execCmd }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSizeChange = (sizeValue) => {
    document.execCommand("fontSize", false, sizeValue);
    const editor = document.querySelector('.editor-container');
    if (editor) editor.focus();
  };

  const toolGroups = [
    {
      name: "History",
      tools: [
        { icon: <Undo2 size={16} />, cmd: "undo", label: "Undo" },
        { icon: <Redo2 size={16} />, cmd: "redo", label: "Redo" },
      ]
    },
    {
      name: "Typography",
      tools: [
        { icon: <Heading1 size={16} />, cmd: "formatBlock", val: "H1", label: "Heading 1" },
        { icon: <Heading2 size={16} />, cmd: "formatBlock", val: "Heading 2", label: "Heading 2" },
        { icon: <Quote size={16} />, cmd: "formatBlock", val: "BLOCKQUOTE", label: "Quote" },
      ]
    },
    {
      name: "Format",
      tools: [
        { icon: <Bold size={16} />, cmd: "bold", label: "Bold" },
        { icon: <Italic size={16} />, cmd: "italic", label: "Italic" },
        { icon: <Underline size={16} />, cmd: "underline", label: "Underline" },
        { icon: <Strikethrough size={16} />, cmd: "strikeThrough", label: "Strikethrough" },
        { icon: <Code size={16} />, cmd: "formatBlock", val: "PRE", label: "Code" },
      ]
    },
    {
      name: "Alignment",
      tools: [
        { icon: <AlignLeft size={16} />, cmd: "justifyLeft", label: "Left" },
        { icon: <AlignCenter size={16} />, cmd: "justifyCenter", label: "Center" },
        { icon: <AlignRight size={16} />, cmd: "justifyRight", label: "Right" },
      ]
    }
  ];

  const ToolbarContent = () => (
    <div className="flex flex-col md:flex-row items-start md:items-center flex-wrap gap-2 md:gap-1">
      {toolGroups.map((group, gIndex) => (
        <React.Fragment key={gIndex}>
          <div className="flex items-center flex-wrap gap-1 md:gap-0.5 px-1">
            {group.tools.map((tool, tIndex) => (
              <motion.button
                key={tIndex}
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.9 }}
                onMouseDown={(e) => {
                  e.preventDefault(); 
                  execCmd(tool.cmd, tool.val);
                }}
                className="p-2.5 md:p-2 text-gray-400 hover:text-orange-500 rounded-xl transition-all relative group"
              >
                {tool.icon}
                <span className="hidden md:block absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-[100]">
                  {tool.label}
                </span>
              </motion.button>
            ))}
          </div>
          {gIndex !== toolGroups.length - 1 && (
            <div className="hidden md:block w-[1px] h-5 bg-white/10 self-center mx-1" />
          )}
        </React.Fragment>
      ))}

      <div className="w-full h-[1px] md:w-[1px] md:h-5 bg-white/10 my-2 md:my-0 md:mx-1" />

      {/* TEXT SIZE SELECTOR */}
      <div className="flex items-center px-3 py-2 md:py-1 bg-white/[0.05] rounded-xl border border-white/5 hover:border-orange-500/40 transition-all w-full md:w-auto">
        <Type size={14} className="text-orange-500" />
        <select 
          className="size-select flex-1"
          onChange={(e) => handleSizeChange(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()} 
          defaultValue="3"
        >
          <option value="1">14px</option>
          <option value="2">18px</option>
          <option value="3">24px</option>
          <option value="4">32px</option>
          <option value="5">48px</option>
          <option value="6">64px</option>
          <option value="7">96px</option>
        </select>
        <ChevronDown size={10} className="text-gray-600" />
      </div>

      <div className="hidden md:block w-[1px] h-5 bg-white/10 self-center mx-1" />

      {/* COLOR PICKERS */}
      <div className="flex items-center gap-6 md:gap-4 px-3 py-2 md:py-0">
        <div className="flex items-center gap-2 group cursor-pointer relative">
          <Palette size={14} className="text-gray-500 group-hover:text-orange-400" />
          <input 
            type="color" 
            onInput={(e) => execCmd("foreColor", e.target.value)}
            className="w-6 h-6 md:w-5 md:h-5 bg-transparent border-none cursor-pointer scale-125"
          />
        </div>
        <div className="flex items-center gap-2 group cursor-pointer relative">
          <Highlighter size={14} className="text-gray-500 group-hover:text-yellow-400" />
          <input 
            type="color" 
            defaultValue="#ffff00"
            onInput={(e) => execCmd("hiliteColor", e.target.value)}
            className="w-6 h-6 md:w-5 md:h-5 bg-transparent border-none cursor-pointer scale-125"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .editor-container font[size="1"] { font-size: 14px; }
        .editor-container font[size="2"] { font-size: 18px; }
        .editor-container font[size="3"] { font-size: 24px; }
        .editor-container font[size="4"] { font-size: 32px; }
        .editor-container font[size="5"] { font-size: 48px; }
        .editor-container font[size="6"] { font-size: 64px; }
        .editor-container font[size="7"] { font-size: 96px; }

        .size-select {
          appearance: none;
          background: transparent;
          border: none;
          color: #9ca3af;
          font-size: 11px;
          font-weight: 900;
          outline: none;
          cursor: pointer;
          padding: 0 8px;
          text-transform: uppercase;
        }
        .size-select option { background: #111; color: white; padding: 10px; }
      `}</style>

      {/* DESKTOP VIEW */}
      <div className="hidden md:flex items-center gap-1 p-1.5 bg-white/[0.02] border border-white/[0.08] rounded-[1.5rem] backdrop-blur-3xl shadow-2xl">
        <ToolbarContent />
      </div>

      {/* MOBILE VIEW - FIXED AND ANIMATED */}
      <div className="md:hidden fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.8, y: 50, filter: "blur(10px)" }}
              className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 p-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-[85vw] max-w-[320px] mb-2 overflow-hidden"
            >
              <div className="max-h-[60vh] overflow-y-auto pr-1">
                 <ToolbarContent />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(249,115,22,0.4)] border border-orange-400/30 relative z-[10001]"
        >
          {isMobileMenuOpen ? (
            <motion.div initial={{ rotate: -90 }} animate={{ rotate: 0 }}><X size={28} /></motion.div>
          ) : (
            <motion.div initial={{ rotate: 90 }} animate={{ rotate: 0 }}><Settings2 size={28} /></motion.div>
          )}
        </motion.button>
      </div>

      {/* Spacer to prevent content from being hidden behind fixed elements */}
      <div className="md:hidden h-20" />
    </>
  );
};

export default EditorToolbar;