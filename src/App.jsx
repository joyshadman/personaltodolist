import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "./Config/firebaseConfig";

import Navbar from "./components/navbar";
import Btn from "./components/Btn";
import LoginPage from "./components/LoginPage";
import TermsPolicyPage from "./components/Termsploicy"; 
import { Toaster } from "react-hot-toast";

function App() {
  const [user, setUser] = useState(null);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Current User:", currentUser);
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      <Routes>
        {/* 🔥 Terms Page — Always visible without login */}
        <Route path="/terms" element={<TermsPolicyPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 🔐 Protected Home Page */}
        <Route
          path="/"
          element={
            !user ? (
              <LoginPage />
            ) : (
              <>
                <Navbar user={user} onSignOut={handleSignOut} />
                <Btn user={user} />
              </>
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
