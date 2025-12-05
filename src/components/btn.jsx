// src/components/Btn.jsx
import React, { useEffect, useState, useRef } from "react";
import { db } from "../Config/firebaseConfig";
import { ref, set, onValue, remove, update } from "firebase/database";
import toast, { Toaster } from "react-hot-toast";

import ambSound from "../assets/amb.mp3";
import clickSoundFile from "../assets/click.mp3";
import errorSoundFile from "../assets/error.mp3";

import {
  FiTrash2,
  FiEdit3,
  FiClock,
  FiSave,
  FiXCircle,
  FiCheckSquare,
} from "react-icons/fi";
import { LuAlarmClock } from "react-icons/lu";

import Watermark from "./Watermark";
import { ClipLoader } from "react-spinners";

const Btn = ({ user }) => {
  const [toDo, setToDo] = useState("");
  const [todoList, setTodoList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true); // loading state
  const [timerInput, setTimerInput] = useState("");
  const [alarmTime, setAlarmTime] = useState("");
  const [timers, setTimers] = useState({});
  const [remaining, setRemaining] = useState({});
  const [timerEditId, setTimerEditId] = useState(null);
  const [timerType, setTimerType] = useState("timer");
  const [showStopPopup, setShowStopPopup] = useState(false);

  const deleteTimeouts = useRef({});
  const alarmRef = useRef(null);
  const clickSound = useRef(null);
  const errorSound = useRef(null);

  const userRef = user?.uid ? ref(db, `users/${user.uid}/todos`) : null;

  const playClick = () => {
    clickSound.current?.pause();
    try {
      clickSound.current.currentTime = 0;
      clickSound.current.play();
    } catch (e) {}
  };

  const playError = () => {
    errorSound.current?.pause();
    try {
      errorSound.current.currentTime = 0;
      errorSound.current.play();
    } catch (e) {}
  };

  useEffect(() => {
    if (clickSound.current) clickSound.current.volume = 0.1;
    if (errorSound.current) errorSound.current.volume = 0.5;

    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const notify = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  };

  // Load user tasks
  useEffect(() => {
    if (!userRef) return;
    setLoading(true);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      setTodoList(list.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toDo.trim()) {
      playError();
      return toast.error("⚠ Task cannot be empty!");
    }
    if (!user?.uid) {
      playError();
      return toast.error("User not authenticated");
    }

    const timestamp = Date.now();

    try {
      if (editId) {
        await update(ref(db, `users/${user.uid}/todos/${editId}`), {
          TodoName: toDo,
        });
        toast.success("✔ Task updated!");
      } else {
        const newRef = ref(db, `users/${user.uid}/todos/${timestamp}`);
        await set(newRef, {
          TodoName: toDo,
          completed: false,
          createdAt: timestamp,
        });
        toast.success("✔ Task added!");
      }

      setToDo("");
      setEditId(null);
      playClick();
    } catch (err) {
      console.error(err);
      playError();
      toast.error("Error saving task.");
    }
  };

  const handleDelete = async (id) => {
    if (!user?.uid) {
      playError();
      return toast.error("User not authenticated");
    }

    clearInterval(timers[id]?.intervalId);
    clearTimeout(deleteTimeouts.current[id]);

    try {
      await remove(ref(db, `users/${user.uid}/todos/${id}`));
      toast.success("🗑 Task deleted");
      playClick();
    } catch (err) {
      console.error(err);
      playError();
      toast.error("Delete failed");
    }
  };

  const handleToggle = async (id, current) => {
    if (!user?.uid) {
      playError();
      return toast.error("User not authenticated");
    }

    try {
      await update(ref(db, `users/${user.uid}/todos/${id}`), {
        completed: !current,
      });

      if (!current) {
        toast.success("🎉 Completed! Auto-delete in 10 min");
        deleteTimeouts.current[id] = setTimeout(
          () => handleDelete(id),
          600000
        );
      } else {
        clearTimeout(deleteTimeouts.current[id]);
      }

      playClick();
    } catch (err) {
      console.error(err);
      playError();
      toast.error("Failed");
    }
  };

  const playAlarm = () => {
    alarmRef.current?.pause();
    try {
      alarmRef.current.currentTime = 0;
      alarmRef.current.play();
    } catch (e) {}
    setShowStopPopup(true);
    toast("⏰ Time's up!");
    notify("⏰ Alarm!", "Your timer/alarm has finished!");
  };

  const stopAlarm = () => {
    alarmRef.current?.pause();
    try {
      alarmRef.current.currentTime = 0;
    } catch (e) {}
    setShowStopPopup(false);
    toast.success("Alarm stopped");
  };

  const handleSaveTimer = (itemId) => {
    const clearExisting = () => clearInterval(timers[itemId]?.intervalId);

    if (timerType === "timer") {
      const mins = parseInt(timerInput);
      if (!mins) {
        playError();
        return toast.error("Enter valid minutes!");
      }

      clearExisting();
      const end = Date.now() + mins * 60000;

      const intervalId = setInterval(() => {
        const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
        setRemaining((p) => ({ ...p, [itemId]: left }));
        if (left <= 0) {
          clearInterval(intervalId);
          playAlarm();
        }
      }, 1000);

      setTimers((p) => ({ ...p, [itemId]: { intervalId } }));

      update(ref(db, `users/${user.uid}/todos/${itemId}`), {
        timer: { type: "timer", minutes: mins, start: Date.now() },
      });

      toast.success("⏳ Timer set!");
      notify("Timer Set ⏳", `Your timer for ${mins} minute(s) has started.`);
    } else {
      const [h, m] = alarmTime.split(":").map(Number);
      if (isNaN(h) || isNaN(m)) {
        playError();
        return toast.error("Enter valid alarm time!");
      }

      clearExisting();
      const intervalId = setInterval(() => {
        const now = new Date();
        if (now.getHours() === h && now.getMinutes() === m) {
          clearInterval(intervalId);
          playAlarm();
        }
      }, 1000);

      setTimers((p) => ({ ...p, [itemId]: { intervalId } }));

      update(ref(db, `users/${user.uid}/todos/${itemId}`), {
        timer: { type: "alarm", hour: h, minute: m },
      });

      toast.success("⏰ Alarm is set!");
      notify("Alarm Set ⏰", `Your alarm for ${alarmTime} has been set.`);
    }

    playClick();
    setTimerEditId(null);
    setTimerInput("");
    setAlarmTime("");
  };

  useEffect(() => {
    return () => {
      Object.values(timers).forEach((t) => clearInterval(t.intervalId));
    };
  }, [timers]);

  // ✅ Loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950">
        <ClipLoader color="#f97316" size={60} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-gray-100">
      {/* Top Nav */}
      <nav className="bg-transparent">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <span className="text-lg font-semibold text-amber-300 flex items-center gap-2">
            <FiCheckSquare size={22} /> MyTasks
          </span>
        </div>
      </nav>

      {/* Task Section */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white/4 backdrop-blur-lg border border-white/10 rounded-2xl shadow-[0_8px_30px_rgba(2,6,23,0.6)] mt-6 overflow-hidden">
          <div className="p-6">
            <form
              onSubmit={handleSubmit}
              className="flex gap-2 mb-6 flex-col sm:flex-row items-stretch"
            >
              <input
                type="text"
                value={toDo}
                onChange={(e) => setToDo(e.target.value)}
                placeholder="Add task..."
                className="flex-1 p-4 rounded-xl border border-white/8 bg-white/6 text-white placeholder:text-gray-300 min-w-0"
                aria-label="New task"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-400 text-black font-semibold hover:scale-[1.03] transition-transform flex-shrink-0"
              >
                {editId ? "Update" : "Add"}
              </button>
            </form>

            {/* Task List */}
            <ul className="space-y-3">
              {todoList.length ? (
                todoList.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-white/3 border border-white/6 hover:bg-white/5 transition-all cursor-default min-w-0"
                  >
                    {/* Left */}
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.completed || false}
                        onChange={() => handleToggle(item.id, item.completed)}
                        className="accent-amber-500 w-6 h-6 cursor-pointer flex-shrink-0"
                      />
                      <span
                        className={`text-lg min-w-0 ${
                          item.completed
                            ? "line-through text-gray-300"
                            : "text-white"
                        } truncate`}
                      >
                        {item.TodoName}
                      </span>
                    </div>

                    {/* Right Buttons */}
                    <div className="flex items-center gap-3 mt-3 sm:mt-0 min-w-0">
                      {timerEditId === item.id ? (
                        <div className="flex flex-wrap items-center gap-2 bg-white/6 backdrop-blur-sm p-3 rounded-lg border border-white/8 w-full sm:w-auto min-w-0">
                          <select
                            value={timerType}
                            onChange={(e) => setTimerType(e.target.value)}
                            className="px-3 py-2 rounded text-sm bg-white/8 text-white min-w-0 w-full sm:w-auto"
                          >
                            <option value="timer">Timer</option>
                            <option value="alarm">Alarm</option>
                          </select>

                          {timerType === "timer" ? (
                            <input
                              type="number"
                              value={timerInput}
                              onChange={(e) => setTimerInput(e.target.value)}
                              placeholder="Minutes"
                              className="px-3 py-2 rounded text-sm bg-white/8 text-white min-w-0 w-full sm:w-auto"
                            />
                          ) : (
                            <input
                              type="time"
                              value={alarmTime}
                              onChange={(e) => setAlarmTime(e.target.value)}
                              className="px-3 py-2 rounded text-sm bg-white/8 text-white min-w-0 w-full sm:w-auto"
                            />
                          )}

                          <button
                            onClick={() => handleSaveTimer(item.id)}
                            className="bg-green-500 px-4 py-2 rounded-lg hover:scale-105 transition flex-shrink-0 w-full sm:w-auto"
                          >
                            <FiSave size={18} />
                          </button>

                          <button
                            onClick={() => setTimerEditId(null)}
                            className="bg-gray-500 px-4 py-2 rounded-lg hover:scale-105 transition flex-shrink-0 w-full sm:w-auto"
                          >
                            <FiXCircle size={18} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setTimerEditId(item.id);
                            setTimerType("timer");
                          }}
                          className="bg-gray-500 px-4 py-2 rounded-lg hover:scale-105 transition flex-shrink-0"
                        >
                          <FiClock size={18} />
                        </button>
                      )}

                      {remaining[item.id] > 0 && (
                        <span className="text-amber-300 text-sm animate-pulse whitespace-nowrap">
                          {Math.floor(remaining[item.id] / 60)}:
                          {(remaining[item.id] % 60).toString().padStart(2, "0")}
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setToDo(item.TodoName);
                          setEditId(item.id);
                          playClick();
                        }}
                        className="bg-white/6 px-4 py-2 rounded-lg hover:scale-105 transition flex-shrink-0"
                      >
                        <FiEdit3 size={18} />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-600 px-4 py-2 rounded-lg hover:scale-105 transition flex-shrink-0"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-gray-300 text-center cursor-default">
                  No tasks yet. Add one!
                </p>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Alarm Popup */}
      {showStopPopup && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm w-full">
            <LuAlarmClock size={40} className="mx-auto text-red-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-4">Alarm is ringing!</h3>
            <button
              onClick={stopAlarm}
              className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Sounds */}
      <audio ref={alarmRef} src={ambSound} preload="auto" />
      <audio ref={clickSound} src={clickSoundFile} preload="auto" />
      <audio ref={errorSound} src={errorSoundFile} preload="auto" />

      <Watermark />

      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
    </div>
  );
};

export default Btn;
