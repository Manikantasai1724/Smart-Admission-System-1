import React, { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle, Clock, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import DashboardLayout from '../components/common/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import TrendChart from '../components/dashboard/TrendChart';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { getStats, getDepartmentProgress } from '../services/dashboardService';
import studentService from '../services/studentService';
import { getGreeting, exportToExcel, exportToPDF, formatDate } from '../utils/helpers';
import { DEPARTMENTS } from '../utils/constants';

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass dark:glass-dark rounded-xl p-3 shadow-xl border border-white/20 dark:border-primary-400/10">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {payload[0].name}: {payload[0].value}
      </p>
    </div>
  );
};

function HodDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { addToast } = useToast();

  const [stats, setStats] = useState(null);
  const [departmentData, setDepartmentData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const params = selectedDepartment ? { department: selectedDepartment } : {};
      const [statsRes, deptRes] = await Promise.all([
        getStats(params),
        getDepartmentProgress(),
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
  }, [addToast, selectedDepartment]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Socket.IO listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleStudentUpdated = () => {
      fetchDashboardData();
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
  }, [socket, fetchDashboardData]);

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
      const params = selectedDepartment ? { department: selectedDepartment } : {};
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
      const params = selectedDepartment ? { department: selectedDepartment } : {};
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
          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="glass-input text-sm py-2"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
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

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonLoader key={i} variant="stat-card" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <SkeletonLoader variant="card" className="lg:col-span-3 h-96" />
            <SkeletonLoader variant="card" className="lg:col-span-2 h-96" />
          </div>
        </div>
      ) : (
        <div className="space-y-6 stagger-children">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              title="Total Students"
              value={totalStudents}
              icon={Users}
              color="primary"
              delay={0}
            />
            <StatCard
              title="Completed"
              value={completed}
              icon={CheckCircle}
              color="success"
              delay={100}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Completion Chart */}
            <div className="glass-card p-6 flex flex-col justify-between min-h-[360px]">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Overall Progress
              </h3>
              <div className="flex-1 flex flex-col items-center justify-center">
                {pieData.length > 0 ? (
                  <div className="w-full h-44 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.name === 'Completed' ? '#10b981' : '#f59e0b'} 
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-extrabold text-gray-800 dark:text-white">{completionRate}%</span>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">Done</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No data available</p>
                )}
                
                <div className="mt-4 space-y-2 w-full px-4">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                      <span className="text-gray-500 dark:text-gray-400">Completed</span>
                    </div>
                    <span className="text-gray-800 dark:text-gray-200">{completed} ({totalStudents > 0 ? Math.round((completed / totalStudents) * 100) : 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                      <span className="text-gray-500 dark:text-gray-400">Pending</span>
                    </div>
                    <span className="text-gray-800 dark:text-gray-200">{pending > 0 ? pending : 0} ({totalStudents > 0 ? Math.round((pending / totalStudents) * 100) : 0}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Progress Chart */}
            <div className="glass-card p-6 flex flex-col justify-between min-h-[360px]">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Today's Activity
              </h3>
              <div className="flex-1 flex flex-col items-center justify-center">
                {todayPieData.length > 0 ? (
                  <div className="w-full h-44 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={todayPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {todayPieData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.name.startsWith('Completed') ? '#10b981' : '#f59e0b'} 
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-extrabold text-gray-800 dark:text-white">
                        {completedToday}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">Today</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No data completed today</p>
                )}
                
                <div className="mt-4 space-y-2 w-full px-4">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                      <span className="text-gray-500 dark:text-gray-400">Completed Today</span>
                    </div>
                    <span className="text-gray-800 dark:text-gray-200">{completedToday}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                      <span className="text-gray-500 dark:text-gray-400">Remaining Pending</span>
                    </div>
                    <span className="text-gray-800 dark:text-gray-200">{pending > 0 ? pending : 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      )}
    </DashboardLayout>
  );
}

export default HodDashboard;
