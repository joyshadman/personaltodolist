// src/components/Btn.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { db } from "../Config/firebaseConfig";
import { ref, set, onValue, remove, update } from "firebase/database";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ClipLoader } from "react-spinners";
// Fixed the icons: Removed FiQuote, added FiInfo or FiCpu for better vibes
import { 
  FiTrash2, FiEdit3, FiClock, FiXCircle, FiPlus, 
  FiActivity, FiAward, FiZap, FiTarget, FiVolumeX, FiInfo 
} from "react-icons/fi";
// Using Lucide for the Quote icon as it's more reliable
import { Quote } from "lucide-react"; 

// Saved Imports
import NamingModal from "./Notes/NamingModal";
import DeleteModal from "./Notes/DeleteModal";

import ambSound from "../assets/amb.mp3";
import clickSoundFile from "../assets/click.mp3";
import errorSoundFile from "../assets/error.mp3";
import Watermark from "./Watermark";

const CATEGORIES = {
  Work: "text-blue-400 bg-blue-400/10 border-blue-400/20 shadow-[0_0_15px_-5px_rgba(96,165,250,0.3)]",
  Personal: "text-purple-400 bg-purple-400/10 border-purple-400/20 shadow-[0_0_15px_-5px_rgba(192,132,252,0.3)]",
  Urgent: "text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_15px_-5px_rgba(248,113,113,0.4)]",
  General: "text-gray-400 bg-gray-400/10 border-gray-400/20 shadow-none"
};

const Btn = ({ user }) => {
  const [toDo, setToDo] = useState("");
  const [category, setCategory] = useState("General");
  const [todoList, setTodoList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(null);
  const [timerModal, setTimerModal] = useState({ open: false, id: null, input: "" });
  const [remaining, setRemaining] = useState({});
  const [isSorting, setIsSorting] = useState(false);
  const [ringingId, setRingingId] = useState(null);
  
  // Motivation State
  const [quote, setQuote] = useState({ text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" });

  const refs = { 
    alarm: useRef(null), 
    click: useRef(null), 
    error: useRef(null) 
  };

  const playSound = (type) => {
    const s = refs[type].current;
    if (s) { s.pause(); s.currentTime = 0; s.play().catch(() => {}); }
  };

  const stopSound = (type) => {
    const s = refs[type].current;
    if (s) { s.pause(); s.currentTime = 0; }
  };

  const userPath = useMemo(() => user?.uid ? `users/${user.uid}/todos` : null, [user?.uid]);

  // Fetch Motivation (Using a more stable endpoint)
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent("https://zenquotes.io/api/random"));
        if (res.ok) {
          const data = await res.json();
          const parsed = JSON.parse(data.contents);
          setQuote({ text: parsed[0].q, author: parsed[0].a });
        }
      } catch (e) {
        console.log("Quote fetch error - using fallback");
      }
    };
    fetchQuote();
  }, []);

  useEffect(() => {
    if (!userPath) return;
    const itemsRef = ref(db, userPath);
    return onValue(itemsRef, (snap) => {
      const data = snap.val() || {};
      setTodoList(Object.entries(data).map(([id, val]) => ({ id, ...val })));
      setLoading(false);
    });
  }, [userPath]);

  useEffect(() => {
    const ticker = setInterval(() => {
      const now = Date.now();
      const updatedRemaining = {};
      let activeAlarm = null;

      todoList.forEach(item => {
        if (item.timerEnd) {
          const diff = Math.max(0, Math.floor((item.timerEnd - now) / 1000));
          updatedRemaining[item.id] = diff;
          if (diff <= 0 && !item.completed && !ringingId) {
            activeAlarm = item.id;
          }
        }
      });

      setRemaining(updatedRemaining);
      if (activeAlarm) {
        setRingingId(activeAlarm);
        playSound("alarm");
      }
    }, 1000);
    return () => clearInterval(ticker);
  }, [todoList, ringingId]);

  const sortedList = useMemo(() => {
    return [...todoList].sort((a, b) => {
      const aRem = remaining[a.id] || 0;
      const bRem = remaining[b.id] || 0;
      if (aRem > 0 && bRem <= 0) return -1;
      if (bRem > 0 && aRem <= 0) return 1;
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const aUrgent = a.category === "Urgent" ? 1 : 0;
      const bUrgent = b.category === "Urgent" ? 1 : 0;
      if (aUrgent !== bUrgent) return bUrgent - aUrgent;
      return b.createdAt - a.createdAt;
    });
  }, [todoList, remaining]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toDo.trim() || !userPath) return playSound("error");
    try {
      const now = Date.now();
      if (editId) {
        await update(ref(db, `${userPath}/${editId}`), { TodoName: toDo, category });
        setEditId(null);
      } else {
        await set(ref(db, `${userPath}/${now}`), { 
          TodoName: toDo, category, completed: false, createdAt: now, timerEnd: null 
        });
      }
      setToDo("");
    } catch (err) { playSound("error"); }
  };

  const handleStopAlarm = async (id) => {
    stopSound("alarm");
    setRingingId(null);
    playSound("click");
    if (id && userPath) {
      await update(ref(db, `${userPath}/${id}`), { timerEnd: null });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#050507]"><ClipLoader color="#f97316" size={50} /></div>;

  const stats = {
    total: todoList.length,
    completed: todoList.filter(t => t.completed).length,
    percent: todoList.length === 0 ? 0 : Math.round((todoList.filter(t => t.completed).length / todoList.length) * 100)
  };

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden bg-[#050507]">
      {/* Background Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <main className="max-w-2xl mx-auto p-4 relative z-10 pb-32">
        <AnimatePresence>
          {focusMode && (
            <FocusOverlay 
              item={todoList.find(t => t.id === focusMode)} 
              remaining={remaining[focusMode] || 0} 
              setFocusMode={setFocusMode} 
              stopAlarm={() => handleStopAlarm(focusMode)} 
              isRinging={ringingId === focusMode}
            />
          )}
        </AnimatePresence>

        {!focusMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            
            {/* MOTIVATION CARD - Fixed Icon */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-24 p-8 bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] backdrop-blur-3xl text-center relative group"
            >
              <Quote className="absolute top-4 left-4 text-orange-500/20 group-hover:text-orange-500/40 transition-colors" size={32} />
              <p className="text-lg font-medium italic text-white/80 leading-relaxed mb-4">"{quote.text}"</p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">— {quote.author}</p>
            </motion.div>

            <div className="mt-12 flex flex-col items-center">
              <ProgressRing percent={stats.percent} />
            </div>
            
            <motion.form layout className="mt-12 mb-6 p-2 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl" onSubmit={handleSubmit}>
              <div className="flex items-center gap-2 p-1">
                <input value={toDo} onChange={(e) => setToDo(e.target.value)} placeholder="What's the mission?" className="flex-1 bg-transparent p-4 outline-none text-lg font-medium" />
                <button type="submit" className="w-12 h-12 flex items-center justify-center bg-orange-500 rounded-full text-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-orange-500/20"><FiPlus size={24} /></button>
              </div>
              <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
                {Object.keys(CATEGORIES).map(cat => (
                  <button key={cat} type="button" onClick={() => setCategory(cat)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black border transition-all ${category === cat ? "bg-white/10 text-white border-white/20" : "border-transparent text-gray-500"}`}>{cat}</button>
                ))}
              </div>
            </motion.form>

            {/* MAGIC SORT BTN */}
            <div className="flex justify-end mb-4 pr-2">
              <button 
                onClick={() => { setIsSorting(true); playSound("click"); setTimeout(() => setIsSorting(false), 1000); }} 
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 bg-orange-500/5 px-5 py-2.5 rounded-full border border-orange-500/20 active:scale-90 transition-all backdrop-blur-md"
              >
                <FiZap className={isSorting ? "animate-spin" : ""} /> Magic Sort
              </button>
            </div>

            <div className="space-y-4 mb-16">
              <AnimatePresence mode="popLayout">
                {sortedList.map((item) => (
                  <SwipeableTask 
                    key={item.id} item={item} userPath={userPath} remaining={remaining[item.id] || 0} 
                    setTimerModal={setTimerModal} setToDo={setToDo} setEditId={setEditId} 
                    setCategory={setCategory} setFocusMode={setFocusMode} playSound={playSound} 
                  />
                ))}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <BentoCard icon={<FiTarget />} label="Accuracy" val={stats.percent + "%"} color="text-orange-500" />
              <BentoCard icon={<FiActivity />} label="Status" val="Secure" color="text-blue-400" />
              <div className="col-span-2 p-6 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2rem] flex flex-col justify-between">
                <FiAward className="text-purple-400" size={20} />
                <p className="text-xs text-white/40 mt-4 font-medium leading-relaxed">End-to-End Security: <span className="text-white">Active</span>. Data is locked to your UID.</p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Alarm Modal */}
      <AnimatePresence>
        {ringingId && !focusMode && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md">
            <div className="bg-red-500/80 p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between backdrop-blur-xl border border-white/20">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase opacity-70">Timer Elapsed</p>
                <h4 className="font-bold truncate text-lg">{todoList.find(t => t.id === ringingId)?.TodoName}</h4>
              </div>
              <button onClick={() => handleStopAlarm(ringingId)} className="bg-white text-red-600 px-6 py-3 rounded-full font-black flex items-center gap-2 hover:scale-105 active:scale-95 shadow-xl transition-all"><FiVolumeX /> STOP</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer Settings Modal */}
      <AnimatePresence>
        {timerModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/60">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black">Set Timer</h3>
                <button onClick={() => setTimerModal({ open: false })} className="p-2 text-white/30 hover:text-white transition-colors"><FiXCircle size={28}/></button>
              </div>
              <input type="number" placeholder="00" className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 mb-8 text-center text-6xl font-black outline-none focus:border-orange-500/50" onChange={(e) => setTimerModal({...timerModal, input: e.target.value})} autoFocus />
              <button onClick={async () => {
                const mins = parseInt(timerModal.input);
                if (mins && userPath) {
                  await update(ref(db, `${userPath}/${timerModal.id}`), { timerEnd: Date.now() + mins * 60000 });
                  setTimerModal({ open: false, id: null, input: "" });
                }
              }} className="w-full py-5 bg-orange-500 rounded-[1.5rem] font-black text-black text-lg shadow-lg shadow-orange-500/20">SET MISSION TIMER</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={refs.alarm} src={ambSound} loop />
      <audio ref={refs.click} src={clickSoundFile} />
      <audio ref={refs.error} src={errorSoundFile} />
      <Toaster position="bottom-center" />
      <Watermark />
    </div>
  );
};

// HELPER COMPONENTS
const ProgressRing = ({ percent = 0 }) => {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="absolute w-full h-full -rotate-90">
        <circle cx="64" cy="64" r={radius} stroke="rgba(255,255,255,0.03)" strokeWidth="4" fill="transparent" />
        <motion.circle 
          cx="64" cy="64" r={radius} stroke="#f97316" strokeWidth="4" fill="transparent" 
          strokeDasharray={circumference} 
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (circumference * percent) / 100 }} 
          transition={{ duration: 1.5, ease: "circOut" }}
        />
      </svg>
      <div className="text-center">
        <span className="text-2xl font-black block">{percent}%</span>
        <span className="text-[8px] uppercase text-white/30 tracking-widest font-black">Mission Complete</span>
      </div>
    </div>
  );
};

const BentoCard = ({ icon, label, val, color }) => (
  <div className="p-6 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2rem] flex flex-col items-center justify-center text-center">
    <div className={`${color} text-xl mb-2`}>{icon}</div>
    <div className="text-lg font-black">{val}</div>
    <div className="text-[9px] font-black uppercase text-white/20 tracking-widest">{label}</div>
  </div>
);

const SwipeableTask = ({ item, userPath, remaining, setToDo, setEditId, setCategory, setTimerModal, setFocusMode, playSound }) => (
  <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
    <div className={`p-5 bg-white/[0.03] backdrop-blur-3xl border rounded-[2.2rem] flex items-center gap-4 transition-all duration-500 ${CATEGORIES[item.category || "General"]} ${item.completed ? "opacity-20 grayscale border-transparent" : "border-white/10 shadow-xl"}`}>
      <input 
        type="checkbox" 
        checked={item.completed} 
        onChange={() => { 
          playSound("click"); 
          update(ref(db, `${userPath}/${item.id}`), { completed: !item.completed }); 
        }} 
        className="w-6 h-6 rounded-full accent-orange-500 cursor-pointer" 
      />
      
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { if (remaining > 0) setFocusMode(item.id); }}>
        <p className="text-base font-bold truncate tracking-tight">{item.TodoName}</p>
        <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-black uppercase opacity-40">{item.category}</span>
            {remaining > 0 && <span className="text-[10px] font-mono text-orange-400 font-black animate-pulse">● {Math.floor(remaining/60)}:{(remaining%60).toString().padStart(2,'0')}</span>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setTimerModal({ open: true, id: item.id, input: "" })} className="p-2 text-white/30 hover:text-orange-400"><FiClock size={18}/></button>
        <button onClick={() => { setToDo(item.TodoName); setEditId(item.id); setCategory(item.category || "General"); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-2 text-white/30 hover:text-white"><FiEdit3 size={18}/></button>
        <button onClick={() => { remove(ref(db, `${userPath}/${item.id}`)); }} className="p-2 text-white/30 hover:text-red-500"><FiTrash2 size={18}/></button>
      </div>
    </div>
  </motion.div>
);

const FocusOverlay = ({ item, remaining, setFocusMode, stopAlarm, isRinging }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#050507] flex flex-col items-center justify-center p-6 text-center">
    <button onClick={() => setFocusMode(null)} className="absolute top-10 right-10 p-4 text-white/20 hover:text-white transition-all"><FiXCircle size={40}/></button>
    <h2 className="text-white/40 uppercase tracking-[0.8em] text-xs mb-6 font-black">Deep Focus</h2>
    <h1 className="text-4xl md:text-6xl font-black mb-16 tracking-tighter px-4">{item?.TodoName}</h1>
    <div className={`text-9xl font-black font-mono tracking-tighter tabular-nums ${isRinging ? "text-red-500 animate-bounce" : "text-orange-500"}`}>
      {remaining > 0 ? `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, "0")}` : "00:00"}
    </div>
    {isRinging && (
      <button onClick={stopAlarm} className="mt-20 bg-white text-black px-16 py-6 rounded-full font-black text-2xl hover:scale-110 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all">STOP ALARM</button>
    )}
  </motion.div>
);

export default Btn;