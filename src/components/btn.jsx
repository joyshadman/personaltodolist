// src/components/Btn.jsx
import { useEffect, useState, useRef } from "react";
import { db } from "../Config/firebaseConfig";
import { ref, set, onValue, remove, update } from "firebase/database";
import toast, { Toaster } from "react-hot-toast";

import ambSound from "../assets/amb.mp3";
import clickSoundFile from "../assets/click.mp3";
import errorSoundFile from "../assets/error.mp3";

// Icons
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

const Btn = ({ user }) => {
  const [toDo, setToDo] = useState("");
  const [todoList, setTodoList] = useState([]);
  const [editId, setEditId] = useState(null);
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

  // Play sounds
  const playClick = () => {
    clickSound.current?.pause();
    clickSound.current.currentTime = 0;
    clickSound.current.play();
  };

  const playError = () => {
    errorSound.current?.pause();
    errorSound.current.currentTime = 0;
    errorSound.current.play();
  };

  // Set audio volumes (default 10% for click, 50% for error)
  useEffect(() => {
    if (clickSound.current) clickSound.current.volume = 0.1;
    if (errorSound.current) errorSound.current.volume = 0.5;

    // Request browser notification permission
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Browser notification helper
  const notify = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  };

  // Load user tasks
  useEffect(() => {
    if (!userRef) return;
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      setTodoList(list.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Add or Update task
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

  // Delete task
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

  // Toggle completed
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
    alarmRef.current.currentTime = 0;
    alarmRef.current.play();
    setShowStopPopup(true);
    toast("⏰ Time's up!");
    notify("⏰ Alarm!", "Your timer/alarm has finished!");
  };

  const stopAlarm = () => {
    alarmRef.current?.pause();
    alarmRef.current.currentTime = 0;
    setShowStopPopup(false);
    toast.success("Alarm stopped");
  };

  // Timer/Alarm save
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-gray-100">
      {/* Top Nav */}
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <span className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <FiCheckSquare size={22} /> MyTasks
          </span>
        </div>
      </nav>

      {/* Task Section */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-gray-900/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-800 mt-6">
          <div className="p-6">
            {/* Add Form */}
            <form
              onSubmit={handleSubmit}
              className="flex gap-2 mb-6 flex-col sm:flex-row"
            >
              <input
                type="text"
                value={toDo}
                onChange={(e) => setToDo(e.target.value)}
                placeholder="Add task..."
                className="flex-1 p-4 rounded-lg border border-amber-600 bg-white/10 text-white cursor-pointer"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-lg text-white font-semibold hover:scale-105 transition-transform cursor-pointer"
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
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-black/30 hover:bg-black/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.completed || false}
                        onChange={() =>
                          handleToggle(item.id, item.completed)
                        }
                        className="accent-amber-500 w-6 h-6 cursor-pointer"
                      />
                      <span
                        className={`text-lg ${
                          item.completed
                            ? "line-through text-gray-400"
                            : "text-white"
                        }`}
                      >
                        {item.TodoName}
                      </span>
                    </div>

                    {/* Right Buttons */}
                    <div className="flex gap-3 mt-3 sm:mt-0">
                      {/* Timer Button */}
                      {timerEditId === item.id ? (
                        <div className="flex gap-2 bg-gray-800 p-3 rounded-lg border border-amber-600 cursor-pointer">
                          <select
                            value={timerType}
                            onChange={(e) => setTimerType(e.target.value)}
                            className="px-3 py-2 rounded text-sm bg-gray-900 text-white"
                          >
                            <option value="timer">Timer</option>
                            <option value="alarm">Alarm</option>
                          </select>

                          {timerType === "timer" ? (
                            <input
                              type="number"
                              value={timerInput}
                              onChange={(e) =>
                                setTimerInput(e.target.value)
                              }
                              placeholder="Minutes"
                              className="px-3 py-2 rounded text-sm bg-gray-900 text-white"
                            />
                          ) : (
                            <input
                              type="time"
                              value={alarmTime}
                              onChange={(e) =>
                                setAlarmTime(e.target.value)
                              }
                              className="px-3 py-2 rounded text-sm bg-gray-200 text-black"
                            />
                          )}

                          <button
                            onClick={() => handleSaveTimer(item.id)}
                            className="bg-green-500 px-4 py-2 rounded-lg hover:scale-105 cursor-pointer"
                          >
                            <FiSave size={18} />
                          </button>

                          <button
                            onClick={() => setTimerEditId(null)}
                            className="bg-gray-500 px-4 py-2 rounded-lg hover:scale-105 cursor-pointer"
                          >
                            <FiXCircle size={18} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setTimerEditId(item.id)}
                          className="bg-gray-500 px-4 py-2 rounded-lg hover:scale-105 cursor-pointer"
                        >
                          <FiClock size={18} />
                        </button>
                      )}

                      {/* Timer Remaining */}
                      {remaining[item.id] > 0 && (
                        <span className="text-amber-300 text-sm animate-pulse">
                          {Math.floor(remaining[item.id] / 60)}:
                          {(remaining[item.id] % 60)
                            .toString()
                            .padStart(2, "0")}
                        </span>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => {
                          setToDo(item.TodoName);
                          setEditId(item.id);
                          playClick();
                        }}
                        className="bg-gray-500 px-4 py-2 rounded-lg hover:scale-105 cursor-pointer"
                      >
                        <FiEdit3 size={18} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-600 px-4 py-2 rounded-lg hover:scale-105 cursor-pointer"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-gray-400 text-center cursor-pointer">
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
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Alarm is ringing!
            </h3>
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

      {/* Watermark */}
      <Watermark />

      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
    </div>
  );
};

export default Btn;
