import React, { useState } from 'react';
import { Sun, Moon, LogOut, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Modal from './Modal';

function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const getRoleBadgeColor = (role) => {
    if (role === 'hod') return 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  };

  return (
    <nav className="sticky top-0 z-40 w-full">
      <div className="glass dark:glass-dark border-b border-white/20 dark:border-primary-400/10">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Left: Logo + Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:block">
                AdmitTrack
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-white/30 dark:hover:bg-white/5 transition-all duration-200 group"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 group-hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1"></div>

            {/* User info */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                  {user?.name || 'User'}
                </p>
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${getRoleBadgeColor(user?.role)}`}>
                  {user?.role === 'hod' ? 'HOD' : 'Volunteer'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setShowLogoutModal(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 transition-colors"
            >
              Logout
            </button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Are you sure you want to log out of AdmitTrack? You will need to sign in again to access your dashboard.
        </p>
      </Modal>
    </nav>
  );
}

export default Navbar;
