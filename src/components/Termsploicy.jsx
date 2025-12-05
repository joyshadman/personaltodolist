import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";


const TermsPolicyPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-gray-100 p-6 flex justify-center items-start">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-3xl bg-gray-900/80 backdrop-blur-xl rounded-3xl p-10 shadow-xl border border-gray-800 relative overflow-hidden"
            >
                {/* Glow effect */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ repeat: Infinity, duration: 3, repeatType: "reverse" }}
                    className="absolute -top-16 -right-10 w-60 h-60 bg-orange-500 blur-3xl rounded-full"
                ></motion.div>

                <div className="relative z-10">
                    <h1 className="text-4xl font-bold mb-6 text-center">
                        Terms & <span className="text-orange-400">Privacy Policy</span>
                    </h1>

                    <p className="text-gray-400 mb-6 text-center">
                        Last updated: {new Date().getFullYear()}
                    </p>

                    {/* Terms Section */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-orange-400 mb-3">Terms of Use</h2>
                        <p className="text-gray-300 mb-3">
                            Welcome to TaskFlow. By using our app, you agree to follow these terms and conditions. If you do not agree, please discontinue using the service.
                        </p>
                        <ul className="list-disc ml-6 text-gray-300 space-y-2">
                            <li>You must be at least 13 years old to use the application.</li>
                            <li>You are responsible for keeping your login credentials secure.</li>
                            <li>You agree not to misuse the service or attempt unauthorized access.</li>
                            <li>We may update these terms at any time with or without notice.</li>
                        </ul>
                    </section>

                    {/* Privacy Policy */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-orange-400 mb-3">Privacy Policy</h2>
                        <p className="text-gray-300 mb-3">
                            Your privacy is important to us. TaskFlow only collects minimal information needed to provide a secure and personalized experience.
                        </p>

                        <h3 className="text-xl font-semibold mb-2 text-gray-200">Information We Collect</h3>
                        <ul className="list-disc ml-6 text-gray-300 space-y-2 mb-4">
                            <li>Your Google name, email, and profile picture for authentication.</li>
                            <li>Basic usage data to improve user experience.</li>
                            <li>Tasks you create inside the app — stored securely in your account.</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-2 text-gray-200">How We Use Your Data</h3>
                        <ul className="list-disc ml-6 text-gray-300 space-y-2 mb-4">
                            <li>To authenticate and verify your identity.</li>
                            <li>To sync your tasks across devices.</li>
                            <li>To improve performance and security.</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-2 text-gray-200">Your Rights</h3>
                        <ul className="list-disc ml-6 text-gray-300 space-y-2 mb-4">
                            <li>You can delete your account at any time.</li>
                            <li>You may request removal of all your stored data.</li>
                            <li>We do not sell, trade, or share your data with advertisers.</li>
                        </ul>
                    </section>

                    <p className="text-gray-500 text-sm text-center mt-10">
                        If you have questions about our policies, contact us anytime.
                    </p>
                    <div className="flex justify-center mt-6">
                        <Link to="/login">
                            <button className="px-10 py-3 bg-orange-400 mx-auto rounded-full text-1xl hover:bg-orange-500 hover:scale-110 transition transform ease-in-out duration-1000 cursor-pointer ">Home</button>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TermsPolicyPage;