import React, { memo } from 'react';
import { CheckCircle, Clock, Loader, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/30',
    animate: true,
  },
  'in-progress': {
    icon: Loader,
    label: 'In Progress',
    classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/30',
  },
  missing: {
    icon: AlertCircle,
    label: 'Missing',
    classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/30',
  },
};

function StatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${config.classes} ${
        config.animate ? 'animate-pulse-glow' : ''
      } ${className}`}
    >
      <Icon className={`w-3.5 h-3.5 ${config.animate ? '' : ''} ${status === 'in-progress' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
}

export default memo(StatusBadge);
