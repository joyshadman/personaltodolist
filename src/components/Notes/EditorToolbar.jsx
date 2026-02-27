import React from "react";
import { 
  Bold, Italic, Underline, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, Type, 
  Palette, Undo2, Redo2, Heading1, Heading2, 
  Highlighter, Quote, Strikethrough, Code, ChevronDown
} from "lucide-react";
import { motion } from "framer-motion";

const EditorToolbar = ({ execCmd }) => {
  
  const handleSizeChange = (sizeValue) => {
    // 1. Force the document to execute the font size command
    // This works on selection OR sets the state for the next character typed
    document.execCommand("fontSize", false, sizeValue);
    
    // 2. Standardize focus back to the editor if it was lost
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
        { icon: <Heading2 size={16} />, cmd: "formatBlock", val: "H2", label: "Heading 2" },
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
    },
    {
      name: "Lists",
      tools: [
        { icon: <List size={16} />, cmd: "insertUnorderedList", label: "Bullets" },
        { icon: <ListOrdered size={16} />, cmd: "insertOrderedList", label: "Numbers" },
      ]
    }
  ];

  return (
    <>
      <style>{`
        /* MAPS BROWSER FONT SIZES TO LARGE PIXELS */
        .editor-container font[size="1"] { font-size: 14px; }
        .editor-container font[size="2"] { font-size: 18px; }
        .editor-container font[size="3"] { font-size: 24px; }
        .editor-container font[size="4"] { font-size: 32px; }
        .editor-container font[size="5"] { font-size: 48px; }
        .editor-container font[size="6"] { font-size: 64px; }
        .editor-container font[size="7"] { font-size: 96px; }

        .editor-container h1 { font-size: 3.5rem; font-weight: 900; color: white; margin: 1rem 0; line-height: 1.1; }
        .editor-container h2 { font-size: 2.2rem; font-weight: 800; color: #f97316; margin: 0.8rem 0; }
        .editor-container blockquote { border-left: 4px solid #f97316; padding-left: 1.5rem; font-style: italic; color: #9ca3af; margin: 1.5rem 0; background: rgba(255,255,255,0.02); padding-block: 0.5rem;}
        .editor-container pre { background: rgba(0,0,0,0.3); padding: 1.2rem; border-radius: 1rem; font-family: 'JetBrains Mono', monospace; border: 1px solid rgba(255,255,255,0.1); color: #fdba74; }
        
        .size-select {
          appearance: none;
          background: transparent;
          border: none;
          color: #9ca3af;
          font-size: 11px;
          font-weight: 900;
          outline: none;
          cursor: pointer;
          padding: 0 4px;
          text-transform: uppercase;
        }
        .size-select option { background: #111; color: white; padding: 10px; }
      `}</style>

      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center flex-wrap gap-1 p-1.5 bg-white/[0.02] border border-white/[0.08] rounded-[1.5rem] backdrop-blur-3xl shadow-2xl"
      >
        {toolGroups.map((group, gIndex) => (
          <React.Fragment key={gIndex}>
            <div className="flex items-center gap-0.5 px-1">
              {group.tools.map((tool, tIndex) => (
                <motion.button
                  key={tIndex}
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.9 }}
                  onMouseDown={(e) => {
                    e.preventDefault(); 
                    execCmd(tool.cmd, tool.val);
                  }}
                  className="p-2 text-gray-400 hover:text-orange-500 rounded-xl transition-all relative group"
                >
                  {tool.icon}
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-[100]">
                    {tool.label}
                  </span>
                </motion.button>
              ))}
            </div>
            {gIndex !== toolGroups.length - 1 && (
              <div className="w-[1px] h-5 bg-white/10 self-center mx-1" />
            )}
          </React.Fragment>
        ))}

        <div className="w-[1px] h-5 bg-white/10 self-center mx-1" />

        {/* UNIVERSAL TEXT SIZE SELECTOR */}
        <div className="flex items-center px-3 py-1 bg-white/[0.05] rounded-xl border border-white/5 hover:border-orange-500/40 transition-all">
          <Type size={14} className="text-orange-500" />
          <select 
            className="size-select"
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

        <div className="w-[1px] h-5 bg-white/10 self-center mx-1" />

        <div className="flex items-center gap-4 px-3">
          <div className="flex items-center gap-2 group cursor-pointer relative">
            <Palette size={14} className="text-gray-500 group-hover:text-orange-400" />
            <input 
              type="color" 
              onInput={(e) => execCmd("foreColor", e.target.value)}
              className="w-5 h-5 bg-transparent border-none cursor-pointer scale-125"
            />
          </div>
          <div className="flex items-center gap-2 group cursor-pointer relative">
            <Highlighter size={14} className="text-gray-500 group-hover:text-yellow-400" />
            <input 
              type="color" 
              defaultValue="#ffff00"
              onInput={(e) => execCmd("hiliteColor", e.target.value)}
              className="w-5 h-5 bg-transparent border-none cursor-pointer scale-125"
            />
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default EditorToolbar;