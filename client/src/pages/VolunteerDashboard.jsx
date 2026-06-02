import React, { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, Clock, UserCheck, FileText, FilePlus } from 'lucide-react';
import DashboardLayout from '../components/common/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import StatusToggle from '../components/students/StatusToggle';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { getStudents, updateStudentStatus } from '../services/studentService';
import { getStats } from '../services/dashboardService';
import { getGreeting, calculateCompletionPercentage, timeAgo } from '../utils/helpers';
import { STEP_LABELS } from '../utils/constants';

function VolunteerDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [pendingStudents, setPendingStudents] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [stats, setStats] = useState({ pendingToday: 0, completedToday: 0 });

  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchStudents = useCallback(async (search = '') => {
    try {
      setLoading(true);
      const params = { limit: 20, status: 'pending' };
      if (search) params.search = search;
      const res = await getStudents(params);
      const students = res.data.students || res.data.data || [];
      setPendingStudents(students);

      // Fetch recently updated
      const recentRes = await getStudents({ limit: 10, sort: '-updatedAt' });
      setRecentUpdates(recentRes.data.students || recentRes.data.data || []);

      // Fetch true global stats from dashboard API
      const statsRes = await getStats();
      const globalStats = statsRes.data.stats || statsRes.data;
      
      setStats({ 
        pendingToday: globalStats.pendingStudents, 
        completedToday: globalStats.completedStudents 
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      addToast('error', 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchStudents(debouncedSearch);
  }, [debouncedSearch, fetchStudents]);

  // Socket.IO for live updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchStudents(debouncedSearch);
    };

    socket.on('student:updated', handleUpdate);
    return () => socket.off('student:updated', handleUpdate);
  }, [socket, debouncedSearch, fetchStudents]);

  const handleStatusChange = async (studentId, field, value) => {
    setUpdatingId(studentId);
    try {
      await updateStudentStatus(studentId, { [field]: value });
      addToast('success', `${STEP_LABELS[field]} ${value ? 'completed' : 'reverted'}`);

      // Update local state
      setPendingStudents(prev =>
        prev.map(s =>
          (s._id === studentId || s.id === studentId) ? { ...s, [field]: value } : s
        )
      );
      setRecentUpdates(prev =>
        prev.map(s =>
          (s._id === studentId || s.id === studentId) ? { ...s, [field]: value } : s
        )
      );
    } catch (error) {
      addToast('error', 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const StudentRow = ({ student, showUpdatedAt = false }) => {
    const completion = calculateCompletionPercentage(student);
    const sid = student._id || student.id;

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl hover:bg-white/40 dark:hover:bg-white/[0.02] transition-all duration-200 group">
        {/* Student Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md shadow-primary-500/20">
            {student.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
              {student.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-mono">{student.hallTicket || student.hallTicketNumber}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold">
                {student.department}
              </span>
            </div>
          </div>
        </div>

        {/* Toggle Switches */}
        <div className="flex items-center gap-4 sm:gap-6 ml-13 sm:ml-0">
          <div className="flex flex-col items-center gap-1">
            <StatusToggle
              checked={!!student.selfReported}
              onChange={(val) => handleStatusChange(sid, 'selfReported', val)}
              disabled={updatingId === sid}
            />
            <span className="text-[10px] text-gray-400 whitespace-nowrap">Self Report</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <StatusToggle
              checked={!!student.documentsSubmitted}
              onChange={(val) => handleStatusChange(sid, 'documentsSubmitted', val)}
              disabled={updatingId === sid}
            />
            <span className="text-[10px] text-gray-400 whitespace-nowrap">Documents</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <StatusToggle
              checked={!!student.formFilled}
              onChange={(val) => handleStatusChange(sid, 'formFilled', val)}
              disabled={updatingId === sid}
            />
            <span className="text-[10px] text-gray-400 whitespace-nowrap">Form</span>
          </div>
        </div>

        {/* Completion */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completion >= 100 ? 'bg-emerald-500' : completion > 0 ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              style={{ width: `${completion}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-500 w-8">{completion}%</span>
        </div>

        {showUpdatedAt && student.updatedAt && (
          <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(student.updatedAt)}</span>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          {getGreeting()}, <span className="gradient-text">{user?.name || 'Volunteer'}</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Track and update student admission progress
        </p>
      </div>

      {/* Prominent Search Bar */}
      <div className="relative max-w-2xl mx-auto mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
        <input
          type="text"
          placeholder="Search students by name or hall ticket number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/80 dark:bg-primary-950/50 backdrop-blur-xl border-2 border-gray-200/60 dark:border-primary-400/15 rounded-2xl pl-14 pr-6 py-4 text-lg outline-none transition-all duration-300 focus:border-primary-400 focus:ring-4 focus:ring-primary-400/10 dark:focus:ring-primary-400/20 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-lg shadow-black/5"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard
          title="Pending Today"
          value={stats.pendingToday}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Completed Today"
          value={stats.completedToday}
          icon={CheckCircle}
          color="success"
        />
      </div>

      {loading ? (
        <LoadingSpinner message="Loading students..." />
      ) : (
        <div className="space-y-6">
          {/* Pending Students */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/50 dark:border-primary-400/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Pending Students
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-xs font-semibold text-amber-700 dark:text-amber-400">
                {pendingStudents.filter(s => calculateCompletionPercentage(s) < 100).length} remaining
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-primary-400/5">
              {pendingStudents.filter(s => calculateCompletionPercentage(s) < 100).length > 0 ? (
                pendingStudents
                  .filter(s => calculateCompletionPercentage(s) < 100)
                  .map(student => (
                    <StudentRow key={student._id || student.id} student={student} />
                  ))
              ) : (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">All caught up!</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">No pending students found</p>
                </div>
              )}
            </div>
          </div>

          {/* Recently Updated */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/50 dark:border-primary-400/10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Recently Updated
              </h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-primary-400/5">
              {recentUpdates.length > 0 ? (
                recentUpdates.slice(0, 5).map(student => (
                  <StudentRow key={student._id || student.id} student={student} showUpdatedAt />
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                  <p className="text-sm">No recent updates</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default VolunteerDashboard;
