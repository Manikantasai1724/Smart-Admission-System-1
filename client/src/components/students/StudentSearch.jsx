import React, { useState } from "react";
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { useDebounce } from "../../hooks/useDebounce";
import { DEPARTMENTS, STATUS_FILTERS } from "../../utils/constants";

function StudentSearch({ onSearch, onFilter, filters = {} }) {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [showFilters, setShowFilters] = useState(false);
  const [department, setDepartment] = useState(filters.department || "");
  const [status, setStatus] = useState(filters.status || "all");
  const [rankFilter, setRankFilter] = useState(filters.rankMin || "");
  const [rankMaxFilter, setRankMaxFilter] = useState(filters.rankMax || "");
  const [phoneFilter, setPhoneFilter] = useState(filters.phone || "");

  const debouncedSearch = useDebounce(searchTerm, 300);

  React.useEffect(() => {
    onSearch?.(debouncedSearch);
  }, [debouncedSearch]);

  const handleDepartmentChange = (value) => {
    setDepartment(value);
    onFilter?.({
      department: value,
      status,
      rankMin: rankFilter,
      rankMax: rankMaxFilter,
      phone: phoneFilter,
    });
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    onFilter?.({
      department,
      status: value,
      rankMin: rankFilter,
      rankMax: rankMaxFilter,
      phone: phoneFilter,
    });
  };

  const handleRankFilterChange = (min, max) => {
    setRankFilter(min);
    setRankMaxFilter(max);
    onFilter?.({
      department,
      status,
      rankMin: min,
      rankMax: max,
      phone: phoneFilter,
    });
  };

  const handlePhoneFilterChange = (value) => {
    setPhoneFilter(value);
    onFilter?.({
      department,
      status,
      rankMin: rankFilter,
      rankMax: rankMaxFilter,
      phone: value,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDepartment("");
    setStatus("all");
    setRankFilter("");
    setRankMaxFilter("");
    setPhoneFilter("");
    onSearch?.("");
    onFilter?.({
      department: "",
      status: "all",
      rankMin: "",
      rankMax: "",
      phone: "",
    });
  };

  const hasActiveFilters =
    searchTerm ||
    department ||
    (status && status !== "all") ||
    rankFilter ||
    rankMaxFilter ||
    phoneFilter;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, hall ticket number, or rank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-12 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                onSearch?.("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
            showFilters || hasActiveFilters
              ? "bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/20 dark:border-primary-400/20 dark:text-primary-400"
              : "bg-white/60 border-gray-200/60 text-gray-600 hover:bg-white/80 dark:bg-primary-950/40 dark:border-primary-400/15 dark:text-gray-400 dark:hover:bg-primary-900/30"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="glass-card p-4 animate-slide-down">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Department Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="glass-input w-full text-sm"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="glass-input w-full text-sm"
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Rank Min Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Rank Min
              </label>
              <input
                type="number"
                placeholder="From"
                value={rankFilter}
                onChange={(e) =>
                  handleRankFilterChange(e.target.value, rankMaxFilter)
                }
                className="glass-input w-full text-sm"
              />
            </div>

            {/* Rank Max Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Rank Max
              </label>
              <input
                type="number"
                placeholder="To"
                value={rankMaxFilter}
                onChange={(e) =>
                  handleRankFilterChange(rankFilter, e.target.value)
                }
                className="glass-input w-full text-sm"
              />
            </div>

            {/* Phone Filter */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Phone
              </label>
              <input
                type="text"
                placeholder="Phone number"
                value={phoneFilter}
                onChange={(e) => handlePhoneFilterChange(e.target.value)}
                className="glass-input w-full text-sm"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentSearch;
