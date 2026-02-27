// src/components/Watermark.jsx
import React, { useState } from "react";
import { FiMenu, FiX, FiGithub, FiLinkedin, FiExternalLink, FiCode } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const Watermark = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    /* Added 'hidden md:block': 
       'hidden' hides it by default (mobile/tablet).
       'md:block' makes it visible from medium screens (768px+) upwards.
    */
    <div className="hidden md:block pointer-events-none fixed inset-0 z-[100]"> 
      
      {/* --- Main Floating Badge --- */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 left-6 flex items-center gap-3 pointer-events-auto"
      >
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-4 p-2 bg-white/[0.02] backdrop-blur-[30px] rounded-[2rem] border border-white/10 shadow-2xl cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition-all duration-700"
        >
          {/* Status Glow Indicator */}
          <div className="ml-3 relative flex items-center justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]"></div>
            <div className="absolute w-4 h-4 bg-green-500/20 rounded-full animate-ping"></div>
          </div>

          {/* Text Container */}
          <div className="flex flex-col pr-4 border-r border-white/10">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500/80 leading-tight">
              Made By
            </span>
            <span className="text-base font-bold text-white tracking-tight leading-tight">
              Joy Shadman
            </span>
            <span className="text-[9px] font-medium text-white/30 uppercase tracking-widest mt-0.5">
              Full Stack Developer
            </span>
          </div>

          {/* Minimal Toggle */}
          <motion.div 
            animate={{ rotate: isOpen ? 90 : 0 }}
            className="mr-3 p-2 text-white/20 group-hover:text-white transition-colors"
          >
            {isOpen ? <FiX size={18} /> : <FiMenu size={18} />}
          </motion.div>
        </div>
      </motion.div>

      {/* --- Glassy Menu Panel --- */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click-out Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[4px] pointer-events-auto z-[-1]"
            />

            <motion.div 
              initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-28 left-6 w-72 bg-white/[0.02] backdrop-blur-[40px] rounded-[2.5rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] p-3 pointer-events-auto overflow-hidden"
            >
              {/* Refraction Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.05] to-transparent pointer-events-none" />

              <div className="relative z-10 flex flex-col gap-1">
                <div className="px-4 py-3 flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Navigation</span>
                   <FiCode className="text-orange-500/40" size={14} />
                </div>
                
                <SocialLink 
                  href="https://github.com/joyshadman" 
                  icon={<FiGithub />} 
                  label="GitHub" 
                  sub="Open Source Projects"
                />
                
                <SocialLink 
                  href="https://www.linkedin.com/in/joy-shadman-30067526a/" 
                  icon={<FiLinkedin />} 
                  label="LinkedIn" 
                  sub="Professional Network"
                />

                <div className="mt-2 mx-1 p-4 bg-orange-500/5 rounded-[1.8rem] border border-orange-500/10">
                   <p className="text-[11px] text-white/40 leading-relaxed text-center">
                     Available for <span className="text-white font-bold tracking-tight">Enterprise-Grade</span> Development.
                   </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const SocialLink = ({ href, icon, label, sub }) => (
  <motion.a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ x: 6, backgroundColor: "rgba(255,255,255,0.05)" }}
    whileTap={{ scale: 0.97 }}
    className="flex items-center gap-4 p-3.5 rounded-[1.8rem] transition-all group"
  >
    <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-2xl text-white/30 group-hover:text-orange-500 group-hover:bg-orange-500/10 transition-all duration-300">
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <div className="flex flex-col">
      <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{label}</span>
      <span className="text-[9px] text-white/20 uppercase font-black tracking-widest leading-none mt-1">{sub}</span>
    </div>
    <FiExternalLink size={12} className="ml-auto opacity-0 group-hover:opacity-20 transition-opacity" />
  </motion.a>
);

export default Watermark;