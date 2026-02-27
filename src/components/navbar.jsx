import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, ChevronDown, Menu, X } from "lucide-react";

const Navbar = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Notes", path: "/notes" },
    { name: "About", path: "/About" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed top-6 left-0 w-full z-[100] px-4 flex justify-center pointer-events-none">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="pointer-events-auto flex items-center justify-between w-full max-w-4xl h-14 pl-6 pr-2 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
      >
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 bg-orange-600 rounded-full group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(234,88,12,0.4)]" />
          <span className="text-sm font-black uppercase tracking-widest text-white">
            Task<span className="text-orange-500">Flow</span>
          </span>
        </Link>

        {/* DESKTOP PILL LINKS */}
        <div className="hidden md:flex items-center gap-1 bg-black/20 rounded-full p-1 border border-white/5">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="relative px-5 py-1.5">
              {isActive(item.path) && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-white/10 rounded-full border border-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className={`relative z-10 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
                isActive(item.path) ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}>
                {item.name}
              </span>
            </Link>
          ))}
        </div>

        {/* RIGHT SECTION: USER & MENU */}
        <div className="flex items-center gap-2">
          {user && (
            <div className="relative">
              <motion.button
                whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1 bg-black/20 rounded-full border border-white/5 pr-3 transition-all"
              >
                <div className="relative">
                  <img 
                    src={user.photoURL} 
                    alt="user" 
                    className="w-8 h-8 rounded-full border border-white/10" 
                    referrerPolicy="no-referrer"
                  />
                  {/* LIVE STATUS PULSE */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0a0a0a] animate-pulse shadow-[0_0_8px_#22c55e]" />
                </div>
                <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${showProfileMenu ? "rotate-180" : ""}`} />
              </motion.button>

              {/* FLOATING DROPDOWN */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute right-0 mt-4 w-48 bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] p-1.5 shadow-2xl"
                  >
                    <div className="px-4 py-2 border-b border-white/5 mb-1">
                      <p className="text-[8px] uppercase tracking-widest text-orange-500 font-black">Account</p>
                      <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button 
                      onClick={() => { onSignOut(); setShowProfileMenu(false); }}
                      className="w-full flex items-center justify-between px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
                      <LogOut size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* MOBILE TOGGLE */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden p-2 text-white bg-white/5 rounded-full border border-white/10"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </motion.nav>

      {/* MOBILE MENU PILL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-24 left-4 right-4 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 flex flex-col gap-4 items-center z-[99]"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`text-2xl font-black uppercase tracking-tighter ${
                  isActive(item.path) ? "text-orange-500" : "text-gray-500"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;