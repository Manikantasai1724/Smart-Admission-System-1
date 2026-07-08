import React, { useState, useEffect } from "react";
import { Users, Plus, Edit2, Trash2, ShieldCheck, Loader } from "lucide-react";
import DashboardLayout from "../components/common/DashboardLayout";
import userService from "../services/userService";
import studentService from "../services/studentService";
import * as settingsService from "../services/settingsService";
import { useToast } from "../context/ToastContext";
import { DEPARTMENTS } from "../utils/constants";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [startDate, setStartDate] = useState("");
  const [durationDays, setDurationDays] = useState(3);
  const [savingSetting, setSavingSetting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "HOD",
    department: "ALL"
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers();
      setUsers(res.data.users);
    } catch (err) {
      addToast("error", "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await settingsService.getSettings();
      if (res.data?.settings?.counselingStartDate) {
        const dateStr = res.data.settings.counselingStartDate.split("T")[0];
        setStartDate(dateStr);
      }
      if (res.data?.settings?.counselingDurationDays) {
        setDurationDays(Number(res.data.settings.counselingDurationDays));
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: "", // empty so it doesn't accidentally overwrite
        role: user.role,
        department: user.department || "ALL"
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        username: "",
        password: "",
        role: "HOD",
        department: "ALL"
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await userService.updateUser(editingUser._id, formData);
        addToast("success", "User updated successfully");
      } else {
        if (!formData.password) {
          return addToast("error", "Password is required for new users");
        }
        await userService.createUser(formData);
        addToast("success", "User created successfully");
      }
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      addToast("error", error.response?.data?.message || "Failed to save user");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await userService.deleteUser(id);
      addToast("success", "User deleted successfully");
      fetchUsers();
    } catch (error) {
      addToast("error", error.response?.data?.message || "Failed to delete user");
    }
  };

  const handleDeleteAllStudents = async () => {
    if (!window.confirm("WARNING: This will permanently delete ALL students data from the database. Are you absolutely sure?")) return;
    try {
      await studentService.deleteAllStudents();
      addToast("success", "All students data deleted successfully");
    } catch (error) {
      addToast("error", error.response?.data?.message || "Failed to delete students data");
    }
  };

  const handleSaveSettings = async () => {
    if (!startDate) {
      return addToast("error", "Please select a valid start date");
    }
    if (!durationDays || durationDays < 1) {
      return addToast("error", "Please enter a valid number of days (at least 1)");
    }
    try {
      setSavingSetting(true);
      await settingsService.updateSetting("counselingStartDate", startDate);
      await settingsService.updateSetting("counselingDurationDays", Number(durationDays));
      addToast("success", "Counseling configuration updated successfully! Student phases recalculated.");
    } catch (err) {
      addToast("error", err.response?.data?.message || "Failed to update configuration");
    } finally {
      setSavingSetting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage HOD and Volunteer accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDeleteAllStudents()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Delete All Students
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </div>
      </div>

      {/* Counseling Settings Card */}
      <div className="glass-card p-6 mb-8 border border-white/20 dark:border-primary-400/10 rounded-2xl">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          📅 Counseling Configuration
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Select the counseling starting date and duration. Counseling days on the HOD Dashboard will be counted and generated from these settings.
        </p>
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Counseling Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-primary-400/10 bg-white/50 dark:bg-primary-950/25 text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Total Counseling Days</label>
            <input
              type="number"
              min="1"
              max="30"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-primary-400/10 bg-white/50 dark:bg-primary-950/25 text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={savingSetting}
            className="w-full md:w-auto px-6 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {savingSetting ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/20 dark:border-primary-400/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="text-xs uppercase bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200/50 dark:border-gray-700/50 whitespace-nowrap">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Username</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {u.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">@{u.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                        u.role === 'Admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        u.role === 'HOD' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{u.department}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.role !== 'Admin' && u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingUser ? "Edit User" : "Create New User"}
            </h2>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="glass-input w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="glass-input w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Password {editingUser && "(Leave blank to keep unchanged)"}
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="glass-input w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="glass-input w-full px-3 py-2 disabled:opacity-50"
                  disabled={editingUser && (editingUser.role.toLowerCase() === "admin")}
                >
                  <option value="Admin">Admin</option>
                  <option value="HOD">HOD</option>
                  <option value="Volunteer">Volunteer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select
                  value={formData.department}
                  onChange={e => setFormData({...formData, department: e.target.value})}
                  className="glass-input w-full px-3 py-2 disabled:opacity-50"
                  disabled={editingUser && (editingUser.role.toLowerCase() === "admin")}
                >
                  <option value="ALL">ALL</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default AdminDashboard;
