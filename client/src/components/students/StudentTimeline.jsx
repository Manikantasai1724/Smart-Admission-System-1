import React from 'react';
import { CheckCircle, Circle, UserCheck, FileText, FilePlus } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const TIMELINE_STEPS = [
  {
    key: 'formIssuing',
    label: 'Form Issuing',
    description: 'Admission form issued to student',
    icon: FileText,
  },
  {
    key: 'certificateScan',
    label: 'Certificate Scanning',
    description: 'Student certificates have been scanned',
    icon: UserCheck,
  },
  {
    key: 'photoCapture',
    label: 'Photo Capture',
    description: 'Student photo has been captured',
    icon: UserCheck,
  },
  {
    key: 'onlineFormFilling',
    label: 'Online Form Filling',
    description: 'Online admission details filled',
    icon: FilePlus,
  },
  {
    key: 'reportSubmission',
    label: 'Report Submission',
    description: 'Final report submitted successfully',
    icon: CheckCircle,
  },
];

function StudentTimeline({ student }) {
  if (!student) return null;

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Admission Journey
      </h3>
      <div className="relative">
        {TIMELINE_STEPS.map((step, index) => {
          const isCompleted = student.currentStep > index || student[step.key]?.completed;
          const isLast = index === TIMELINE_STEPS.length - 1;
          const Icon = step.icon;
          const updatedBy = student[step.key]?.completedBy;
          const updatedAt = student[step.key]?.completedAt || null;

          return (
            <div key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
              {/* Connecting line */}
              {!isLast && (
                <div className="absolute left-5 top-10 w-0.5 h-[calc(100%-20px)]">
                  <div
                    className={`w-full h-full transition-all duration-700 ${
                      isCompleted
                        ? 'bg-gradient-to-b from-emerald-400 to-emerald-300'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                </div>
              )}

              {/* Status icon */}
              <div className="flex-shrink-0 z-10">
                {isCompleted ? (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/25 animate-scale-in">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                    <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                  <h4 className={`text-sm font-semibold ${
                    isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.label}
                  </h4>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {step.description}
                </p>
                {isCompleted ? (
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {updatedAt && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ {formatDate(updatedAt)}
                      </span>
                    )}
                    {updatedBy && (
                      <span className="text-gray-400">
                        by {typeof updatedBy === 'object' ? updatedBy.name : updatedBy}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    <Circle className="w-3 h-3" />
                    Pending
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StudentTimeline;
