import React, { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ArrowUpDown } from 'lucide-react';
import StatusToggle from './StatusToggle';
import StatusBadge from '../common/StatusBadge';
import { calculateCompletionPercentage, getStatusLabel } from '../../utils/helpers';
import { STEP_LABELS, ADMISSION_STEPS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const isStepDone = (student, stepKey, stepIndex) => {
  if (!student) return false;
  if (student[stepKey] && student[stepKey].completed === true) return true;
  const stepNum = typeof student.currentStep === 'number' ? student.currentStep : parseInt(student.currentStep, 10);
  return !isNaN(stepNum) && stepNum > stepIndex;
};

function StudentTable({ students = [], onStatusChange, loading = false, sortConfig, onSort, showHallTicket = false, showStatus = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role?.toLowerCase() === 'volunteer';

  const handleSort = (key) => {
    if (onSort) onSort(key);
  };

  const sortedStudents = useMemo(() => {
    const list = [...students];
    if (sortConfig && sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      return list;
    }

    // Default sorting: Sort by tokenNumber ascending (#1, #2, #3...).
    // Non-tokenized students come after tokenized students, sorted by createdAt descending.
    return list.sort((a, b) => {
      const aTok = a.tokenNumber;
      const bTok = b.tokenNumber;
      if (aTok !== null && aTok !== undefined && bTok !== null && bTok !== undefined) {
        return aTok - bTok;
      }
      if (aTok !== null && aTok !== undefined) return -1;
      if (bTok !== null && bTok !== undefined) return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [students, sortConfig]);

  const SortHeader = ({ label, sortKey }) => (
    <button
      onClick={() => handleSort(sortKey)}
      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
    >
      {label}
      <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
    </button>
  );

  if (!sortedStudents.length && !loading) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">No students found</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card Summary */}
      <div className="block md:hidden glass-card p-3 mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Step Completion Summary</span>
          <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">{sortedStudents.length} Students Total</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ADMISSION_STEPS.map((step, stepIndex) => {
            const completedCount = sortedStudents.filter(s => isStepDone(s, step, stepIndex)).length;
            return (
              <div key={step} className="p-2 rounded-lg bg-gray-50 dark:bg-primary-950/30 border border-gray-100 dark:border-primary-400/10 text-center">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 block truncate">{STEP_LABELS[step]}</span>
                <span className="text-xs font-extrabold text-primary-600 dark:text-primary-400">{completedCount} / {sortedStudents.length}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Card Layout (Visible on small screens) */}
      <div className="block md:hidden space-y-4">
        {sortedStudents.map((student, index) => {
          const completion = calculateCompletionPercentage(student);
          return (
            <div
              key={student._id || student.id || index}
              onClick={() => navigate(`/students/${student._id || student.id}`)}
              className="glass-card p-4 hover:bg-white/40 dark:hover:bg-white/[0.02] cursor-pointer space-y-3"
            >
              {/* Header: Name, Initials, Dept */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {student.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <span className="truncate min-w-0">{student.name || '—'}</span>
                      {student.tokenNumber && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/40 text-[10px] font-extrabold text-primary-700 dark:text-primary-300">
                          #{student.tokenNumber}
                        </span>
                      )}
                    </h5>
                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {student.hallTicket || student.hallTicketNumber || '—'}
                    </p>
                  </div>
                </div>
                <span className="inline-flex px-2 py-0.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-[10px] font-semibold text-primary-700 dark:text-primary-400">
                  {student.department || '—'}
                </span>
              </div>

              {/* Subtitle Details: Rank, Phase, etc */}
              <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
                {student.tokenNumber && <span className="px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900/40 text-[10px] font-extrabold text-primary-700 dark:text-primary-300">Token #{student.tokenNumber}</span>}
                {student.rank && <span>Rank: {student.rank}</span>}
                {student.gender && <span>• {student.gender}</span>}
                {student.region && <span className="px-1 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-400">{student.region}</span>}
              </div>

              {/* Status Checklist */}
              <div className="grid grid-cols-2 gap-2 py-2 border-t border-b border-gray-100 dark:border-primary-400/5">
                {ADMISSION_STEPS.map((step, stepIndex) => {
                  const isChecked = isStepDone(student, step, stepIndex);
                  return (
                    <div key={step} className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-gray-50/50 dark:bg-primary-950/20" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] text-gray-400 mb-1">{STEP_LABELS[step]}</span>
                      {canEdit ? (
                        <StatusToggle
                          checked={isChecked}
                          onChange={(val) => onStatusChange?.(student._id || student.id, 'currentStep', val ? stepIndex + 1 : stepIndex)}
                          label=""
                        />
                      ) : (
                        <StatusBadge status={isChecked ? 'completed' : 'pending'} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  completion >= 100
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {completion >= 100 ? 'Completed' : 'In Progress'}
                </span>
                {canEdit && (
                  <button
                    onClick={() => {
                        const isComplete = completion >= 100;
                        onStatusChange?.(student._id || student.id, {
                          currentStep: isComplete ? 0 : 5
                        });
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                      completion >= 100
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400'
                        : 'bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400'
                    }`}
                  >
                    {completion >= 100 ? 'Mark as Unread' : 'Mark as Read'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table Layout (Visible on larger screens) */}
      <div className="hidden md:block glass-card overflow-hidden">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1200px] table-fixed border-collapse">
            <colgroup>
              <col className="w-[5%]" />
              {showHallTicket && <col className="w-[12%]" />}
              <col className={showHallTicket ? "w-[25%]" : "w-[30%]"} />
              <col className="w-[10%]" />
              {ADMISSION_STEPS.map((step) => (
                <col key={step} className="w-[11%]" />
              ))}
              {showStatus && <col className="w-[10%]" />}
            </colgroup>
            <thead>
              <tr className="bg-gray-50/50 dark:bg-primary-950/20 border-b border-gray-200/50 dark:border-primary-400/10">
                <th className="text-left px-4 py-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">S.No</span>
                </th>
                {showHallTicket && (
                  <th className="text-left px-4 py-4">
                    <SortHeader label="Hall Ticket" sortKey="hallTicket" />
                  </th>
                )}
                <th className="text-left px-4 py-4">
                  <SortHeader label="Name" sortKey="name" />
                </th>
                <th className="text-left px-4 py-4">
                  <SortHeader label="Department" sortKey="department" />
                </th>
                {ADMISSION_STEPS.map((step, stepIndex) => {
                  const completedCount = sortedStudents.filter(s => isStepDone(s, step, stepIndex)).length;
                  const totalCount = sortedStudents.length;
                  return (
                    <th key={step} className="text-center px-2 py-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 leading-tight block">
                        {STEP_LABELS[step]} ({completedCount})
                      </span>
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 border border-primary-300/50 dark:border-primary-700/50 shadow-sm">
                        {completedCount} / {totalCount} Done
                      </span>
                    </th>
                  );
                })}
                {showStatus && (
                  <th className="text-center px-4 py-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 block">
                      Status ({sortedStudents.filter(s => s.currentStep === 5).length})
                    </span>
                    <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-700/50 shadow-sm">
                      {sortedStudents.filter(s => s.currentStep === 5).length} / {sortedStudents.length} Done
                    </span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-primary-400/5">
              {sortedStudents.map((student, index) => {
                const completion = calculateCompletionPercentage(student);

                return (
                  <tr
                    key={student._id || student.id || index}
                    onClick={() => navigate(`/students/${student._id || student.id}`)}
                    className="hover:bg-white/40 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{index + 1}</span>
                    </td>
                    {showHallTicket && (
                      <td className="px-4 py-4 truncate">
                        <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">
                          {student.hallTicket || student.hallTicketNumber || '—'}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {student.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate min-w-0">
                              {student.name || '—'}
                            </span>
                            {student.tokenNumber && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/40 text-[10px] font-extrabold text-primary-700 dark:text-primary-300">
                                #{student.tokenNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5 text-xs text-gray-400">
                            {student.rank && <span>Rank: {student.rank}</span>}
                            {student.gender && <span>• {student.gender}</span>}
                            {student.region && <span className="px-1 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-gray-600 dark:text-gray-400">{student.region}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-xs font-bold tracking-wide text-primary-700 dark:text-primary-400">
                        {student.department || '—'}
                      </span>
                    </td>
                    {ADMISSION_STEPS.map((step, stepIndex) => {
                      const isChecked = isStepDone(student, step, stepIndex);
                      return (
                        <td key={step} className="px-1 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {canEdit ? (
                            <StatusToggle
                              checked={isChecked}
                              onChange={(val) => onStatusChange?.(student._id || student.id, 'currentStep', val ? stepIndex + 1 : stepIndex)}
                              label=""
                            />
                          ) : (
                            <StatusBadge status={isChecked ? 'completed' : 'pending'} />
                          )}
                        </td>
                      );
                    })}
                    {showStatus && (
                      <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {canEdit ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const isComplete = completion >= 100;
                              onStatusChange?.(student._id || student.id, {
                                currentStep: isComplete ? 0 : 5
                              });
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                              completion >= 100
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40'
                                : 'bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40'
                            }`}
                          >
                            {completion >= 100 ? 'Unread' : 'Read'}
                          </button>
                        ) : (
                          <StatusBadge status={completion >= 100 ? 'completed' : 'pending'} />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default memo(StudentTable);
