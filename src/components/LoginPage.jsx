import React from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { app, db } from "../Config/firebaseConfig.js";
import { motion } from "framer-motion";
import { Shield, Lock, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import Watermark from "./Watermark.jsx";

const LoginPage = () => {
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const auth = getAuth(app);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 flex items-center justify-center p-4 text-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-gray-800 relative overflow-hidden"
      >
        {/* Glowing Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ repeat: Infinity, duration: 3, repeatType: "reverse" }}
          className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500 blur-3xl rounded-full"
        ></motion.div>

        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-extrabold mb-3">
            Task <span className="text-orange-400">Flow</span>
          </h1>
          <p className="text-gray-400 mb-8">Your productivity starts here</p>

          {/* Security badges */}
          <div className="flex justify-center gap-6 mb-6 text-gray-400 text-sm">
            <div className="flex items-center gap-1"><Shield size={16} /> Secure Login</div>
            <div className="flex items-center gap-1"><Lock size={16} /> Encrypted</div>
            <div className="flex items-center gap-1"><Mail size={16} /> Verified Auth</div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 cursor-pointer py-3 px-4 text-gray-900 font-semibold rounded-lg bg-white hover:bg-gray-200 transition shadow-lg"
          >
            <img
              className="w-5 h-5"
              src="https://www.svgrepo.com/show/355037/google.svg"
              alt="Google"
            />
            Continue with Google
          </motion.button>

          {/* Additional Login Options */}
          <div className="mt-6 text-sm text-gray-500">More login methods coming soon...</div>

          {/* Footer */}
          <div className="text-xs mt-8 text-gray-600">
            <p className="text-xs mt-8 text-gray-600">
              By signing in, you agree to our{" "}
              <Link to="/terms" className="text-orange-400 hover:underline">
                Terms & Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
        <Watermark />
    </div>
  );
};

export default LoginPage;
