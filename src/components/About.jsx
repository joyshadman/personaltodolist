// src/components/About.jsx
import React from "react";
import { FiGithub, FiLinkedin, FiMail, FiCode, FiLayers, FiZap, FiCpu } from "react-icons/fi";
import Navbar from "./navbar";
import { Link } from "react-router-dom";
import Watermark from "./Watermark";
import { motion } from "framer-motion";

const About = ({ user, onSignOut }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-orange-500/30 overflow-x-hidden">
      {/* Dynamic Background Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] right-[-5%] w-[600px] h-[600px] bg-orange-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/10 blur-[130px] rounded-full" />
      </div>

      <Navbar user={user} onSignOut={onSignOut} />

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-6xl mx-auto pt-32 pb-24 px-6"
      >
        {/* --- HERO SECTION --- */}
        <motion.section variants={itemVariants} className="text-center mb-24">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            Task<span className="text-orange-500">Flow.</span>
          </h1>
          <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            A premium ecosystem designed to bridge the gap between human focus and digital productivity.
          </p>
        </motion.section>

        {/* --- BIO CARD --- */}
        <motion.section variants={itemVariants} className="mb-12">
          <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-16 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <FiCpu size={120} />
            </div>
            
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-4">The Architect</h2>
              <h3 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Hi, I'm Joy Shadman.</h3>
              <p className="text-xl text-white/60 leading-relaxed mb-6">
                I'm a <span className="text-white font-bold">Full Stack Developer</span> obsessed with pixel-perfection and high-performance web architecture. I don't just write code; I build digital experiences that feel alive.
              </p>
              <p className="text-lg text-white/40 leading-relaxed">
                TaskFlow was born from the need for a tool that is as beautiful as it is functional—combining a glassy iOS aesthetic with the robust power of Firebase.
              </p>
            </div>
          </div>
        </motion.section>

        {/* --- TECH & FEATURES GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Skills */}
          <motion.div variants={itemVariants} className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                <FiCode size={24} />
              </div>
              <h4 className="text-2xl font-bold">Tech Stack</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['React.js', 'Firebase', 'Tailwind CSS', 'Framer Motion', 'Cloud Firestore', 'Lucide Icons'].map((tech) => (
                <div key={tech} className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 text-sm font-bold text-white/70">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  {tech}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Features */}
          <motion.div variants={itemVariants} className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                <FiLayers size={24} />
              </div>
              <h4 className="text-2xl font-bold">Core Features</h4>
            </div>
            <ul className="space-y-4">
              {[
                "Real-time Data Sync",
                "Advanced Glassmorphism UI",
                "Global Alarm & Timer System",
                "Secure Google Authentication",
                "Responsive Fluid Layouts"
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-white/50 text-sm font-medium">
                  <FiZap className="text-orange-500" size={16} />
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* --- CONTACT FOOTER --- */}
        <motion.section variants={itemVariants} className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 text-center">
          <h2 className="text-3xl font-bold mb-8">Let's Connect</h2>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-12">
            <SocialIcon href="https://github.com/joyshadman" icon={<FiGithub />} label="GitHub" color="hover:text-white" />
            <SocialIcon href="https://linkedin.com/in/joyshadman" icon={<FiLinkedin />} label="LinkedIn" color="hover:text-blue-400" />
            <SocialIcon 
                href="mailto:joyshadman@gmail.com" 
                icon={<FiMail />} 
                label="Email" 
                color="hover:text-red-400" 
                isEmail 
            />
          </div>
          
          <div className="pt-8 border-t border-white/5">
            <p className="text-white/20 text-xs font-black uppercase tracking-[0.3em]">
              &copy; {new Date().getFullYear()} Joy Shadman &bull; 
              <Link to="/Terms" className="text-orange-500 hover:text-orange-400 ml-2 transition-colors">
                Terms & Privacy
              </Link>
            </p>
          </div>
        </motion.section>
      </motion.main>

      <Watermark />
    </div>
  );
};

const SocialIcon = ({ href, icon, label, color, isEmail }) => (
  <motion.a
    href={href}
    target={isEmail ? "_self" : "_blank"}
    rel="noopener noreferrer"
    whileHover={{ y: -5, scale: 1.1 }}
    onClick={isEmail ? (e) => { e.preventDefault(); alert("joyshadman@gmail.com"); } : undefined}
    className={`flex flex-col items-center gap-2 text-white/40 transition-all ${color}`}
  >
    <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] border border-white/10 flex items-center justify-center mb-2 group-hover:border-current transition-colors">
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </motion.a>
);

export default About;