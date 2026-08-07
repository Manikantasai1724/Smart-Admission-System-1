import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

const TOAST_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_COLORS = {
  success: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    icon: 'text-emerald-500',
    text: 'text-emerald-800 dark:text-emerald-200',
  },
  error: {
    border: 'border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-900/30',
    icon: 'text-red-500',
    text: 'text-red-800 dark:text-red-200',
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    icon: 'text-amber-500',
    text: 'text-amber-800 dark:text-amber-200',
  },
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    icon: 'text-blue-500',
    text: 'text-blue-800 dark:text-blue-200',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = ++toastId;
    const toast = { id, type, message, duration, exiting: false };
    setToasts(prev => [...prev, toast]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, [removeToast]);

  const value = { addToast, removeToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.type] || Info;
          const colors = TOAST_COLORS[toast.type] || TOAST_COLORS.info;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border-l-4 ${colors.border} ${colors.bg} backdrop-blur-lg shadow-lg ${
                toast.exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'
              }`}
            >
              <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${colors.icon}`} />
              <p className={`text-sm font-medium flex-1 ${colors.text}`}>{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
