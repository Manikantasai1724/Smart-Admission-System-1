import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '../components/common/DashboardLayout';
import StudentCard from '../components/students/StudentCard';
import StudentSearch from '../components/students/StudentSearch';
import { SkeletonCard } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { getStudents, updateStudentStatus } from '../services/studentService';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { STEP_LABELS } from '../utils/constants';

function StudentsPage() {
  const { addToast } = useToast();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
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
    rankMin: '',
    rankMax: '',
    phone: '',
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
      if (!queryParams.rankMin) delete queryParams.rankMin;
      if (!queryParams.rankMax) delete queryParams.rankMax;
      if (!queryParams.phone) delete queryParams.phone;

      const res = await getStudents(queryParams);
      const data = res.data;
      setStudents(data.students || data.data || []);
      if (data.pagination) {
        setPagination(prev => ({ 
          ...prev, 
          ...data.pagination,
          totalPages: data.pagination.pages || data.pagination.totalPages 
        }));
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

  const handleFilter = (filterParams) => {
    setFilters(prev => ({ ...prev, ...filterParams }));
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            Manage and track all student admissions
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6">
        <StudentSearch onSearch={handleSearch} onFilter={handleFilter} filters={filters} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.length > 0 ? (
            students.map(student => (
              <StudentCard
                key={student._id || student.id}
                student={student}
                onStatusChange={user?.role?.toLowerCase() === 'volunteer' ? handleStatusChange : undefined}
                onTokenGenerated={handleTokenGenerated}
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
