import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, ArrowRight } from "lucide-react";

import { useAuth } from "../context/AuthContext";

// Module-level variable (persists during client-side routing, resets on browser refresh)
let hasRunSplash = false;

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Control splash screen on first load / page refresh
  const [showSplash, setShowSplash] = React.useState(() => {
    return !hasRunSplash;
  });
  const [fadeSplash, setFadeSplash] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "hod") {
        navigate("/hod/dashboard", { replace: true });
      } else {
        navigate("/volunteer/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  React.useEffect(() => {
    if (showSplash) {
      // Start fading out splash screen shortly before removing it
      const fadeTimer = setTimeout(() => {
        setFadeSplash(true);
      }, 3100);

      const removeTimer = setTimeout(() => {
        setShowSplash(false);
        hasRunSplash = true;
      }, 3800);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [showSplash]);

  return (
    <div className="login-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* First-time Splash Loading Intro (Cinematic full-page transition) */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-50 bg-[#02101a] flex flex-col items-center justify-center transition-all duration-[800ms] ease-in-out ${fadeSplash ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
            }`}
        >
          {/* Splash background orbs for cinematic lighting */}
          <div className="login-orb w-[500px] h-[500px] bg-primary-500/15 top-[15%] left-[15%] blur-[80px] animate-pulse-glow" />
          <div className="login-orb w-[500px] h-[500px] bg-srkrOrange-500/10 bottom-[15%] right-[15%] blur-[80px] animate-pulse-glow" />

          <div className="relative z-10 flex flex-col items-center text-center px-6">
            {/* Cinematic Zoom/Rotate Logo with sweeping metallic shine */}
            <div className="animate-cinematic-logo mb-10 rounded-2xl p-4 bg-white/5 backdrop-blur-md shadow-2xl border border-white/10 animate-flash-sweep">
              <img
                src="/srkr_logo.png"
                alt="SRKR College Logo"
                className="w-80 md:w-[48px] h-auto object-contain"
              />
            </div>

            {/* Cinematic Fade-in Text */}
            <div className="animate-cinematic-text">
              <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary-400 via-primary-100 to-srkrOrange-400 bg-clip-text text-transparent tracking-widest uppercase">
                SRKR Engineering College
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-srkrOrange-500 rounded-full mt-5 mb-5 mx-auto opacity-70" />
              <p className="text-gray-400 mt-2 tracking-widest text-xs md:text-sm font-semibold uppercase">
                Smart Admission Tracking & Verification
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Orbs */}
      <div className="login-orb" />
      <div className="login-orb" />

      <div className="relative z-10 max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex flex-col items-center justify-center mb-6">
            <img
              src="/srkr_logo.png"
              alt="SRKR Engineering College Logo"
              className="w-72 md:w-96 h-auto object-contain mb-5 animate-float"
            />
            <h1 className="text-3xl md:text-4.5xl font-black bg-gradient-to-r from-primary-600 via-primary-500 to-srkrOrange-600 bg-clip-text text-transparent tracking-wide">
              SRKR Engineering College
            </h1>
            <p className="text-sm font-semibold tracking-widest text-primary-500 dark:text-primary-400 uppercase mt-1.5">
              Autonomous
            </p>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2 font-medium">
            EAPCET Admission Tracking System
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            Select your role to continue
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* HOD Card (Ocean Blue Theme) */}
          <div
            onClick={() => navigate("/login/hod")}
            className="group cursor-pointer glass-card p-8 rounded-2xl hover:shadow-2xl hover:shadow-primary-500/25 transition-all duration-300 transform hover:-translate-y-2 border border-white/20 dark:border-primary-400/10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shadow-lg group-hover:shadow-primary-500/50 transition-shadow">
                <UserCheck className="w-8 h-8" />
              </div>
              <ArrowRight className="w-6 h-6 text-primary-400 group-hover:translate-x-2 transition-transform" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              HOD
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Head of Department Portal
            </p>
            <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                Upload student data (CSV/XLSX/PDF)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                View department statistics & analytics
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                Access secure audit logs
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                Manage student records
              </li>
            </ul>
            <button className="mt-8 w-full glass-button bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-primary-500/20 py-3 rounded-xl font-semibold transition-colors">
              Continue as HOD
            </button>
          </div>

          {/* Volunteer Card (Accent Orange Theme) */}
          <div
            onClick={() => navigate("/login/volunteer")}
            className="group cursor-pointer glass-card p-8 rounded-2xl hover:shadow-2xl hover:shadow-srkrOrange-500/25 transition-all duration-300 transform hover:-translate-y-2 border border-white/20 dark:border-srkrOrange-400/10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-srkrOrange-400 to-srkrOrange-600 flex items-center justify-center text-white shadow-lg group-hover:shadow-srkrOrange-500/50 transition-shadow">
                <Users className="w-8 h-8" />
              </div>
              <ArrowRight className="w-6 h-6 text-srkrOrange-400 group-hover:translate-x-2 transition-transform" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Volunteer
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Admission Coordinator
            </p>
            <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-srkrOrange-500" />
                Search & filter students
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-srkrOrange-500" />
                Update student verification status
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-srkrOrange-500" />
                Add verification remarks
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-srkrOrange-500" />
                Track overall progress
              </li>
            </ul>
            <button className="mt-8 w-full glass-button bg-gradient-to-r from-srkrOrange-500 to-srkrOrange-600 hover:from-srkrOrange-600 hover:to-srkrOrange-700 shadow-srkrOrange-500/20 py-3 rounded-xl font-semibold transition-colors">
              Continue as Volunteer
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3 animate-fade-in">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Smart Admission Tracking & Verification System
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs">
            © 2026 All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
