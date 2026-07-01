import React, { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '../components/common/DashboardLayout';
import StudentTable from '../components/students/StudentTable';
import StudentCard from '../components/students/StudentCard';
import StudentSearch from '../components/students/StudentSearch';
import SkeletonLoader, { SkeletonCard } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { getStudents, updateStudentStatus } from '../services/studentService';
import { useSocket } from '../context/SocketContext';
import { STEP_LABELS } from '../utils/constants';

function StudentsPage() {
  const { addToast } = useToast();
  const { socket } = useSocket();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    status: 'all',
  });

  const fetchStudents = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params,
      };
      if (queryParams.status === 'all') delete queryParams.status;
      if (!queryParams.department) delete queryParams.department;
      if (!queryParams.search) delete queryParams.search;

      const res = await getStudents(queryParams);
      const data = res.data;
      setStudents(data.students || data.data || []);
      if (data.pagination) {
        setPagination(prev => ({ ...prev, ...data.pagination }));
      } else if (data.total !== undefined) {
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: Math.ceil(data.total / prev.limit),
        }));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      addToast('error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, addToast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (updated) => {
      setStudents(prev =>
        prev.map(s =>
          (s._id === updated._id || (s.id && s.id === updated.id)) ? { ...s, ...updated } : s
        )
      );
    };
    socket.on('student:updated', handleUpdate);
    return () => socket.off('student:updated', handleUpdate);
  }, [socket]);

  const handleSearch = (search) => {
    setFilters(prev => ({ ...prev, search }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilter = ({ department, status }) => {
    setFilters(prev => ({ ...prev, department, status }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = async (studentId, fieldOrObj, value) => {
    try {
      const updates = typeof fieldOrObj === 'string' ? { [fieldOrObj]: value } : fieldOrObj;
      await updateStudentStatus(studentId, updates);
      
      const message = typeof fieldOrObj === 'string' 
        ? `${STEP_LABELS[fieldOrObj]} ${value ? 'completed' : 'reverted'}`
        : 'Student status updated';
        
      addToast('success', message);
      
      setStudents(prev =>
        prev.map(s =>
          (s._id === studentId || s.id === studentId) ? { ...s, ...updates } : s
        )
      );
    } catch (error) {
      addToast('error', 'Failed to update status');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            Manage and track all student admissions
          </p>
        </div>
        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === 'table'
                ? 'bg-white dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <List className="w-4 h-4" />
            Table
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Cards
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6">
        <StudentSearch onSearch={handleSearch} onFilter={handleFilter} filters={filters} />
      </div>

      {/* Content */}
      {loading ? (
        viewMode === 'table' ? (
          <div className="glass-card p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonLoader key={i} variant="table-row" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )
      ) : viewMode === 'table' ? (
        <StudentTable students={students} onStatusChange={handleStatusChange} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.length > 0 ? (
            students.map(student => (
              <StudentCard
                key={student._id || student.id}
                student={student}
                onStatusChange={handleStatusChange}
              />
            ))
          ) : (
            <div className="col-span-full glass-card p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 font-medium">No students found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages}
            {pagination.total > 0 && ` · ${pagination.total} total students`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                let page;
                if (pagination.totalPages <= 7) {
                  page = i + 1;
                } else if (pagination.page <= 4) {
                  page = i + 1;
                } else if (pagination.page >= pagination.totalPages - 3) {
                  page = pagination.totalPages - 6 + i;
                } else {
                  page = pagination.page - 3 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200 ${
                      pagination.page === page
                        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default StudentsPage;
