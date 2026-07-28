import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, Loader } from 'lucide-react';
import DashboardLayout from '../components/common/DashboardLayout';
import { useToast } from '../context/ToastContext';
import { getStudents } from '../services/studentService';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const DetailItem = ({ label, value, isBadge, isProminent, isPhone }) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
    {isBadge ? (
      <div>
        <span className={`inline-flex px-4 py-1.5 rounded-xl text-base font-bold ${
          value === 'Completed' || value === 'Verified' 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          {value}
        </span>
      </div>
    ) : isPhone ? (
      <span className="text-xl font-semibold tracking-wide text-primary-600 dark:text-primary-400">{value || 'N/A'}</span>
    ) : isProminent ? (
      <span className="text-xl font-bold text-gray-900 dark:text-white">{value || 'N/A'}</span>
    ) : (
      <span className="text-lg font-semibold text-gray-900 dark:text-white">{value || 'N/A'}</span>
    )}
  </div>
);

function StudentsPage() {
  const { addToast } = useToast();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false); // Default to false for initial empty state
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("hallTicket");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    search: '',
    rankMin: '',
    rankMax: '',
    tokenNumber: '',
  });

  const fetchStudents = useCallback(async (params = {}) => {
    if (!hasSearched) return;
    
    try {
      setLoading(true);
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params,
      };
      
      if (!queryParams.search) delete queryParams.search;
      if (!queryParams.rankMin) delete queryParams.rankMin;
      if (!queryParams.rankMax) delete queryParams.rankMax;
      if (!queryParams.tokenNumber) delete queryParams.tokenNumber;

      const res = await getStudents(queryParams);
      const data = res.data;
      const foundStudents = data.students || data.data || [];
      
      setStudents(foundStudents);
      
      if (foundStudents.length === 1 && !selectedStudent) {
        setSelectedStudent(foundStudents[0]);
      }

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
  }, [pagination.page, pagination.limit, filters, hasSearched, selectedStudent, addToast]);

  // Fetch when filters or page changes, but only if we have searched at least once
  useEffect(() => {
    if (hasSearched) {
      fetchStudents();
    }
  }, [filters, pagination.page]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (updated) => {
      setStudents(prev =>
        prev.map(s =>
          (s._id === updated._id || (s.id && s.id === updated.id)) ? { ...s, ...updated } : s
        )
      );
      if (selectedStudent && (selectedStudent._id === updated._id || selectedStudent.id === updated.id)) {
        setSelectedStudent(prev => ({ ...prev, ...updated }));
      }
    };
    socket.on('student:updated', handleUpdate);
    return () => socket.off('student:updated', handleUpdate);
  }, [socket, selectedStudent]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setHasSearched(true);
    setSelectedStudent(null);
    setPagination(prev => ({ ...prev, page: 1 }));
    
    const searchParams = {
      search: "",
      rankMin: "",
      rankMax: "",
      tokenNumber: ""
    };

    if (activeFilter === "hallTicket" || activeFilter === "name") {
      searchParams.search = searchQuery;
    } else if (activeFilter === "rank") {
      searchParams.rankMin = searchQuery;
      searchParams.rankMax = searchQuery;
    } else if (activeFilter === "token") {
      searchParams.tokenNumber = searchQuery;
    }
    
    setFilters(searchParams);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    
    return (
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
    );
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="text-center mb-8 pt-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Students</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Find student information instantly
        </p>
      </div>

      {/* Large Search Bar */}
      <div className="max-w-2xl mx-auto mb-10">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Hall Ticket Number, Rank, Token Number or Student Name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-24 py-4 text-base md:text-lg bg-white dark:bg-primary-950/40 border border-gray-200 dark:border-primary-400/20 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white transition-all outline-none"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            Search
          </button>
        </form>
        
        {/* Filter Chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
          {["hallTicket", "rank", "token", "name"].map((filter) => (
            <button 
              key={filter} 
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === filter 
                  ? "bg-primary-100 text-primary-700 border border-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-800 shadow-sm" 
                  : "bg-white/60 text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-primary-950/30 dark:text-gray-400 dark:border-primary-400/10 dark:hover:bg-primary-900/20"
              }`}
            >
              {filter === "hallTicket" ? "Hall Ticket" : filter === "rank" ? "Rank" : filter === "token" ? "Token" : "Name"}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 animate-pulse">
            <Loader className="w-10 h-10 animate-spin text-primary-500 mb-4" />
            <p className="text-gray-500 font-medium text-lg">Searching...</p>
          </div>
        ) : !hasSearched ? (
          <div className="glass-card p-12 text-center max-w-xl mx-auto mt-8 border-dashed">
            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">🔍 Search for a student to view their details.</p>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Select a filter above and enter your query to begin.</p>
          </div>
        ) : students.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-xl mx-auto mt-8">
            <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-5 border border-gray-100 dark:border-gray-700">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No student found.</p>
            <div className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 inline-block text-left border border-gray-100 dark:border-gray-700/50">
              <p className="mb-3 font-medium text-gray-700 dark:text-gray-300">Try searching using:</p>
              <ul className="list-disc list-inside space-y-1.5 text-sm">
                <li>Hall Ticket Number</li>
                <li>Rank</li>
                <li>Token Number</li>
                <li>Student Name</li>
              </ul>
            </div>
          </div>
        ) : selectedStudent ? (
          <div className="animate-fade-in">
            <button 
              onClick={() => setSelectedStudent(null)} 
              className="flex items-center gap-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 mb-6 transition-colors font-medium group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Results
            </button>
            
            <div className="glass-card overflow-hidden rounded-2xl border border-white/20 dark:border-primary-400/10 shadow-xl">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-black/10 rounded-full blur-xl"></div>
                
                <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-4xl font-bold border border-white/30 shadow-inner z-10 shrink-0">
                  {selectedStudent.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="text-center md:text-left text-white z-10">
                  <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">{selectedStudent.name}</h2>
                  <p className="text-primary-100 font-semibold text-xl md:text-2xl tracking-wide">{selectedStudent.hallTicket || selectedStudent.hallTicketNumber || 'No Hall Ticket'}</p>
                </div>
              </div>
              
              <div className="p-6 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  <DetailItem label="Hall Ticket Number" value={selectedStudent.hallTicket || selectedStudent.hallTicketNumber} isProminent />
                  <DetailItem label="Rank" value={selectedStudent.rank} isProminent />
                  <DetailItem label="Branch" value={selectedStudent.department} isProminent />
                  <DetailItem label="Token Number" value={selectedStudent.tokenNumber ? `#${selectedStudent.tokenNumber}` : 'Not Generated'} isProminent />
                  
                  <DetailItem label="Student Mobile" value={selectedStudent.phone} isPhone />
                  <DetailItem label="Parent Mobile" value={selectedStudent.parentPhone} isPhone />
                  
                  <DetailItem 
                    label="Admission Status" 
                    value={selectedStudent.selfReported && selectedStudent.documentsSubmitted && selectedStudent.formFilled ? "Completed" : "Pending"} 
                    isBadge 
                  />
                  <DetailItem 
                    label="Verification Status" 
                    value={selectedStudent.documentsSubmitted ? "Verified" : "Pending"} 
                    isBadge 
                  />
                  
                  <DetailItem label="Last Updated Date" value={selectedStudent.updatedAt ? new Date(selectedStudent.updatedAt).toLocaleDateString() : 'N/A'} />
                  <DetailItem label="Last Updated Time" value={selectedStudent.updatedAt ? new Date(selectedStudent.updatedAt).toLocaleTimeString() : 'N/A'} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 px-2">Search Results ({pagination.total || students.length})</h3>
            <div className="glass-card overflow-hidden rounded-2xl border border-white/20 dark:border-primary-400/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                  <thead className="text-xs uppercase bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200/50 dark:border-gray-700/50">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Student</th>
                      <th className="px-6 py-4 font-semibold">Hall Ticket</th>
                      <th className="px-6 py-4 font-semibold">Rank</th>
                      <th className="px-6 py-4 font-semibold">Branch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                    {students.map(s => (
                      <tr 
                        key={s._id} 
                        onClick={() => setSelectedStudent(s)} 
                        className="hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow">
                              {s.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {s.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{s.hallTicket || s.hallTicketNumber || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700 dark:text-gray-300">{s.rank || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300">
                            {s.department || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {renderPagination()}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default StudentsPage;
