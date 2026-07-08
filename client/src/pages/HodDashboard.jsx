import React, { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle, Clock, Download, FileSpreadsheet, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '../components/common/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { getStats, getDepartmentProgress } from '../services/dashboardService';
import studentService from '../services/studentService';
import * as settingsService from '../services/settingsService';
import { getGreeting, exportToExcel, exportToPDF, formatDate } from '../utils/helpers';
import { DEPARTMENTS } from '../utils/constants';
import StudentTable from '../components/students/StudentTable';

function HodDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { addToast } = useToast();

  const [stats, setStats] = useState(null);
  const [departmentData, setDepartmentData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [counselingDays, setCounselingDays] = useState(3);

  // Student list states
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'completed', 'all'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingsService.getSettings();
        if (res.data?.settings?.counselingDurationDays) {
          setCounselingDays(Number(res.data.settings.counselingDurationDays));
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    fetchSettings();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDepartment) params.department = selectedDepartment;
      if (selectedDay) params.phase = selectedDay;

      const [statsRes, deptRes] = await Promise.all([
        getStats(params),
        getDepartmentProgress(selectedDay ? { phase: selectedDay } : {}),
      ]);
      setStats(statsRes.data.stats || statsRes.data);
      const allDepts = deptRes.data.departments || deptRes.data || [];
      const validDepts = allDepts.filter(d => DEPARTMENTS.includes(d.department || d.name || ''));
      setDepartmentData(validDepts);
      if (statsRes.data.recentActivity) {
        setActivities(statsRes.data.recentActivity);
      } else if (statsRes.data.recentActivities) {
        setActivities(statsRes.data.recentActivities);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addToast('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [addToast, selectedDepartment, selectedDay]);

  const fetchStudentsList = useCallback(async () => {
    try {
      setStudentsLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        status: activeTab === 'all' ? undefined : activeTab,
      };
      if (selectedDepartment) params.department = selectedDepartment;
      if (selectedDay) params.phase = selectedDay;

      const res = await studentService.getStudents(params);
      setStudents(res.data.students || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching students list:', error);
    } finally {
      setStudentsLoading(false);
    }
  }, [selectedDepartment, selectedDay, activeTab, currentPage]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchStudentsList();
  }, [fetchStudentsList]);

  // Reset page to 1 on filter/tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDepartment, selectedDay, activeTab]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Socket.IO listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleStudentUpdated = () => {
      fetchDashboardData();
      fetchStudentsList();
    };

    const handleNewActivity = (activity) => {
      setActivities(prev => [activity, ...prev].slice(0, 20));
    };

    socket.on('student:updated', handleStudentUpdated);
    socket.on('activity:new', handleNewActivity);

    return () => {
      socket.off('student:updated', handleStudentUpdated);
      socket.off('activity:new', handleNewActivity);
    };
  }, [socket, fetchDashboardData, fetchStudentsList]);

  const totalStudents = stats?.total || stats?.totalStudents || 0;
  const completed = stats?.completed || stats?.completedStudents || 0;
  const pending = stats?.pending || stats?.pendingStudents || totalStudents - completed;
  const completionRate = totalStudents > 0 ? Math.round((completed / totalStudents) * 100) : 0;

  const pieData = [
    { name: 'Completed', value: completed },
    { name: 'Pending', value: pending > 0 ? pending : 0 },
  ].filter(d => d.value > 0);

  const completedToday = stats?.todayCount || 0;
  const todayPieData = [
    { name: 'Completed Today', value: completedToday },
    { name: 'Pending', value: pending > 0 ? pending : 0 },
  ].filter(d => d.value > 0);

  const filteredDeptData = selectedDepartment
    ? departmentData.filter(d => d.department === selectedDepartment || d.name === selectedDepartment)
    : departmentData;

  const handleExportExcel = async () => {
    try {
      addToast('info', 'Preparing Excel export...');
      const params = {};
      if (selectedDepartment) params.department = selectedDepartment;
      if (selectedDay) params.phase = selectedDay;
      const res = await studentService.exportStudents(params);
      const students = res.data.students || [];

      if (students.length === 0) {
        return addToast('error', 'No students found to export');
      }

      // Group students by status (Completed first, then Pending)
      const sortedStudents = [...students].sort((a, b) => {
        const aComp = a.selfReported && a.documentsSubmitted && a.formFilled;
        const bComp = b.selfReported && b.documentsSubmitted && b.formFilled;
        if (aComp === bComp) return 0;
        return aComp ? -1 : 1;
      });

      const data = sortedStudents.map(student => {
        const isCompleted = student.selfReported && student.documentsSubmitted && student.formFilled;
        return {
          'Hall Ticket Number': student.hallTicketNumber || '—',
          'Name': student.name || '—',
          'Email': student.email || '—',
          'Phone': student.phone || '—',
          'Parent Phone': student.parentPhone || '—',
          'Department': student.department || '—',
          'Rank': student.rank || '—',
          'Self Reported': student.selfReported ? 'Yes' : 'No',
          'Documents Submitted': student.documentsSubmitted ? 'Yes' : 'No',
          'Form Filled': student.formFilled ? 'Yes' : 'No',
          'Status': isCompleted ? 'Completed' : 'Pending',
          'Completion Date & Time': isCompleted && student.completedAt ? formatDate(student.completedAt) : '—',
        };
      });

      exportToExcel(data, 'students-admission-report');
      addToast('success', 'Excel report downloaded successfully');
    } catch (error) {
      console.error('Export error:', error);
      addToast('error', 'Failed to export students data');
    }
  };

  const handleExportPDF = async () => {
    try {
      addToast('info', 'Preparing PDF export...');
      const params = {};
      if (selectedDepartment) params.department = selectedDepartment;
      if (selectedDay) params.phase = selectedDay;
      const res = await studentService.exportStudents(params);
      const students = res.data.students || [];

      if (students.length === 0) {
        return addToast('error', 'No students found to export');
      }

      // Group students by status (Completed first, then Pending)
      const sortedStudents = [...students].sort((a, b) => {
        const aComp = a.selfReported && a.documentsSubmitted && a.formFilled;
        const bComp = b.selfReported && b.documentsSubmitted && b.formFilled;
        if (aComp === bComp) return 0;
        return aComp ? -1 : 1;
      });

      const data = sortedStudents.map(student => {
        const isCompleted = student.selfReported && student.documentsSubmitted && student.formFilled;
        return {
          'Hall Ticket Number': student.hallTicketNumber || '—',
          'Name': student.name || '—',
          'Email': student.email || '—',
          'Phone': student.phone || '—',
          'Parent Phone': student.parentPhone || '—',
          'Department': student.department || '—',
          'Rank': student.rank || '—',
          'Status': isCompleted ? 'Completed' : 'Pending',
        };
      });

      const columns = [
        { key: 'Hall Ticket Number', header: 'Hall Ticket' },
        { key: 'Name', header: 'Name' },
        { key: 'Email', header: 'Email' },
        { key: 'Phone', header: 'Phone' },
        { key: 'Parent Phone', header: 'Parent Phone' },
        { key: 'Department', header: 'Dept' },
        { key: 'Rank', header: 'Rank' },
        { key: 'Status', header: 'Status' },
      ];

      exportToPDF(data, columns, 'Students Admission Report');
      addToast('success', 'PDF report downloaded successfully');
    } catch (error) {
      console.error('Export error:', error);
      addToast('error', 'Failed to export students data');
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, <span className="gradient-text">{user?.name || 'Admin'}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here&apos;s your admission overview for today
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export Buttons */}
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Dashboard Filters Bar */}
      <div className="glass-card p-4 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold text-xs uppercase tracking-wider">
          <svg className="w-4 h-4 text-primary-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V17a1 1 0 01-.293.707l-2 2A1 1 0 018 19v-7.586L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          Dashboard Filters
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4">
          {/* Branch Filter Button Group */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-primary-950/20 p-1 rounded-xl border border-gray-200/40 dark:border-primary-400/5">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2">Branch</span>
            {['ALL', 'CSE', 'AIML', 'CIC'].map((branch) => {
              const isActive = (branch === 'ALL' && selectedDepartment === '') || (selectedDepartment === branch);
              return (
                <button
                  key={branch}
                  onClick={() => setSelectedDepartment(branch === 'ALL' ? '' : branch)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25 scale-[1.02]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {branch}
                </button>
              );
            })}
          </div>

          {/* Counseling Day Filter Button Group */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-primary-950/20 p-1 rounded-xl border border-gray-200/40 dark:border-primary-400/5">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2">Counseling</span>
            {(() => {
              const dayFilters = ['ALL DAYS'];
              for (let i = 1; i <= counselingDays; i++) {
                dayFilters.push(`DAY ${i}`);
              }
              return dayFilters.map((day) => {
                const val = day === 'ALL DAYS' ? '' : day.replace('DAY ', '');
                const isActive = selectedDay === val;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25 scale-[1.02]'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonLoader key={i} variant="stat-card" />
            ))}
          </div>
          <SkeletonLoader variant="card" className="h-96" />
        </div>
      ) : (
        <div className="space-y-6 stagger-children">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Students"
              value={totalStudents}
              icon={Users}
              color="primary"
              delay={0}
            />
            <StatCard
              title="Pending"
              value={pending}
              icon={Clock}
              color="warning"
              delay={100}
            />
            <StatCard
              title="Completed"
              value={completed}
              icon={CheckCircle}
              color="success"
              delay={200}
            />
          </div>

          {/* All / Pending / Completed Tabs Selector */}
          <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-primary-400/10 pb-1">
            <div className="flex gap-6">
              {[
                { id: 'all', name: 'All Students', count: totalStudents },
                { id: 'pending', name: 'Pending', count: pending },
                { id: 'completed', name: 'Completed', count: completed }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative pb-3 text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 px-1 ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-400 font-bold'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <span>{tab.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : 'bg-gray-100 dark:bg-primary-950 text-gray-500 dark:text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full animate-fade-in" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Students Table */}
          <StudentTable
            students={students}
            loading={studentsLoading}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 ${
                          currentPage === page
                            ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

export default HodDashboard;
