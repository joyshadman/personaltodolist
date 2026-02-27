// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "./Config/firebaseConfig";

import Navbar from "./components/navbar";
import Btn from "./components/btn";
import LoginPage from "./components/LoginPage";
import TermsPolicyPage from "./components/Termsploicy";
import Notes from "./components/Notes";
import About from "./components/About";
import { Toaster } from "react-hot-toast";

function App() {
  const [user, setUser] = useState(null);
  const auth = getAuth(app);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      console.log("Current User:", currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  // Sign out function
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      <Routes>
        {/* Public Pages */}
        <Route path="/terms" element={<TermsPolicyPage />} />

        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to="/" replace />}
        />

        {/* About Page */}
        <Route
          path="/about"
          element={<About user={user} onSignOut={handleSignOut} />}
        />

        {/* Notes Page (Protected) */}
        <Route
          path="/notes"
          element={user ? <Notes user={user} /> : <Navigate to="/login" replace />}
        />

        {/* Protected Home Page */}
        <Route
          path="/"
          element={
            user ? (
              <>
                <Navbar user={user} onSignOut={handleSignOut} />
                <Btn user={user} />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
