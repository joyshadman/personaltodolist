// src/components/About.jsx
import React from "react";
import { FiGithub, FiLinkedin, FiMail } from "react-icons/fi";
import Navbar from "./Navbar";
import { Link } from "react-router-dom";
import Watermark from "./Watermark";

const About = ({ user, onSignOut }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-gray-100">
      {/* Navbar with user props */}
      <Navbar user={user} onSignOut={onSignOut} />

      <div className="flex flex-col items-center pt-24 px-4">
        <div className="max-w-5xl w-full bg-black/40 backdrop-blur-3xl border border-gray-700 rounded-3xl shadow-2xl p-12 space-y-12">

          {/* Header */}
          <h1 className="text-5xl sm:text-6xl font-bold text-amber-400 text-center mb-6">
            About This Project
          </h1>

          {/* Introduction / Bio */}
          <section className="space-y-4">
            <h2 className="text-3xl font-semibold text-white mt-40">Hi, I'm Joy Shadman</h2>
            <p className="text-gray-200 text-lg leading-relaxed">
              I'm a passionate <span className="text-orange-400 font-semibold">Full Stack Developer</span>
              with a love for building sleek, modern, and responsive web applications.
              I enjoy turning ideas into real-life projects that are efficient, interactive, and user-friendly.
            </p>
            <p className="text-gray-200 text-lg leading-relaxed">
              This project helps users manage tasks, notes, timers, and alarms efficiently,
              using the latest web technologies to provide a smooth, glassy, iOS-inspired experience.
            </p>
          </section>

          {/* Skills / Tech Stack */}
          <section className="space-y-4">
            <h2 className="text-3xl font-semibold text-white">Skills & Technologies</h2>
            <ul className="list-disc list-inside text-gray-200 text-lg space-y-1">
              <li>React.js & React Hooks for dynamic UI</li>
              <li>Firebase Realtime Database & Authentication</li>
              <li>Tailwind CSS for glassy, responsive UI</li>
              <li>React Icons & React Hot Toast for enhanced UX</li>
              <li>JavaScript, HTML5, CSS3 for core functionality</li>
            </ul>
          </section>

          {/* Project Features */}
          <section className="space-y-4">
            <h2 className="text-3xl font-semibold text-white">Project Features</h2>
            <ul className="list-disc list-inside text-gray-200 text-lg space-y-1">
              <li>Glassy iOS-style UI with animations and hover effects</li>
              <li>Create, edit, delete, and mark tasks as completed</li>
              <li>Timers and alarms with notifications</li>
              <li>Persistent storage with Firebase</li>
              <li>Fully responsive for desktop and mobile</li>
            </ul>
          </section>

          {/* Experience & Soft Skills */}
          <section className="space-y-4 mb-49">
            <h2 className="text-3xl font-semibold text-white">Experience & Soft Skills</h2>
            <ul className="list-disc list-inside text-gray-200 text-lg space-y-1">
              <li>Team collaboration & project management</li>
              <li>Critical thinking & problem-solving</li>
              <li>Attention to detail & clean code practices</li>
              <li>Continuous learning & adaptability</li>
            </ul>
          </section>

          {/* Contact / Connect */}
          <section className="space-y-4 text-center">
            <h2 className="text-3xl font-semibold text-white">Connect With Me</h2>
            <div className="flex items-center justify-center gap-8 mt-2 mb-4">
              <a
                href="https://github.com/joyshadman"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-orange-400 transition-colors"
              >
                <FiGithub size={36} />
              </a>
              <a
                href="https://linkedin.com/in/joyshadman"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-500 transition-colors"
              >
                <FiLinkedin size={36} />
              </a>
              <a
                href="mailto:joyshadman@Gmail.com"
                className="text-white hover:text-red-500 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  alert("joyshadman@gmail.com");
                }}
              >
                <FiMail size={36} />
              </a>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              &copy; {new Date().getFullYear()} Joy Shadman. All rights reserved.
              <span>
                Terms-condition
                <Link to="/Terms" className="text-orange-400 hover:underline ml-1">
                  (Read more)
                </Link>
              </span>
            </p>
          </section>

        </div>
      </div>
      <Watermark/>
    </div>
  );
};

export default About;
