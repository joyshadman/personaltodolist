import React, { useState, useEffect, useRef } from 'react'
import { ToastContainer, toast, Bounce } from 'react-toastify'
import { getDatabase, ref, set, push, onValue, remove } from "firebase/database"
import 'react-toastify/dist/ReactToastify.css'
import ambSound from '../assets/amb.mp3' // Import your audio

const Btn = () => {
  const [toDo, setToDo] = useState("")
  const [todoList, setTodoList] = useState([])
  const [editId, setEditId] = useState(false)
  const [timerEditId, setTimerEditId] = useState(null)
  const [timerInput, setTimerInput] = useState("")
  const [timers, setTimers] = useState({})
  const [remaining, setRemaining] = useState({})
  const [timerType, setTimerType] = useState("timer")
  const [alarmTime, setAlarmTime] = useState("")
  const [checkedTasks, setCheckedTasks] = useState({})
  const [showStopPopup, setShowStopPopup] = useState(false);
  const [ringingTask, setRingingTask] = useState(null);
  const alarmRef = useRef(null)
  const deleteTimeouts = useRef({})

  const notify = (type, msg) => {
    const opts = {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      transition: Bounce,
    }
    if (type === 'error') {
      toast.error(msg || 'Please, enter your task', { ...opts, theme: "dark", progress: true })
    } else {
      toast.success(msg || 'Your task has successfully submitted', { ...opts, theme: "colored", progress: undefined })
    }
  }

  const handleClick = (e) => {
    e.preventDefault();
    if (toDo === "") {
      notify('error');
    } else {
      const db = getDatabase();
      set(push(ref(db, "Todo/")), {
        TodoName: toDo,
      }).then(() => {
        notify('success');
        setToDo("");
      });
    }
  };

  useEffect(() => {
    const db = getDatabase();
    const todoRef = ref(db, "Todo/");
    onValue(todoRef, (snapshot) => {
      const arr = [];
      snapshot.forEach((item) => {
        arr.push({
          id: item.key,
          ...item.val()
        });
      });
      setTodoList(arr);
    });
  }, []);

  const handleDelete = (itemId) => {
    // Clear timer/alarm interval if exists
    if (timers[itemId]?.intervalId) {
      clearInterval(timers[itemId].intervalId);
    }
    // Clear delete timeout if exists
    if (deleteTimeouts.current[itemId]) {
      clearTimeout(deleteTimeouts.current[itemId]);
      delete deleteTimeouts.current[itemId];
    }
    // Remove timer and remaining state for this task
    setTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[itemId];
      return newTimers;
    });
    setRemaining(prev => {
      const newRemaining = { ...prev };
      delete newRemaining[itemId];
      return newRemaining;
    });
    setCheckedTasks(prev => {
      const newChecked = { ...prev };
      delete newChecked[itemId];
      return newChecked;
    });

    const db = getDatabase();
    const todoRef = ref(db, `Todo/${itemId}`);
    remove(todoRef).then(() => {
      notify('success', 'Task deleted');
    });
  };

  const handleEdit = (itemId) => {
    setEditId(itemId);
    const todoToEdit = todoList.find(item => item.id === itemId);
    setToDo(todoToEdit.TodoName);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (toDo === "") {
      notify('error');
    } else {
      const db = getDatabase();
      set(ref(db, `Todo/${editId}`), {
        TodoName: toDo,
      }).then(() => {
        setEditId(false);
        setToDo("");
        notify('success');
      });
    }
  };

  // Timer logic
  const handleSetTimerClick = (itemId) => {
    setTimerEditId(itemId)
    setTimerInput("")
  }

  // Play alarm/timer sound and show stop popup
  const playAlarm = (taskId) => {
    if (alarmRef.current) {
      alarmRef.current.volume = 0.5;
      alarmRef.current.currentTime = 0;
      alarmRef.current.play();
    }
    setRingingTask(taskId);
    setShowStopPopup(true);
    // Only show one toast for alarm/timer ring
    toast.info(`⏰ ${timerType === "timer" ? "Time's up" : "Alarm"} for: ${todoList.find(t => t.id === taskId)?.TodoName || 'Task'}`, {
      position: "top-right",
      autoClose: 7000,
      theme: "colored",
      transition: Bounce,
    });
  };

  const stopAlarm = () => {
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }
    setShowStopPopup(false);
    setRingingTask(null);
  };

  const handleSaveTimer = (itemId) => {
    if (timerType === "timer") {
      const minsNum = parseInt(timerInput, 10)
      if (!isNaN(minsNum) && minsNum > 0) {
        if (timers[itemId]?.intervalId) {
          clearInterval(timers[itemId].intervalId)
        }
        const end = Date.now() + minsNum * 60 * 1000
        const intervalId = setInterval(() => {
          setRemaining(prev => {
            const secondsLeft = Math.max(0, Math.floor((end - Date.now()) / 1000))
            if (secondsLeft === 0) {
              clearInterval(intervalId)
              playAlarm(itemId);
            }
            return { ...prev, [itemId]: secondsLeft }
          })
        }, 1000)
        setTimers(prev => ({
          ...prev,
          [itemId]: { end, intervalId }
        }))
        setRemaining(prev => ({
          ...prev,
          [itemId]: minsNum * 60
        }))
        setTimerEditId(null)
        notify('success', `Timer set for ${minsNum} minute(s)!`)
      }
    } else if (timerType === "alarm") {
      const [alarmHour, alarmMinute] = alarmTime.split(":").map(Number);
      if (
        !isNaN(alarmHour) &&
        !isNaN(alarmMinute) &&
        alarmHour >= 0 &&
        alarmHour < 24 &&
        alarmMinute >= 0 &&
        alarmMinute < 60
      ) {
        if (timers[itemId]?.intervalId) {
          clearInterval(timers[itemId].intervalId)
        }
        const now = new Date();
        const alarmDate = new Date();
        alarmDate.setHours(alarmHour, alarmMinute, 0, 0);
        if (alarmDate < now) {
          alarmDate.setDate(alarmDate.getDate() + 1);
        }
        const msUntilAlarm = alarmDate - now;
        const intervalId = setInterval(() => {
          const nowCheck = new Date();
          if (
            nowCheck.getHours() === alarmHour &&
            nowCheck.getMinutes() === alarmMinute
          ) {
            clearInterval(intervalId)
            playAlarm(itemId);
          }
        }, 1000)
        setTimers(prev => ({
          ...prev,
          [itemId]: { end: alarmDate.getTime(), intervalId }
        }))
        setRemaining(prev => ({
          ...prev,
          [itemId]: Math.floor(msUntilAlarm / 1000)
        }))
        setTimerEditId(null)
        notify('success', `Alarm set for ${alarmTime}`)
      }
    }
  }

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(timers).forEach(timer => {
        if (timer.intervalId) clearInterval(timer.intervalId)
      })
      Object.values(deleteTimeouts.current).forEach(timeout => clearTimeout(timeout))
    }
  }, [timers])

  // Handle checkbox logic
  const handleCheck = (itemId) => {
    setCheckedTasks(prev => {
      const checked = !prev[itemId];
      if (checked) {
        // Set timeout to delete after 1 hour
        const timeout = setTimeout(() => {
          handleDelete(itemId);
        }, 60 * 60 * 1000);
        deleteTimeouts.current[itemId] = timeout;
        toast.success('Task will be deleted after 1 hour', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          transition: Bounce,
        });
      } else {
        // Uncheck: clear timeout
        if (deleteTimeouts.current[itemId]) {
          clearTimeout(deleteTimeouts.current[itemId]);
          delete deleteTimeouts.current[itemId];
        }
      }
      return { ...prev, [itemId]: checked }
    });
  };

  return (
    <div>
      <div className="w-full flex flex-col items-center justify-center mt-6 px-2">
        <form
          className="w-full max-w-md flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch"
          onSubmit={editId ? handleUpdate : handleClick}
        >
          <input
            type="text"
            value={toDo}
            onChange={(e) => setToDo(e.target.value)}
            className="flex-1 min-w-0 p-3 text-gray-300 bg-gray-900 border border-amber-600 rounded-lg 
              hover:border-amber-400 hover:scale-[1.02] 
              focus:border-amber-300 focus:scale-[1.02] 
              focus:outline-none transition-all duration-700
              placeholder-gray-500"
            placeholder="Add a new task..."
          />
          <button 
            type="submit"
            className="w-full sm:w-auto flex-shrink-0 cursor-pointer transition-all duration-700 relative inline-flex items-center justify-center p-0.5 mb-2 sm:mb-0 sm:me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-red-200 via-red-300 to-yellow-200 group-hover:from-red-200 group-hover:via-red-300 group-hover:to-yellow-200 dark:text-white dark:hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-red-100 dark:focus:ring-red-400 hover:scale-[1.02]"
          >
            <span className="relative w-full sm:w-auto px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
              {editId ? 'Update Task' : 'Add Task'}
            </span>
          </button>
        </form>
        <ToastContainer />
      </div>
      <div className="flex flex-col items-center justify-center mt-16 px-2">
        <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-extrabold mb-6 text-center">Your Tasks</h1>
        <div className="w-full max-w-md sm:max-w-lg md:max-w-xl rounded-lg p-4">
          <ul>
            {todoList.map((item) => (
              <li
                key={item.id}
                className="w-full border-gray-600 border-b-2 p-5 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-600 transition duration-200 ease-in-out text-white gap-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!checkedTasks[item.id]}
                    onChange={() => handleCheck(item.id)}
                    className="accent-amber-500 w-5 h-5"
                  />
                  <span className={checkedTasks[item.id] ? "line-through text-gray-400" : ""}>
                    {item.TodoName}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  <button
                    onClick={() => handleEdit(item.id)}
                    className="cursor-pointer px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
                  >
                    Edit
                  </button>
                  {timerEditId === item.id ? (
                    <>
                      <select
                        value={timerType}
                        onChange={e => setTimerType(e.target.value)}
                        className="px-2 py-1 rounded border border-amber-600 text-black"
                      >
                        <option value="timer">Timer</option>
                        <option value="alarm">Alarm</option>
                      </select>
                      {timerType === "timer" ? (
                        <input
                          type="number"
                          min="1"
                          value={timerInput}
                          onChange={e => setTimerInput(e.target.value)}
                          className="w-20 px-2 py-1 rounded border border-amber-600 text-black"
                          placeholder="min"
                        />
                      ) : (
                        <input
                          type="time"
                          value={alarmTime}
                          onChange={e => setAlarmTime(e.target.value)}
                          className="px-2 py-1 rounded border border-amber-600 text-black"
                        />
                      )}
                      <button
                        onClick={() => handleSaveTimer(item.id)}
                        className="cursor-pointer px-3 py-1 text-sm bg-green-500 hover:bg-green-600 rounded-lg text-white"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setTimerEditId(null)}
                        className="cursor-pointer px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 rounded-lg text-white"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleSetTimerClick(item.id)}
                      className="cursor-pointer px-3 py-1 text-sm bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white"
                    >
                      Set Timer/Alarm
                    </button>
                  )}
                  {remaining[item.id] > 0 && (
                    <span className="ml-2 text-xs text-amber-300">
                      ⏰ {Math.floor(remaining[item.id] / 60)}:{(remaining[item.id] % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="cursor-pointer px-3 py-1 text-sm bg-red-500 hover:bg-red-600 rounded-lg text-white"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {showStopPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
            <span className="text-lg font-bold mb-4 text-gray-800">
              ⏰ {timerType === "timer" ? "Timer" : "Alarm"} is ringing!
            </span>
            <button
              onClick={stopAlarm}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Stop
            </button>
          </div>
        </div>
      )}
      <audio
        ref={alarmRef}
        src={ambSound}
        preload="auto"
      />
    </div>
  )
}

export default Btn