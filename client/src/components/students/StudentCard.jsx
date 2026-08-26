import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Clock, Phone, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usePhase } from '../../context/PhaseContext';
import { generateStudentToken } from '../../services/studentService';
import Modal from '../common/Modal';
import { calculateCompletionPercentage, formatDate } from '../../utils/helpers';
import { STEP_LABELS, ADMISSION_STEPS } from '../../utils/constants';

function StudentCard({ student, onStatusChange, onTokenGenerated, showActions = true }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { isReadOnly } = usePhase();

  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  const [phone, setPhone] = useState(student.phone || '');
  const [parentPhone, setParentPhone] = useState(student.parentPhone || '');
  const [generating, setGenerating] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [updating, setUpdating] = useState(false);

  const completion = calculateCompletionPercentage(student);
  const currentStep = student.currentStep || 0;

  // Modals handling
  const handleOpenTokenModal = (e) => {
    e.stopPropagation();
    setPhone(student.phone || '');
    setParentPhone(student.parentPhone || '');
    setWhatsappSent(false);
    setIsTokenModalOpen(true);
  };

  const handleOpenConfirmModal = (e) => {
    e.stopPropagation();
    setIsConfirmModalOpen(true);
  };

  const closeModals = () => {
    setIsTokenModalOpen(false);
    setIsConfirmModalOpen(false);
  };

  // Step 1: Token Generation & Form Issuing
  const handleSubmitToken = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanParentPhone = parentPhone.trim().replace(/\D/g, '');
    
    const indianMobileRegex = /^[6-9]\d{9}$/;
    
    if (!cleanPhone || !cleanParentPhone) {
      return addToast('error', 'Both student and parent phone numbers are required');
    }
    if (!indianMobileRegex.test(cleanPhone) || !indianMobileRegex.test(cleanParentPhone)) {
      return addToast('error', 'Please enter valid Indian mobile numbers (10 digits, starts with 6-9)');
    }
    
    try {
      setGenerating(true);
      const res = await generateStudentToken(student._id || student.id, {
        phone: cleanPhone,
        parentPhone: cleanParentPhone,
      });
      
      setWhatsappSent(true);
      addToast('success', 'Token generated & WhatsApp message sent!');
      
      setTimeout(() => {
        if (onTokenGenerated) {
          onTokenGenerated(student._id || student.id, res.data.student);
        } else if (onStatusChange) {
          // If the API didn't increment currentStep for some reason, we do it optimistically here
          const newStep = res.data.student.currentStep > 0 ? res.data.student.currentStep : 1;
          onStatusChange(student._id || student.id, 'currentStep', newStep);
        }
        closeModals();
      }, 1500); // give time to read success message
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to generate token');
    } finally {
      setGenerating(false);
    }
  };

  // Steps 2-5: Generic Next Step Progression
  const handleNextStep = async () => {
    const nextStepNum = currentStep + 1;
    if (nextStepNum > 5) return;
    
    try {
      setUpdating(true);
      // Optimistic update locally
      if (onStatusChange) {
        onStatusChange(student._id || student.id, 'currentStep', nextStepNum);
      }
      addToast('success', `${STEP_LABELS[ADMISSION_STEPS[nextStepNum - 1]]} completed!`);
      closeModals();
    } catch (err) {
      addToast('error', 'Failed to update step status');
      // Revert on error if needed
      if (onStatusChange) {
        onStatusChange(student._id || student.id, 'currentStep', currentStep);
      }
    } finally {
      setUpdating(false);
    }
  };

  const getNextStepLabel = () => {
    if (currentStep >= 5) return "Admission Completed";
    return `Complete Step ${currentStep + 1}: ${STEP_LABELS[ADMISSION_STEPS[currentStep]]}`;
  };

  return (
    <div className="glass-card p-5 card-hover group flex flex-col justify-between min-h-[320px]">
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
                Token #{student.tokenNumber}
              </span>
            )}
          </div>
        </div>

        {/* Rank & Slide Info */}
        <div className="flex justify-between items-center mb-4">
          {student.rank && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Rank: <span className="font-semibold text-gray-600 dark:text-gray-300">{student.rank}</span>
            </p>
          )}
          {student.slideBranch && (
            <p className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200/50">
              Slide Branch: <span className="font-bold">{student.slideBranch}</span>
            </p>
          )}
        </div>

        {/* Status and Steps Indicators */}
        <div className="flex items-center gap-5 mb-6">
          <div className="flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full bg-gray-50 dark:bg-primary-900/10 border-2 border-dashed border-gray-200 dark:border-primary-400/20 shrink-0">
            {completion >= 100 || currentStep >= 5 ? (
              <span className="text-xs font-bold text-emerald-500 text-center leading-tight">Done</span>
            ) : (
              <span className="text-xs font-bold text-amber-500 text-center leading-tight">Pending</span>
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            {ADMISSION_STEPS.map((step, index) => {
              const isCompleted = currentStep > index;
              return (
                <div key={step} className="flex items-center justify-between">
                  <span className={`text-xs ${isCompleted ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    {STEP_LABELS[step]}
                  </span>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        {/* Primary Sequential Action Button */}
        {showActions && user?.role?.toLowerCase() === 'volunteer' && currentStep < 5 && !isReadOnly && (
          <button
            onClick={currentStep === 0 ? handleOpenTokenModal : handleOpenConfirmModal}
            className="w-full py-2.5 rounded-xl text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/25 transition-all duration-200"
          >
            {getNextStepLabel()}
          </button>
        )}
        
        {currentStep >= 5 && (
          <div className="w-full py-2.5 rounded-xl text-sm font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-center">
            Fully Admitted ✓
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-primary-400/10">
          <div className="flex flex-col gap-0.5 text-[10px] text-gray-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {student.updatedAt ? formatDate(student.updatedAt) : 'Not updated'}
            </div>
          </div>
          <button
            onClick={() => navigate(`/students/${student._id || student.id}`)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
          >
            <Eye className="w-3.5 h-3.5" />
            Details
          </button>
        </div>
      </div>

      {/* Step 1: Token & Form Issuing Modal */}
      <Modal
        isOpen={isTokenModalOpen}
        onClose={closeModals}
        title={`Verify Contact & Generate Token`}
        size="sm"
        footer={
          <>
            <button
              onClick={closeModals}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              disabled={generating || whatsappSent}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitToken}
              className={`px-4 py-2 rounded-xl text-sm font-medium text-white shadow-md transition-colors flex items-center gap-1.5 ${whatsappSent ? 'bg-emerald-500' : 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/25'}`}
              disabled={generating || whatsappSent}
            >
              {generating ? 'Processing...' : whatsappSent ? 'Success!' : 'Create Token & Complete Step 1'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmitToken} className="space-y-4">
          {whatsappSent ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="font-semibold text-sm mb-1">WhatsApp message sent!</p>
              <p className="text-xs">Token generated and Step 1 completed.</p>
            </div>
          ) : (
            <>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                To complete Step 1 (Form Issuing), please verify the Indian mobile numbers (10 digits starting with 6-9). A token will be generated.
              </p>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Student Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength="10"
                    pattern="^[6-9]\d{9}$"
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
                    placeholder="e.g. 9876543210"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength="10"
                    pattern="^[6-9]\d{9}$"
                    className="glass-input w-full pl-9 py-2 text-sm"
                    required
                  />
                </div>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Steps 2-5: Generic Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={closeModals}
        title={`Confirm Step Completion`}
        size="sm"
        footer={
          <>
            <button
              onClick={closeModals}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              disabled={updating}
            >
              Cancel
            </button>
            <button
              onClick={handleNextStep}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/25 transition-colors flex items-center gap-1.5"
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Yes, Complete Step'}
            </button>
          </>
        }
      >
        <div className="text-center py-2">
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Are you sure you want to mark <strong>{STEP_LABELS[ADMISSION_STEPS[currentStep]]}</strong> as completed for {student.name}?
          </p>
        </div>
      </Modal>

    </div>
  );
}

export default memo(StudentCard);
