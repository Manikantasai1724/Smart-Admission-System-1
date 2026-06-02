import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Clock } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import StatusToggle from './StatusToggle';
import { calculateCompletionPercentage, formatDate } from '../../utils/helpers';
import { STEP_LABELS, ADMISSION_STEPS } from '../../utils/constants';

function StudentCard({ student, onStatusChange, showActions = true }) {
  const navigate = useNavigate();
  const completion = calculateCompletionPercentage(student);

  return (
    <div className="glass-card p-5 card-hover group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-500/20">
            {student.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {student.name || 'Unknown'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {student.hallTicket || student.hallTicketNumber || 'No Hall Ticket'}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-xs font-semibold text-primary-600 dark:text-primary-400">
          {student.department || '—'}
        </span>
      </div>

      {/* Rank */}
      {student.rank && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Rank: <span className="font-semibold text-gray-600 dark:text-gray-300">{student.rank}</span>
        </p>
      )}

      {/* Status and Steps */}
      <div className="flex items-center gap-5 mb-4">
        <div className="flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full bg-gray-50 dark:bg-primary-900/10 border-2 border-dashed border-gray-200 dark:border-primary-400/20">
          {completion >= 100 ? (
            <span className="text-xs font-bold text-emerald-500 text-center leading-tight">Done</span>
          ) : (
            <span className="text-xs font-bold text-amber-500 text-center leading-tight">Pending</span>
          )}
        </div>
        <div className="flex-1 space-y-2.5">
          {ADMISSION_STEPS.map((step) => (
            <div key={step} className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {STEP_LABELS[step]}
              </span>
              {showActions && onStatusChange ? (
                <StatusToggle
                  checked={!!student[step]}
                  onChange={(val) => onStatusChange(student._id || student.id, step, val)}
                />
              ) : (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  student[step]
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  {student[step] ? '✓' : '—'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-primary-400/10">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          {student.updatedAt ? formatDate(student.updatedAt) : 'Not updated'}
        </div>
        <button
          onClick={() => navigate(`/students/${student._id || student.id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Eye className="w-3.5 h-3.5" />
          Details
        </button>
      </div>
    </div>
  );
}

export default StudentCard;
