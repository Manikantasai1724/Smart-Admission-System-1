import React from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Users, UserCheck, ArrowRight } from "lucide-react";

import { useAuth } from "../context/AuthContext";

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "hod") {
        navigate("/hod/dashboard", { replace: true });
      } else {
        navigate("/volunteer/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="login-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Orbs */}
      <div className="login-orb" />
      <div className="login-orb" />

      <div className="relative z-10 max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shadow-xl shadow-primary-500/25">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              AdmitTrack
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            EAPCET Admission Tracking System
          </p>
          <p className="text-gray-500 dark:text-gray-500">
            Select your role to continue
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* HOD Card */}
          <div
            onClick={() => navigate("/login/hod")}
            className="group cursor-pointer glass-card p-8 rounded-2xl hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg group-hover:shadow-blue-500/50 transition-shadow">
                <UserCheck className="w-8 h-8" />
              </div>
              <ArrowRight className="w-6 h-6 text-primary-400 group-hover:translate-x-2 transition-transform" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              HOD
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Head of Department
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Upload student data
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                View department statistics
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Access audit logs
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Manage all students
              </li>
            </ul>
            <button className="mt-8 w-full glass-button py-3 rounded-xl font-semibold group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
              Continue as HOD
            </button>
          </div>

          {/* Volunteer Card */}
          <div
            onClick={() => navigate("/login/volunteer")}
            className="group cursor-pointer glass-card p-8 rounded-2xl hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:shadow-emerald-500/50 transition-shadow">
                <Users className="w-8 h-8" />
              </div>
              <ArrowRight className="w-6 h-6 text-primary-400 group-hover:translate-x-2 transition-transform" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Volunteer
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Admission Volunteer / Coordinator
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Search students
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Update student status
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                View pending students
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Track progress
              </li>
            </ul>
            <button className="mt-8 w-full glass-button py-3 rounded-xl font-semibold group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
              Continue as Volunteer
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Smart Admission Tracking & Verification System
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs">
            © 2024 All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
