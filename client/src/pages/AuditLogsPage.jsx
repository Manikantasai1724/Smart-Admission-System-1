import React, { useState, useEffect } from "react";
import { History, Loader, Search, ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "../components/common/DashboardLayout";
import { getLogs } from "../services/logService";
import { useToast } from "../context/ToastContext";

const renderAction = (log) => {
  if (log.action === "STUDENT_DELETED") {
    return <span className="text-red-500 font-medium">Deleted Student</span>;
  }
  
  if (log.action === "STATUS_UPDATE") {
    const changes = [];
    if (log.oldValue && log.newValue) {
      if (!log.oldValue.selfReported && log.newValue.selfReported) changes.push("Self Reported");
      if (!log.oldValue.documentsSubmitted && log.newValue.documentsSubmitted) changes.push("Documents Submitted");
      if (!log.oldValue.formFilled && log.newValue.formFilled) changes.push("Form Filled");
      
      if (log.oldValue.selfReported && !log.newValue.selfReported) changes.push("Unmarked Self Reported");
      if (log.oldValue.documentsSubmitted && !log.newValue.documentsSubmitted) changes.push("Unmarked Documents Submitted");
      if (log.oldValue.formFilled && !log.newValue.formFilled) changes.push("Unmarked Form Filled");
    }
    
    if (changes.length > 0) {
      return (
        <div className="text-sm">
          Status: <span className="font-semibold text-primary-600 dark:text-primary-400">{changes.join(", ")}</span>
        </div>
      );
    }
    return <div className="text-sm">Updated Status / Remarks</div>;
  }
  
  return <div className="text-sm font-medium">{log.action}</div>;
};

function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const { addToast } = useToast();

  const fetchLogs = async (currentPage, searchQuery) => {
    try {
      setLoading(true);
      const res = await getLogs({ page: currentPage, limit: 15, search: searchQuery });
      setLogs(res.data.logs);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      addToast("error", "Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchLogs(1, search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    fetchLogs(page, search);
  }, [page]);

  const handlePrevPage = () => {
    if (page > 1) setPage(p => p - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(p => p + 1);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <History className="w-8 h-8 text-primary-500" />
            Audit Logs
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track all status changes made by volunteers
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name or HTNO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full pl-9 pr-4 py-2"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/20 dark:border-primary-400/10 flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="text-xs uppercase bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200/50 dark:border-gray-700/50 whitespace-nowrap">
              <tr>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Student</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Updated By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <Loader className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No activity found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {log.studentId?.name || "Unknown Student"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.studentId?.hallTicketNumber} • {log.studentId?.department}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderAction(log)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-gray-200">
                        {log.updatedBy?.name || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.updatedBy?.role}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/30">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AuditLogsPage;
