import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { AdminUser, AdminStats } from "../types";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Users,
  Eye,
  CheckCircle,
  Search,
  Filter,
  Download,
  UserCheck,
  Crown,
  Trash2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  ShieldOff,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency as globalFormatCurrency } from "../utils/currency";

export default function Admin() {
  const { user } = useAuth();
  const formatCurrency = (val: number) => globalFormatCurrency(val, user?.currency);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTransactions: 0,
    totalAmount: 0,
    newUsersThisMonth: 0,
    activeUsers: 0,
    bannedUsers: 0,
    superAdmins: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"created_at" | "total_transactions" | "total_amount">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const isSuperAdmin = user?.role === "super_admin";

  const loadData = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      setIsLoading(true);
      const [statsData, usersData] = await Promise.all([
        api.admin.getStats(),
        api.admin.getUsers(),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err: any) {
      toast.error(err.message || "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSort = (field: "created_at" | "total_transactions" | "total_amount") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleRoleToggle = async (targetUser: AdminUser) => {
    const newRole = targetUser.user_role === "super_admin" ? "normal" : "super_admin";
    try {
      setActionLoading(`${targetUser.user_id}-role`);
      await api.admin.updateRole(targetUser.user_id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.user_id === targetUser.user_id ? { ...u, user_role: newRole } : u))
      );
      toast.success(`User updated to ${newRole}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (targetUser: AdminUser) => {
    const newStatus = targetUser.user_status === "active" ? "banned" : "active";
    try {
      setActionLoading(`${targetUser.user_id}-status`);
      await api.admin.updateStatus(targetUser.user_id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.user_id === targetUser.user_id ? { ...u, user_status: newStatus } : u))
      );
      toast.success(`User status updated to ${newStatus}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (targetUser: AdminUser) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${targetUser.email}? This will delete all their transactions, categories, and budgets.`)) {
      return;
    }

    try {
      setActionLoading(`${targetUser.user_id}-delete`);
      await api.admin.deleteUser(targetUser.user_id);
      setUsers((prev) => prev.filter((u) => u.user_id !== targetUser.user_id));
      toast.success(`User ${targetUser.email} permanently deleted.`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const exportCSV = () => {
    const headers = ["User ID", "Email", "Full Name", "Role", "Status", "Total Transactions", "Total Amount", "Joined Date"];
    const rows = users.map((u) => [
      u.user_id,
      u.email,
      `"${u.full_name || ""}"`,
      u.user_role,
      u.user_status,
      u.total_transactions,
      u.total_amount,
      u.created_at,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trust_tracker_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users
    .filter((u) => {
      const matchesSearch =
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !roleFilter || u.user_role === roleFilter;
      const matchesStatus = !statusFilter || u.user_status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      if (sortField === "created_at") {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      if (sortField === "total_transactions") {
        return sortOrder === "asc" ? a.total_transactions - b.total_transactions : b.total_transactions - a.total_transactions;
      }
      return sortOrder === "asc" ? a.total_amount - b.total_amount : b.total_amount - a.total_amount;
    });

  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 inline-block mb-4">
          <ShieldAlert className="w-12 h-12 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Access Restricted</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          You need Super Admin privileges to view and manage this administrative control panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Crown className="w-7 h-7 text-amber-500" />
            Admin Command Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            System overview, user role management, and global platform statistics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Users</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalUsers}</p>
            <p className="text-xs text-emerald-500 font-medium mt-1">+{stats.newUsersThisMonth} this month</p>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active / Banned</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.activeUsers} <span className="text-sm font-normal text-slate-400">/ {stats.bannedUsers}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">{stats.superAdmins} Super Admins</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Transactions</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalTransactions}</p>
            <p className="text-xs text-slate-400 mt-1">Across all user accounts</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Global Volume</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {formatCurrency(stats.totalAmount)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Platform-wide tracked spend</p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="normal">Normal</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">User</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Role</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th
                  onClick={() => toggleSort("total_transactions")}
                  className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-primary-600 dark:hover:text-sky-400"
                >
                  <span className="flex items-center gap-1">
                    Transactions
                    {sortField === "total_transactions" && (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => toggleSort("total_amount")}
                  className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-primary-600 dark:hover:text-sky-400"
                >
                  <span className="flex items-center gap-1">
                    Volume
                    {sortField === "total_amount" && (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => toggleSort("created_at")}
                  className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-primary-600 dark:hover:text-sky-400"
                >
                  <span className="flex items-center gap-1">
                    Joined
                    {sortField === "created_at" && (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No users matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-sm">
                          {(u.full_name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{u.full_name || "Anonymous"}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.user_role === "super_admin" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Crown className="w-3 h-3" />
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.user_status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                          <ShieldOff className="w-3 h-3" />
                          Banned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                      {u.total_transactions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-white font-semibold">
                      {formatCurrency(u.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                      {format(new Date(u.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser(u)}
                          title="Inspect Details"
                          className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-sky-400 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRoleToggle(u)}
                          disabled={actionLoading === `${u.user_id}-role` || u.user_id === user?.id}
                          title={u.user_role === "super_admin" ? "Demote to Normal" : "Promote to Super Admin"}
                          className="p-2 text-slate-400 hover:text-amber-500 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusToggle(u)}
                          disabled={actionLoading === `${u.user_id}-status` || u.user_id === user?.id}
                          title={u.user_status === "active" ? "Ban User" : "Unban User"}
                          className={`p-2 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer ${
                            u.user_status === "active" ? "text-slate-400 hover:text-red-500" : "text-emerald-500"
                          }`}
                        >
                          <ShieldOff className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={actionLoading === `${u.user_id}-delete` || u.user_id === user?.id}
                          title="Permanently Delete User"
                          className="p-2 text-slate-400 hover:text-red-500 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-xl">
                  {(selectedUser.full_name || selectedUser.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedUser.full_name || "Anonymous User"}
                  </h3>
                  <p className="text-sm text-slate-400">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400">User ID</span>
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{selectedUser.user_id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400">Role</span>
                  <span className="font-semibold text-primary-600 dark:text-sky-400 capitalize">{selectedUser.user_role}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400">Account Status</span>
                  <span className={`font-semibold capitalize ${selectedUser.user_status === "active" ? "text-emerald-500" : "text-red-500"}`}>
                    {selectedUser.user_status}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400">Total Transactions</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{selectedUser.total_transactions}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400">Total Tracked Volume</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{formatCurrency(selectedUser.total_amount)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400">Registered On</span>
                  <span className="text-slate-600 dark:text-slate-300">{format(new Date(selectedUser.created_at), "PPpp")}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
