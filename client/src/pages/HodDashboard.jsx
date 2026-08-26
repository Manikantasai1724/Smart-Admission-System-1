import React, { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle, Clock, Download, FileSpreadsheet, FileText } from 'lucide-react';
import DashboardLayout from '../components/common/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { usePhase } from '../context/PhaseContext';
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
  const { phase } = usePhase();

  const [stats, setStats] = useState(null);
  const [departmentData, setDepartmentData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  
  // Phase 1 Settings
  const [phase1Days, setPhase1Days] = useState(3);
  const [phase1StartDate, setPhase1StartDate] = useState(null);
  
  // Phase 2 Settings
  const [phase2Days, setPhase2Days] = useState(3);
  const [phase2StartDate, setPhase2StartDate] = useState(null);

  // Student list states
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('visited'); // 'pending', 'completed', 'visited'

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const res = await settingsService.getSettings();
        if (isMounted) {
          const settings = res.data?.settings || {};
          
          if (settings.counselingDurationDays) setPhase1Days(Number(settings.counselingDurationDays));
          if (settings.counselingStartDate) setPhase1StartDate(settings.counselingStartDate);
          
          if (settings.phase2DurationDays) setPhase2Days(Number(settings.phase2DurationDays));
          if (settings.phase2StartDate) setPhase2StartDate(settings.phase2StartDate);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    fetchSettings();
    return () => { isMounted = false; };
  }, []);

  const getGeneratedTabs = useCallback(() => {
    const tabs = [];
    const createTabsForPhase = (startDateStr, daysCount, labelPrefix) => {
      let baseDate;
      if (startDateStr) {
        const dateStr = String(startDateStr).split('T')[0];
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          baseDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          baseDate = new Date(startDateStr);
        }
      } else {
        baseDate = new Date();
      }

      for (let i = 1; i <= daysCount; i++) {
        const targetDate = new Date(baseDate);
        targetDate.setDate(baseDate.getDate() + (i - 1));
        
        const monthStr = targetDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const dayStr = String(targetDate.getDate()).padStart(2, '0');
        const exactDateStr = targetDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
        
        tabs.push({
          id: exactDateStr,
          label: `${labelPrefix} ${i}`,
          displayDate: `${monthStr}-${dayStr}`
        });
      }
    };

    if (phase === '1' || phase === 'all') {
      createTabsForPhase(phase1StartDate, phase1Days, phase === 'all' ? 'P1 Day' : 'Day');
    }
    if (phase === '2' || phase === 'all') {
      createTabsForPhase(phase2StartDate, phase2Days, phase === 'all' ? 'P2 Day' : 'Day');
    }

    return tabs;
  }, [phase, phase1StartDate, phase1Days, phase2StartDate, phase2Days]);

  const generatedTabs = getGeneratedTabs();

  // Reset selectedDay when phase changes or tabs update
  useEffect(() => {
    if (generatedTabs.length > 0) {
      // Check if current selectedDay is still valid in the new tabs
      const isValid = generatedTabs.some(t => t.id === selectedDay);
      if (!isValid) {
        setSelectedDay('');
      }
    } else {
      setSelectedDay('');
    }
  }, [generatedTabs, selectedDay]);

  const fetchDashboardData = useCallback(async (signal) => {
    try {
      if (!stats) setLoading(true);
      const params = {};
      if (selectedDepartment) params.department = selectedDepartment;
      if (selectedDay) params.date = selectedDay;

      const [statsRes, deptRes] = await Promise.all([
        getStats(params, { signal }),
        getDepartmentProgress(selectedDay ? { date: selectedDay } : {}, { signal }),
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
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        console.error('Error fetching dashboard data:', error);
        addToast('error', 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  }, [addToast, selectedDepartment, selectedDay, phase]);

  const fetchStudentsList = useCallback(async (signal) => {
    try {
      setStudentsLoading(true);
      const params = {
        page: 1,
        limit: 5000,
        status: activeTab,
      };
      if (selectedDepartment) params.department = selectedDepartment;
      if (selectedDay) params.date = selectedDay;

      const res = await studentService.getStudents(params, { signal });
      setStudents(res.data.students || []);
    } catch (error) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        console.error('Error fetching students list:', error);
      }
    } finally {
      setStudentsLoading(false);
    }
  }, [selectedDepartment, selectedDay, activeTab, phase]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboardData(controller.signal);
    return () => controller.abort();
  }, [fetchDashboardData]);

  useEffect(() => {
    const controller = new AbortController();
    fetchStudentsList(controller.signal);
    return () => controller.abort();
  }, [fetchStudentsList]);

  const handleDepartmentChange = (dept) => {
    setSelectedDepartment(dept);
  };

  const handleDayChange = (day) => {
    setSelectedDay(day);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Socket.IO listeners for real-time updates with 500ms debounce
  useEffect(() => {
    if (!socket) return;

    let timer = null;
    const handleStudentUpdated = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fetchDashboardData();
        fetchStudentsList();
      }, 500);
    };

    const handleNewActivity = (activity) => {
      setActivities(prev => [activity, ...prev].slice(0, 20));
    };

    socket.on('student:updated', handleStudentUpdated);
    socket.on('activity:new', handleNewActivity);

    return () => {
      if (timer) clearTimeout(timer);
      socket.off('student:updated', handleStudentUpdated);
      socket.off('activity:new', handleNewActivity);
    };
  }, [socket, fetchDashboardData, fetchStudentsList]);

  const overallTotal = stats?.overallTotal ?? 0;
  const overallCompleted = stats?.overallCompleted ?? 0;
  const leftStudents = Math.max(0, overallTotal - overallCompleted);
  const totalStudents = stats?.total ?? stats?.totalStudents ?? 0;
  const completed = selectedDay 
    ? (stats?.completedToday ?? 0)
    : (stats?.completed ?? stats?.completedStudents ?? 0);
  
  const pending = selectedDay
    ? (stats?.pendingToday ?? 0)
    : (stats?.pending ?? stats?.pendingStudents ?? 0);
  const visited = pending + completed;
  const completionRate = overallTotal > 0 ? Math.round((completed / overallTotal) * 100) : 0;

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

  const getExportFilename = (baseName) => {
    let name = baseName;
    if (selectedDepartment) {
      name += `_${selectedDepartment.toLowerCase()}`;
    }
    if (selectedDay) {
      name += `_day_${selectedDay}`;
    }
    return name;
  };

  const getExportTitle = (baseTitle) => {
    const filters = [];
    if (selectedDepartment) filters.push(selectedDepartment);
    if (selectedDay) filters.push(`Day ${selectedDay}`);
    return filters.length > 0 ? `${baseTitle} (${filters.join(' - ')})` : baseTitle;
  };

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
        const aComp = a.currentStep === 5;
        const bComp = b.currentStep === 5;
        if (aComp === bComp) return 0;
        return aComp ? -1 : 1;
      });

      const data = sortedStudents.map(student => {
        const isCompleted = student.currentStep === 5;
        return {
          'Hall Ticket Number': student.hallTicketNumber || '—',
          'Name': student.name || '—',
          'Email': student.email || '—',
          'Phone': student.phone || '—',
          'Parent Phone': student.parentPhone || '—',
          'Department': student.department || '—',
          'Rank': student.rank || '—',
          'Current Step': student.currentStep || 0,
          'Status': isCompleted ? 'Completed' : 'Pending',
          'Completion Date & Time': isCompleted && student.completedAt ? formatDate(student.completedAt) : '—',
        };
      });

      exportToExcel(data, getExportFilename('students-admission-report'));
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
        const aComp = a.currentStep === 5;
        const bComp = b.currentStep === 5;
        if (aComp === bComp) return 0;
        return aComp ? -1 : 1;
      });

      const data = sortedStudents.map(student => {
        const isCompleted = student.currentStep === 5;
        return {
          'Hall Ticket Number': student.hallTicketNumber || '—',
          'Name': student.name || '—',
          'Email': student.email || '—',
          'Phone': student.phone || '—',
          'Parent Phone': student.parentPhone || '—',
          'Department': student.department || '—',
          'Rank': student.rank || '—',
          'Status': student.currentStep === 5 ? 'Completed' : (student.currentStep > 0 ? 'Pending' : 'Not Visited'),
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

      exportToPDF(
        data,
        columns,
        getExportTitle('Students Admission Report'),
        getExportFilename('students_admission_report')
      );
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
            {getGreeting()}, <span className="gradient-text">Hod Sir</span>
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
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto">
          {/* Branch Filter Button Group */}
          <div className="flex-shrink-0">
            <div className="flex items-center flex-wrap gap-1.5 bg-gray-50 dark:bg-primary-950/20 p-1 rounded-xl border border-gray-200/40 dark:border-primary-400/5">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2">Branch</span>
              {['ALL', 'CSE', 'AIM', 'CIC'].map((branch) => {
                const isActive = (branch === 'ALL' && selectedDepartment === '') || (selectedDepartment === branch);
                return (
                  <button
                    key={branch}
                    onClick={() => handleDepartmentChange(branch === 'ALL' ? '' : branch)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${isActive
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25 scale-[1.02]'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                  >
                    {branch}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Counseling Day Filter Button Group */}
          <div className="flex-shrink-0">
            <div className="flex items-center flex-wrap gap-1.5 bg-gray-50 dark:bg-primary-950/20 p-1 rounded-xl border border-gray-200/40 dark:border-primary-400/5">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2">Counseling</span>
              {(() => {
                const dayFilters = [
                  { label: 'ALL DAYS', value: '' },
                  ...generatedTabs.map(t => ({
                    label: t.displayDate,
                    value: t.id
                  }))
                ];
                return dayFilters.map((item) => {
                  const isActive = selectedDay === item.value;
                  return (
                    <button
                      key={item.label + item.value}
                      onClick={() => handleDayChange(item.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${isActive
                          ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25 scale-[1.02]'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                      {item.label}
                    </button>
                  );
                });
              })()}
            </div>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Students (All)"
              value={overallTotal}
              subtitle={`${leftStudents} left to report`}
              icon={Users}
              color="primary"
              delay={0}
            />
            <StatCard
              title={selectedDay ? `Visited (${generatedTabs.find(t => t.id === selectedDay)?.label || selectedDay})` : "Visited (All Days)"}
              value={visited}
              icon={Users}
              color="info"
              delay={100}
            />
            <StatCard
              title="Pending"
              value={pending}
              icon={Clock}
              color="warning"
              delay={200}
            />
            <StatCard
              title="Completed"
              value={completed}
              icon={CheckCircle}
              color="success"
              delay={300}
            />
          </div>

          {/* All / Pending / Completed Tabs Selector */}
          <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-primary-400/10 pb-1">
            <div className="flex gap-6">
              {[
                { id: 'visited', name: 'Visited', count: visited },
                { id: 'pending', name: 'Pending', count: pending },
                { id: 'completed', name: 'Completed', count: completed }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`relative pb-3 text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 px-1 ${isActive
                        ? 'text-primary-600 dark:text-primary-400 font-bold'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                  >
                    <span>{tab.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive
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
        </div>
      )}
    </DashboardLayout>
  );
}

export default HodDashboard;
