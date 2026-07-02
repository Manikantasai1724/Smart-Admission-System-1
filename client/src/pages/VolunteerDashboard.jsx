import React, { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, Clock, XCircle } from 'lucide-react';
import DashboardLayout from '../components/common/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import StudentCard from '../components/students/StudentCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { getStudents, updateStudentStatus } from '../services/studentService';
import { getStats } from '../services/dashboardService';
import { getGreeting } from '../utils/helpers';
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

      // Always fetch true global stats from dashboard API
      const statsRes = await getStats();
      const globalStats = statsRes.data.stats || statsRes.data;
      
      setStats({ 
        pendingToday: globalStats.pendingStudents, 
        completedToday: globalStats.completedStudents 
      });

      // If no search input is provided, restrict default listing
      if (!search.trim()) {
        setPendingStudents([]);
        setRecentUpdates([]);
        return;
      }

      const params = { limit: 20, status: 'pending', search };
      const res = await getStudents(params);
      const students = res.data.students || res.data.data || [];
      setPendingStudents(students);

      // Fetch recently updated matching search
      const recentRes = await getStudents({ limit: 10, sort: '-updatedAt', search });
      setRecentUpdates(recentRes.data.students || recentRes.data.data || []);
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

      {!searchTerm.trim() ? (
        <div className="glass-card p-12 text-center max-w-2xl mx-auto">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">Search for a Student</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            Enter a student name or hall ticket number in the search bar above to view and manage their status.
          </p>
        </div>
      ) : loading ? (
        <LoadingSpinner message="Searching students..." />
      ) : (
        <div className="space-y-8">
          {/* Pending Students Grid */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Pending Search Results ({pendingStudents.length})
            </h2>
            {pendingStudents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingStudents.map(student => (
                  <StudentCard
                    key={student._id || student.id}
                    student={student}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 text-center">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No pending students found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  We couldn't find any pending student details matching "{searchTerm}"
                </p>
              </div>
            )}
          </div>

          {/* Recent Updates Matching Grid */}
          {recentUpdates.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Recently Updated Matches ({recentUpdates.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentUpdates.map(student => (
                  <StudentCard
                    key={student._id || student.id}
                    student={student}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

export default VolunteerDashboard;
