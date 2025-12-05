import React, { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

const Navbar = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 bg-black/30 backdrop-blur-md border-b border-gray-700 shadow-lg">
      <div className="w-full flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Logo */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white cursor-pointer select-none transition-transform duration-300 hover:scale-105">
          Task <span className="text-orange-400">Flow</span>
        </h1>

        {/* Desktop User Info */}
        {user && (
          <div className="hidden sm:flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/30 bg-white/10 flex items-center justify-center">
              <span className="text-sm sm:text-base text-white font-semibold">
                {user.displayName?.charAt(0).toUpperCase() || "A"}
              </span>
            </div>
            <span className="text-white font-medium">{user.displayName || "Anonymous"}</span>
            <button
              onClick={onSignOut}
              className="ml-2 px-4 py-1 rounded-lg bg-orange-600/80 hover:bg-orange-700/90 text-white text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Mobile Hamburger */}
        <div className="flex sm:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 focus:outline-none text-white"
          >
            {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && user && (
        <div className="sm:hidden bg-black/30 backdrop-blur-md border-t border-gray-700 shadow-md px-4 py-3 flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-white/30 bg-white/10 flex items-center justify-center">
            <span className="text-base text-white font-semibold">
              {user.displayName?.charAt(0).toUpperCase() || "A"}
            </span>
          </div>
          <span className="text-white font-medium">{user.displayName || "Anonymous"}</span>
          <button
            onClick={onSignOut}
            className="px-6 py-1 rounded-lg bg-orange-600/80 hover:bg-orange-700/90 text-white text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
