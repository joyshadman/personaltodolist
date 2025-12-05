// src/components/Watermark.jsx
import React, { useState } from "react";
import { FiMenu, FiX, FiGithub, FiLinkedin } from "react-icons/fi";

const Watermark = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* Name + Hamburger + Status dot */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3">
        {/* Status dot + Name/Role */}
        <div className="flex items-center gap-2 select-none">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div className="flex flex-col">
            <span className="text-sm md:text-base font-bold text-white/80 hover:text-white transition-colors">
              Joy Shadman
            </span>
            <span className="text-xs md:text-sm text-gray-400">
              Full Stack Developer
            </span>
          </div>
        </div>

        {/* Hamburger button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-all duration-300 shadow-md cursor-pointer"
        >
          {isOpen ? (
            <FiX className="w-5 h-5 text-white" />
          ) : (
            <FiMenu className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Dropdown links */}
      {isOpen && (
        <div className="fixed bottom-16 left-4 z-50 flex flex-col gap-3 p-4 bg-black/40 backdrop-blur-md rounded-xl border border-gray-700 shadow-lg animate-slideUp">
          <a
            href="https://github.com/joyshadman"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 hover:scale-110"
          >
            <FiGithub className="w-5 h-5" /> GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/joy-shadman-30067526a/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 hover:scale-110"
          >
            <FiLinkedin className="w-5 h-5" /> LinkedIn
          </a>
        </div>
      )}

      {/* Custom animations */}
      <style>
        {`
          @keyframes slideUp {
            0% { opacity: 0; transform: translateY(12px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-slideUp {
            animation: slideUp 0.25s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
};

export default Watermark;
