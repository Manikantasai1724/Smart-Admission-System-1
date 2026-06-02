import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Upload,
  ChevronLeft,
  ChevronRight,
  X,
  History,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HOD_LINKS = [
  { to: '/hod/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/hod/audit-logs', label: 'Audit Logs', icon: History },
];

const VOLUNTEER_LINKS = [
  { to: '/volunteer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
];

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'User Management', icon: ShieldAlert },
];

function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user } = useAuth();
  
  let links = VOLUNTEER_LINKS;
  if (user?.role?.toLowerCase() === 'hod') links = HOD_LINKS;
  if (user?.role?.toLowerCase() === 'admin') links = ADMIN_LINKS;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Mobile close button */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 dark:border-primary-400/10">
        <span className="text-lg font-bold gradient-text">Menu</span>
        <button
          onClick={onMobileClose}
          className="p-2 rounded-xl hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500/10 to-primary-600/10 text-primary-600 dark:from-primary-500/20 dark:to-primary-600/20 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-500'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                </div>
                {!collapsed && (
                  <span className="font-medium text-sm whitespace-nowrap">{link.label}</span>
                )}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200/50 dark:border-primary-400/10">
          <div className="text-center">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              AdmitTrack v1.0.0
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
              © 2024 Smart Admissions
            </p>
          </div>
        </div>
      )}

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:flex justify-center p-3 border-t border-gray-200/50 dark:border-primary-400/10">
        <button
          onClick={onToggle}
          className="p-2 rounded-xl hover:bg-white/30 dark:hover:bg-white/5 transition-all duration-200 text-gray-500 dark:text-gray-400"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full z-50 w-72 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full glass dark:glass-dark border-r border-white/20 dark:border-primary-400/10">
          {sidebarContent}
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:block flex-shrink-0 h-[calc(100vh-4rem)] sticky top-16 transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="h-full glass dark:glass-dark border-r border-white/20 dark:border-primary-400/10 overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
