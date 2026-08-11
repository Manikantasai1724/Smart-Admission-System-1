import React, { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, Clock, XCircle, User, Ticket } from 'lucide-react';
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
  const [searchType, setSearchType] = useState('text'); // 'text' or 'token'
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [stats, setStats] = useState({ pendingToday: 0, completedToday: 0 });

  const debouncedSearch = useDebounce(searchTerm, 800);

  // Clear search term when search type changes
  useEffect(() => {
    setSearchTerm('');
  }, [searchType]);

  const fetchStats = useCallback(async (signal) => {
    try {
      const statsRes = await getStats({}, { signal });
      const globalStats = statsRes.data.stats || statsRes.data;
      setStats({ 
        pendingToday: globalStats.pendingToday !== undefined ? globalStats.pendingToday : globalStats.pendingStudents, 
        completedToday: globalStats.completedToday !== undefined ? globalStats.completedToday : globalStats.completedStudents 
      });
    } catch (error) {
      if (error?.name !== 'CanceledError' && error?.name !== 'AbortError') {
        console.error('Error fetching stats:', error);
      }
    }
  }, []);

  const fetchStudents = useCallback(async (search = '', showLoader = true, signal) => {
    try {
      if (showLoader) setLoading(true);

      // If no search input is provided, restrict default listing
      if (!search.trim()) {
        setStudents([]);
        return;
      }

      const params = { limit: 20 };
      if (user?.department && user.department !== 'ALL') {
        params.department = user.department;
      }

      if (searchType === 'token') {
        const cleanedToken = search.trim().replace(/^#/, '').replace(/\D/g, '');
        params.tokenNumber = cleanedToken || search.trim();
      } else {
        params.search = search;
      }

      const res = await getStudents(params, { signal });
      const results = res.data.students || res.data.data || [];
      setStudents(results);
    } catch (error) {
      if (error?.name !== 'CanceledError' && error?.name !== 'AbortError') {
        console.error('Error fetching students:', error);
        addToast('error', 'Failed to load student data');
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [addToast, searchType, user?.department]);

  useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal);
    fetchStudents(debouncedSearch, true, controller.signal);
    return () => controller.abort();
  }, [debouncedSearch, fetchStudents, fetchStats]);

  // Socket.IO for live updates with 500ms debounce
  useEffect(() => {
    if (!socket) return;

    let timer = null;
    const handleUpdate = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fetchStats();
        fetchStudents(debouncedSearch, false);
      }, 500);
    };

    socket.on('student:updated', handleUpdate);
    return () => {
      if (timer) clearTimeout(timer);
      socket.off('student:updated', handleUpdate);
    };
  }, [socket, debouncedSearch, fetchStudents]);

  const handleStatusChange = async (studentId, field, value) => {
    setUpdatingId(studentId);
    try {
      await updateStudentStatus(studentId, { [field]: value });

      // Update local state
      setStudents(prev =>
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

  const handleTokenGenerated = (studentId, updatedStudent) => {
    setStudents(prev =>
      prev.map(s =>
        (s._id === studentId || s.id === studentId) ? { ...s, ...updatedStudent } : s
      )
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

      {/* Prominent Search Bar & Filter Toggle Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 max-w-2xl mx-auto mb-8">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            placeholder={searchType === 'token' ? "Search by Token number (e.g. 5)..." : "Search by name or hall ticket number..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/80 dark:bg-primary-950/50 backdrop-blur-xl border-2 border-gray-200/60 dark:border-primary-400/15 rounded-2xl pl-14 pr-6 py-4 text-lg outline-none transition-all duration-300 focus:border-primary-400 focus:ring-4 focus:ring-primary-400/10 dark:focus:ring-primary-400/20 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-lg shadow-black/5"
          />
        </div>
        
        {/* Toggle Buttons styled like outline 'Filters' button */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setSearchType('text')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
              searchType === 'text'
                ? 'bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'bg-white dark:bg-primary-950/20 border-gray-300 dark:border-primary-400/15 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            <User className="w-4.5 h-4.5" />
            General Info
          </button>
          <button
            onClick={() => setSearchType('token')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
              searchType === 'token'
                ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'bg-white dark:bg-primary-950/20 border-gray-300 dark:border-primary-400/15 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            <Ticket className="w-4.5 h-4.5" />
            Token Number
          </button>
        </div>
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
            {searchType === 'token'
              ? 'Enter a token number in the search bar above to view and manage status.'
              : 'Enter a student name or hall ticket number in the search bar above to view and manage status.'}
          </p>
        </div>
      ) : loading ? (
        <LoadingSpinner message="Searching students..." />
      ) : (
        <div className="space-y-8">
          {/* Search Results Grid */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary-500" />
              Search Results ({students.length})
            </h2>
            {students.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map(student => (
                  <StudentCard
                    key={student._id || student.id}
                    student={student}
                    onStatusChange={handleStatusChange}
                    onTokenGenerated={handleTokenGenerated}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 text-center">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No students found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  We couldn't find any student details matching "{searchTerm}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default VolunteerDashboard;
