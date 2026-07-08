import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Clock, Phone, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { generateStudentToken } from '../../services/studentService';
import Modal from '../common/Modal';
import StatusToggle from './StatusToggle';
import { calculateCompletionPercentage, formatDate } from '../../utils/helpers';
import { STEP_LABELS, ADMISSION_STEPS } from '../../utils/constants';

function StudentCard({ student, onStatusChange, onTokenGenerated, showActions = true }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phone, setPhone] = useState(student.phone || '');
  const [parentPhone, setParentPhone] = useState(student.parentPhone || '');
  const [generating, setGenerating] = useState(false);

  const completion = calculateCompletionPercentage(student);

  const handleOpenModal = (e) => {
    e.stopPropagation(); // prevent card click navigation
    setPhone(student.phone || '');
    setParentPhone(student.parentPhone || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitToken = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanParentPhone = parentPhone.trim().replace(/\D/g, '');
    if (!cleanPhone || !cleanParentPhone) {
      return addToast('error', 'Both student and parent phone numbers are required');
    }
    if (cleanPhone.length !== 10 || cleanParentPhone.length !== 10) {
      return addToast('error', 'Both phone numbers must be exactly 10 digits');
    }
    try {
      setGenerating(true);
      const res = await generateStudentToken(student._id || student.id, {
        phone: cleanPhone,
        parentPhone: cleanParentPhone,
      });
      addToast('success', res.data.message || 'Token generated successfully');
      
      // Update local state in the list immediately for smooth UX
      if (onTokenGenerated) {
        onTokenGenerated(student._id || student.id, res.data.student);
      } else if (onStatusChange) {
        onStatusChange(student._id || student.id, {
          phone: res.data.student.phone,
          parentPhone: res.data.student.parentPhone,
          tokenNumber: res.data.student.tokenNumber,
          tokenGeneratedAt: res.data.student.tokenGeneratedAt,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to generate token');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="glass-card p-5 card-hover group flex flex-col justify-between min-h-[280px]">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-500/20">
              {student.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate max-w-[120px]" title={student.name}>
                {student.name || 'Unknown'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {student.hallTicket || student.hallTicketNumber || 'No Hall Ticket'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-xs font-semibold text-primary-600 dark:text-primary-400">
              {student.department || '—'}
            </span>
            {student.tokenNumber && (
              <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-[10px] font-bold text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/30 shadow-sm">
                Token #{student.tokenNumber} ({student.department})
              </span>
            )}
          </div>
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
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-primary-400/10 mt-2">
        <div className="flex flex-col gap-0.5 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {student.updatedAt ? formatDate(student.updatedAt) : 'Not updated'}
          </div>
          {student.tokenGeneratedAt && (
            <span className="text-[10px] text-purple-500 dark:text-purple-400 font-medium">
              Generated: {formatDate(student.tokenGeneratedAt)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!student.tokenNumber && user?.role?.toLowerCase() === 'volunteer' && (
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-500 hover:bg-purple-600 text-white shadow-md shadow-purple-500/25 transition-all duration-200"
            >
              Generate Token
            </button>
          )}
          <button
            onClick={() => navigate(`/students/${student._id || student.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
          >
            <Eye className="w-3.5 h-3.5" />
            Details
          </button>
        </div>
      </div>

      {/* Token Generation Phone Inputs Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Verify Contact - ${student.name}`}
        size="sm"
        footer={
          <>
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              disabled={generating}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitToken}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-purple-500 hover:bg-purple-600 text-white shadow-md shadow-purple-500/25 transition-colors flex items-center gap-1.5"
              disabled={generating}
            >
              {generating ? 'Processing...' : 'Generate Token'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmitToken} className="space-y-4">
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            Verify and input the student and parent/guardian phone numbers before generating an admission token.
          </p>
          
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Student Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                placeholder="Student mobile number..."
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength="10"
                pattern="[0-9]{10}"
                className="glass-input w-full pl-9 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Parent Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                placeholder="Parent mobile number..."
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength="10"
                pattern="[0-9]{10}"
                className="glass-input w-full pl-9 py-2 text-sm"
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default StudentCard;
