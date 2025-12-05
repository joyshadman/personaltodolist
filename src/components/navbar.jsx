import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";

const Navbar = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Notes", path: "/notes" },
    { name: "About", path: "/About" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed w-full z-50 bg-black/30 backdrop-blur-xl border-b border-gray-700 shadow-lg">
      <div className="w-full flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="text-2xl sm:text-3xl font-bold text-white select-none transition-transform duration-300 hover:scale-105">
          Task <span className="text-orange-400">Flow</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-white font-medium transition-colors duration-200 hover:text-orange-400 ${
                isActive(item.path) ? "text-orange-400 underline underline-offset-4" : ""
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

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
              className="ml-2 px-4 py-1 rounded-lg bg-orange-600/80 hover:bg-orange-700/90 text-white text-sm font-medium transition-colors"
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
      {isOpen && (
        <div className="sm:hidden bg-black/30 backdrop-blur-xl border-t border-gray-700 shadow-md px-4 py-4 flex flex-col items-center space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`w-full text-center py-2 rounded-lg transition-colors duration-200 hover:bg-orange-600/30 ${
                isActive(item.path) ? "bg-orange-600/40 text-white font-semibold" : "text-white"
              }`}
            >
              {item.name}
            </Link>
          ))}

          {user && (
            <>
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/30 bg-white/10 flex items-center justify-center mt-2">
                <span className="text-base text-white font-semibold">
                  {user.displayName?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
              <span className="text-white font-medium">{user.displayName || "Anonymous"}</span>
              <button
                onClick={onSignOut}
                className="px-6 py-1 rounded-lg bg-orange-600/80 hover:bg-orange-700/90 text-white text-sm font-medium w-full transition-colors"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
