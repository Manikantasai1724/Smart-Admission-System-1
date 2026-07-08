import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ArrowUpDown } from 'lucide-react';
import StatusToggle from './StatusToggle';
import StatusBadge from '../common/StatusBadge';
import { calculateCompletionPercentage, getStatusLabel } from '../../utils/helpers';
import { STEP_LABELS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

function StudentTable({ students = [], onStatusChange, loading = false, sortConfig, onSort }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role?.toLowerCase() === 'volunteer';

  const handleSort = (key) => {
    if (onSort) onSort(key);
  };

  const SortHeader = ({ label, sortKey }) => (
    <button
      onClick={() => handleSort(sortKey)}
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
    >
      {label}
      <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
    </button>
  );

  if (!students.length && !loading) {
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
      {/* Mobile Card Layout (Visible on small screens) */}
      <div className="block md:hidden space-y-4">
        {students.map((student, index) => {
          const completion = calculateCompletionPercentage(student);
          return (
            <div
              key={student._id || student.id || index}
              onClick={() => navigate(`/students/${student._id || student.id}`)}
              className="glass-card p-4 hover:bg-white/40 dark:hover:bg-white/[0.02] cursor-pointer space-y-3"
            >
              {/* Header: Name, Initials, Dept */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {student.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {student.name || '—'}
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
                {student.rank && <span>Rank: {student.rank}</span>}
                {student.gender && <span>• {student.gender}</span>}
                {student.caste && <span className="px-1 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-400">{student.caste}</span>}
                {student.region && <span className="px-1 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-400">{student.region}</span>}
                {student.phase && <span className="px-1 py-0.2 rounded bg-primary-50 dark:bg-primary-900/20 text-[10px] text-primary-600 dark:text-primary-400">Phase {student.phase}</span>}
              </div>

              {/* Status Checklist */}
              <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-gray-100 dark:border-primary-400/5">
                <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-gray-50/50 dark:bg-primary-950/20" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] text-gray-400 mb-1">{STEP_LABELS.selfReported}</span>
                  {canEdit ? (
                    <StatusToggle
                      checked={!!student.selfReported}
                      onChange={(val) => onStatusChange?.(student._id || student.id, 'selfReported', val)}
                      label=""
                    />
                  ) : (
                    <StatusBadge status={student.selfReported ? 'completed' : 'pending'} />
                  )}
                </div>
                <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-gray-50/50 dark:bg-primary-950/20" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] text-gray-400 mb-1">{STEP_LABELS.documentsSubmitted}</span>
                  {canEdit ? (
                    <StatusToggle
                      checked={!!student.documentsSubmitted}
                      onChange={(val) => onStatusChange?.(student._id || student.id, 'documentsSubmitted', val)}
                      label=""
                    />
                  ) : (
                    <StatusBadge status={student.documentsSubmitted ? 'completed' : 'pending'} />
                  )}
                </div>
                <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-gray-50/50 dark:bg-primary-950/20" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] text-gray-400 mb-1">{STEP_LABELS.formFilled}</span>
                  {canEdit ? (
                    <StatusToggle
                      checked={!!student.formFilled}
                      onChange={(val) => onStatusChange?.(student._id || student.id, 'formFilled', val)}
                      label=""
                    />
                  ) : (
                    <StatusBadge status={student.formFilled ? 'completed' : 'pending'} />
                  )}
                </div>
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
                      const newStatus = !isComplete;
                      onStatusChange?.(student._id || student.id, {
                        selfReported: newStatus,
                        documentsSubmitted: newStatus,
                        formFilled: newStatus
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/50 dark:border-primary-400/10 whitespace-nowrap">
                <th className="text-left px-4 py-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">S.No</span>
                </th>
                <th className="text-left px-4 py-3.5">
                  <SortHeader label="Hall Ticket" sortKey="hallTicket" />
                </th>
                <th className="text-left px-4 py-3.5">
                  <SortHeader label="Name" sortKey="name" />
                </th>
                <th className="text-left px-4 py-3.5">
                  <SortHeader label="Department" sortKey="department" />
                </th>
                <th className="text-center px-4 py-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {STEP_LABELS.selfReported}
                  </span>
                </th>
                <th className="text-center px-4 py-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {STEP_LABELS.documentsSubmitted}
                  </span>
                </th>
                <th className="text-center px-4 py-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {STEP_LABELS.formFilled}
                  </span>
                </th>
                <th className="text-center px-4 py-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-primary-400/5">
              {students.map((student, index) => {
                const completion = calculateCompletionPercentage(student);
                const statusLabel = getStatusLabel(completion);

                return (
                  <tr
                    key={student._id || student.id || index}
                    onClick={() => navigate(`/students/${student._id || student.id}`)}
                    className="hover:bg-white/40 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{index + 1}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">
                        {student.hallTicket || student.hallTicketNumber || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {student.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {student.name || '—'}
                          </p>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5 text-xs text-gray-400">
                            {student.rank && <span>Rank: {student.rank}</span>}
                            {student.gender && <span>• {student.gender}</span>}
                            {student.caste && <span className="px-1 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-gray-600 dark:text-gray-400">{student.caste}</span>}
                            {student.region && <span className="px-1 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-gray-600 dark:text-gray-400">{student.region}</span>}
                            {student.phase && <span className="px-1 py-0.2 rounded bg-primary-50 dark:bg-primary-900/20 text-[10px] font-semibold text-primary-600 dark:text-primary-400">Phase {student.phase}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-xs font-semibold text-primary-700 dark:text-primary-400">
                        {student.department || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {canEdit ? (
                        <StatusToggle
                          checked={!!student.selfReported}
                          onChange={(val) => onStatusChange?.(student._id || student.id, 'selfReported', val)}
                          label=""
                        />
                      ) : (
                        <StatusBadge status={student.selfReported ? 'completed' : 'pending'} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {canEdit ? (
                        <StatusToggle
                          checked={!!student.documentsSubmitted}
                          onChange={(val) => onStatusChange?.(student._id || student.id, 'documentsSubmitted', val)}
                          label=""
                        />
                      ) : (
                        <StatusBadge status={student.documentsSubmitted ? 'completed' : 'pending'} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {canEdit ? (
                        <StatusToggle
                          checked={!!student.formFilled}
                          onChange={(val) => onStatusChange?.(student._id || student.id, 'formFilled', val)}
                          label=""
                        />
                      ) : (
                        <StatusBadge status={student.formFilled ? 'completed' : 'pending'} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {canEdit ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const isComplete = completion >= 100;
                            const newStatus = !isComplete;
                            onStatusChange?.(student._id || student.id, {
                              selfReported: newStatus,
                              documentsSubmitted: newStatus,
                              formFilled: newStatus
                            });
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            completion >= 100
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40'
                              : 'bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40'
                          }`}
                        >
                          {completion >= 100 ? 'Mark as Unread' : 'Mark as Read'}
                        </button>
                      ) : (
                        <StatusBadge status={completion >= 100 ? 'completed' : 'pending'} />
                      )}
                    </td>
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

export default StudentTable;
