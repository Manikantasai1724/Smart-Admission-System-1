import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Loader,
  User,
  Phone,
  Mail,
  Hash,
  Award,
  Building,
} from "lucide-react";
import DashboardLayout from "../components/common/DashboardLayout";
import StudentTimeline from "../components/students/StudentTimeline";
import StatusToggle from "../components/students/StatusToggle";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getStudentById,
  updateStudentStatus,
} from "../services/studentService";
import { getLogs } from "../services/logService";
import {
  formatDate,
  calculateCompletionPercentage,
  getStatusLabel,
} from "../utils/helpers";
import { STEP_LABELS, ADMISSION_STEPS } from "../utils/constants";

function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [statusChanges, setStatusChanges] = useState({});
  const [auditHistory, setAuditHistory] = useState([]);

  const fetchStudent = useCallback(async () => {
    try {
      setLoading(true);
      const [studentRes, logsRes] = await Promise.all([
        getStudentById(id),
        getLogs({ student: id, limit: 20 }).catch(() => ({
          data: { logs: [] },
        })),
      ]);
      const studentData = studentRes.data.student || studentRes.data;
      setStudent(studentData);
      setRemarks(studentData.remarks || "");
      setStatusChanges({
        selfReported: !!studentData.selfReported,
        documentsSubmitted: !!studentData.documentsSubmitted,
        formFilled: !!studentData.formFilled,
      });
      setAuditHistory(logsRes.data.logs || logsRes.data || []);
    } catch (error) {
      console.error("Error fetching student:", error);
      addToast("error", "Failed to load student details");
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStudentStatus(id, {
        ...statusChanges,
        remarks,
      });
      addToast("success", "Student status updated successfully");
      fetchStudent();
    } catch (error) {
      addToast("error", "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field, value) => {
    setStatusChanges((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner message="Loading student details..." />
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="glass-card p-12 text-center">
          <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">
            Student not found
          </p>
          <button
            onClick={() => navigate("/students")}
            className="mt-4 glass-button"
          >
            Back to Students
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const completion = calculateCompletionPercentage({
    selfReported: statusChanges.selfReported,
    documentsSubmitted: statusChanges.documentsSubmitted,
    formFilled: statusChanges.formFilled,
  });

  return (
    <DashboardLayout>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6">
            {/* Avatar & Name */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-xl shadow-primary-500/25 mb-4">
                {student.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {student.name}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="inline-flex px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {student.department}
                </span>
                {student.tokenNumber && (
                  <span className="inline-flex px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-sm font-bold text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/30 shadow-sm">
                    Token #{student.tokenNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div className="space-y-3">
              <InfoRow
                icon={Hash}
                label="Hall Ticket"
                value={student.hallTicket || student.hallTicketNumber}
              />
              <InfoRow icon={Award} label="Rank" value={student.rank} />
              <InfoRow
                icon={Building}
                label="Department"
                value={student.department}
              />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={student.phone}
              />
              <InfoRow icon={Mail} label="Email" value={student.email} />
              <InfoRow
                icon={User}
                label="Parent Name"
                value={student.parentName}
              />
              <InfoRow
                icon={Phone}
                label="Parent Phone"
                value={student.parentPhone}
              />
              {student.tokenNumber && (
                <InfoRow
                  icon={Hash}
                  label="Token Number"
                  value={`#${student.tokenNumber}`}
                />
              )}
              <InfoRow
                icon={Building}
                label="Address"
                value={student.address}
              />
            </div>

            {/* Completion Status */}
            <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-primary-400/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status
                </span>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                  completion >= 100 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {completion >= 100 ? 'Completed' : 'Pending'}
                </span>
              </div>
              {completion >= 100 && student.completedAt && (
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-right">
                  Marked as read on: <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(student.completedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <StudentTimeline student={{ ...student, ...statusChanges }} />

          {/* Status Update Section */}
          {user?.role?.toLowerCase() === 'volunteer' && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Update Status
              </h3>
              <div className="space-y-4">
                {ADMISSION_STEPS.map((step) => (
                  <div
                    key={step}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-white/[0.02]"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {STEP_LABELS[step]}
                    </span>
                    <StatusToggle
                      checked={statusChanges[step]}
                      onChange={(val) => handleToggle(step, val)}
                      label={statusChanges[step] ? "Done" : "Pending"}
                    />
                  </div>
                ))}

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Remarks
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    placeholder="Add any notes or remarks..."
                    className="glass-input w-full resize-none"
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="glass-button w-full flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Audit History */}
          {auditHistory.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Change History
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {auditHistory.map((log, index) => (
                  <div
                    key={log._id || index}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">
                          {log.user?.name || log.userName || "System"}
                        </span>{" "}
                        {log.action || "updated status"}
                        {log.field && (
                          <span className="text-primary-600 dark:text-primary-400">
                            {" "}
                            ({log.field})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(log.createdAt || log.timestamp)}
                      </p>
                    </div>
                    {log.newValue !== undefined && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          log.newValue
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {String(log.newValue)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">
        {label}
      </span>
      <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
        {value}
      </span>
    </div>
  );
}

export default StudentDetailPage;
