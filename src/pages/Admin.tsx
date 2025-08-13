/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { format, parseISO } from "date-fns";
import { toast, Toaster } from "sonner";

import {
  Users,
  Eye,
  CheckCircle,
  BarChart3,
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
} from "lucide-react";

import { AnimatePresence, motion } from "framer-motion";

interface AdminUser {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_sign_in_at: string;
  user_role: "normal" | "super_admin";
  user_status: "active" | "banned";
  total_transactions: number;
  total_amount: number;
  raw_user_meta_data?: {
    full_name?: string;
    name?: string;
    picture?: string;
    [key: string]: any;
  };
}

interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalAmount: number;
  newUsersThisMonth: number;
  activeUsers: number;
  bannedUsers: number;
  superAdmins: number;
}

function Admin() {
  const { user } = useAuth();
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
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sortField, setSortField] = React.useState<string>("created_at");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.user_role === roleFilter;
    const matchesStatus = !statusFilter || user.user_status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortField === "created_at") {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }
    if (sortField === "total_transactions") {
      return sortOrder === "asc"
        ? a.total_transactions - b.total_transactions
        : b.total_transactions - a.total_transactions;
    }
    // add other sort fields if needed
    return 0;
  });

  // Check if user is super admin
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadAdminData();
    }
  }, [isSuperAdmin]);

  const checkAdminAccess = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        console.error("Error checking admin access:", error);
        setIsSuperAdmin(false); // explicitly mark as not admin
        return;
      }

      setIsSuperAdmin(data.role === "super_admin");
    } catch (error) {
      console.error("Error checking admin access:", error);
      setIsSuperAdmin(false);
    }
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Loading admin data...");

      // Call the admin function
      const { data: adminUsers, error } = await supabase.rpc("get_admin_users");

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Admin users loaded:", adminUsers);
      setUsers(adminUsers || []);

      // Calculate stats
      if (adminUsers && adminUsers.length > 0) {
        const totalUsers = adminUsers.length;
        const totalTransactions = adminUsers.reduce(
          (sum: number, u: AdminUser) => sum + u.total_transactions,
          0
        );
        const totalAmount = adminUsers.reduce(
          (sum: number, u: AdminUser) => sum + u.total_amount,
          0
        );

        const thisMonth = new Date();
        thisMonth.setDate(1);

        const newUsersThisMonth = adminUsers.filter(
          (u: AdminUser) => new Date(u.created_at) >= thisMonth
        ).length;

        const activeUsers = adminUsers.filter(
          (u: AdminUser) => u.user_status === "active"
        ).length;
        const bannedUsers = adminUsers.filter(
          (u: AdminUser) => u.user_status === "banned"
        ).length;
        const superAdmins = adminUsers.filter(
          (u: AdminUser) => u.user_role === "super_admin"
        ).length;

        setStats({
          totalUsers,
          totalTransactions,
          totalAmount,
          newUsersThisMonth,
          activeUsers,
          bannedUsers,
          superAdmins,
        });
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
      setError("Failed to load admin data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async (
    userId: string,
    action: "promote" | "demote" | "ban" | "unban" | "delete"
  ) => {
    if (!userId || !action) return;

    if (action === "delete") {
      console.log("Delete i wroking but not showing in ui......");

      toast.warning("Are you sure you want to permanently delete this user?", {
        description: (
          <>
            <p>This will delete:</p>
            <ul className="list-disc list-inside text-sm ml-4">
              <li>All transactions</li>
              <li>All categories</li>
              <li>All budgets</li>
              <li>User account</li>
            </ul>
            <p className="mt-2 text-red-500 font-semibold">
              ⚠ This action cannot be undone.
            </p>
          </>
        ),
        action: {
          label: "Confirm Delete",
          onClick: async () => {
            await performUserAction(userId, action);
          },
        },
      });
      return;
    }

    await performUserAction(userId, action);
  };

  const performUserAction = async (
    userId: string,
    action: "promote" | "demote" | "ban" | "unban" | "delete"
  ) => {
    setActionLoading(`${userId}-${action}`);

    try {
      const rpcName = `admin_${action}_user`;
      const payload: Record<string, any> = { target_user_id: userId };
      if (action === "ban") payload.reason = "Banned by admin";

      const { data, error } = await supabase.rpc(rpcName, payload);

      if (error) {
        throw new Error(error.message || `Failed to ${action} user.`);
      }

      if (data?.success) {
        toast.success(data.message || `User ${action}ed successfully`);

        if (action === "delete") {
          setUsers((prev) => prev.filter((u) => u.user_id !== userId));
          setStats((prev) => ({
            ...prev,
            totalUsers: prev.totalUsers - 1,
            activeUsers: prev.activeUsers - 1,
          }));
        } else {
          await loadAdminData();
        }
      } else {
        throw new Error(data?.message || `User ${action} failed.`);
      }
    } catch (err: any) {
      const msg =
        err?.message ||
        (typeof err === "string" ? err : `Unexpected error during ${action}`);
      console.error(`${action} user failed:`, msg);
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const viewUserDetails = (user: AdminUser) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const exportData = () => {
    const csvContent = [
      [
        "Email",
        "Name",
        "Role",
        "Status",
        "Created At",
        "Transactions",
        "Total Amount",
      ].join(","),
      ...filteredUsers.map((user) =>
        [
          user.email,
          user.full_name,
          user.user_role,
          user.user_status,
          format(parseISO(user.created_at), "yyyy-MM-dd"),
          user.total_transactions,
          user.total_amount,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Format currency using user's preferred currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: user?.currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const currentUserId = user?.id;

  if (isSuperAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm animate-pulse">
          Checking access...
        </div>
      </div>
    );
  }

  // If not super admin, show access denied
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="text-center animate-fade-in-up">
          <div className="text-6xl mb-4 text-gray-400">🚫</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Page Not Found
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            The page you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-block px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go back home
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-white duration-300">
        <div className="flex flex-col items-center space-y-4 animate-fade-in-up">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin-fast"></div>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-primary-600">
              
            </div>
          </div>
          <p className="text-sm text-white/90">Loading admin data....</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Title + Icon */}
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center mr-4">
            <Crown size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-sm">Super Admin Control Panel</p>
          </div>
        </div>

        {/* Right: Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:space-x-3 gap-2">
          <button
            onClick={loadAdminData}
            className="btn-outline flex items-center justify-center"
            disabled={isLoading}
          >
            <RefreshCw
              size={16}
              className={`mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center animate-fade-in">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center animate-fade-in">
          <CheckCircle size={16} className="mr-2" />
          {success}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Total User */}
        <div className="card p-4 animate-fade-in">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-xl font-bold">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        {/* Active Users */}
        <div
          className="card p-4 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <UserCheck size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-xl font-bold">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        {/* Admins */}
        <div
          className="card p-4 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
              <Crown size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Admins</p>
              <p className="text-xl font-bold">{stats.superAdmins}</p>
            </div>
          </div>
        </div>
        {/* Transactions */}
        <div
          className="card p-4 animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
              <BarChart3 size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-xl font-bold">{stats.totalTransactions}</p>
            </div>
          </div>
        </div>
        {/* Total Volume */}
        <div
          className="card p-4 animate-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="flex items-center">
            {/* <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
              <div className="text-yellow-600" />
            </div> */}
            <div>
              <p className="text-sm text-gray-500">Total Volume</p>
              <p className="text-xl font-bold">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
          </div>
        </div>
        {/* New This Month */}
        <div
          className="card p-4 animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mr-3">
              <TrendingUp size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">New This Month</p>
              <p className="text-xl font-bold">{stats.newUsersThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 animate-slide-up">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="select-field"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="normal">Normal Users</option>
            <option value="super_admin">Super Admins</option>
          </select>

          <div className="text-sm text-gray-500 flex items-center">
            <Filter size={16} className="mr-2" />
            {filteredUsers.length} of {users.length} users
          </div>

          <button
            onClick={exportData}
            className="btn-primary flex items-center justify-center"
          >
            <Download size={16} className="mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div
        className="card overflow-hidden animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort("total_transactions")}
                >
                  <div className="flex items-center">
                    Transactions
                    {sortField === "total_transactions" && (
                      <span className="ml-1">
                        {sortOrder === "asc" ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>

                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort("created_at")}
                >
                  <div className="flex items-center">
                    Joined
                    {sortField === "created_at" && (
                      <span className="ml-1">
                        {sortOrder === "asc" ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>

                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedUsers.map((user) => (
                <tr
                  key={user.user_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3 text-primary-700 font-bold">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.raw_user_meta_data?.full_name ||
                            user.raw_user_meta_data?.name ||
                            (user.full_name && user.full_name !== "Anonymous"
                              ? user.full_name
                              : "Anonymous")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.user_role === "super_admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.user_role === "super_admin"
                        ? "Super Admin"
                        : "User"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.user_status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.user_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.total_transactions}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {formatCurrency(user.total_amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(parseISO(user.created_at), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => viewUserDetails(user)}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>

                      {user.user_role === "normal" ? (
                        <button
                          onClick={() =>
                            handleUserAction(user.user_id, "promote")
                          }
                          disabled={actionLoading === `${user.user_id}-promote`}
                          className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded transition-colors disabled:opacity-50"
                          title="Promote to admin"
                        >
                          {actionLoading === `${user.user_id}-promote` ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Crown size={16} />
                          )}
                        </button>
                      ) : (
                        user.user_role === "super_admin" &&
                        user.user_id !== currentUserId && (
                          <button
                            onClick={() =>
                              handleUserAction(user.user_id, "demote")
                            }
                            disabled={
                              actionLoading === `${user.user_id}-demote`
                            }
                            className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
                            title="Demote to user"
                          >
                            {actionLoading === `${user.user_id}-demote` ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <ShieldOff size={16} />
                            )}
                          </button>
                        )
                      )}

                      <button
                        onClick={() => handleUserAction(user.user_id, "delete")}
                        disabled={actionLoading === `${user.user_id}-delete`}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Delete user"
                      >
                        {actionLoading === `${user.user_id}-delete` ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}

      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6"
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ duration: 0.25 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4 mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  User Details
                </h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                >
                  &times;
                </button>
              </div>

              {/* Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                    👤 Basic Information
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium text-gray-800">Name:</span>{" "}
                      {selectedUser.raw_user_meta_data?.full_name ||
                        "Unknown User"}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Email:</span>{" "}
                      {selectedUser.email}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Role:</span>{" "}
                      {selectedUser.user_role}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Status:</span>{" "}
                      {selectedUser.user_status}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Joined:</span>{" "}
                      {format(
                        parseISO(selectedUser.created_at),
                        "MMM d, yyyy, hh:mm:ss a"
                      )}
                    </div>
                    {selectedUser.last_sign_in_at && (
                      <div>
                        <span className="font-medium text-gray-800">
                          Last Login:
                        </span>{" "}
                        {format(
                          parseISO(selectedUser.last_sign_in_at),
                          "MMM d, yyyy, hh:mm:ss a"
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                    📊 Activity Summary
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium text-gray-800">
                        Total Transactions:
                      </span>{" "}
                      {selectedUser.total_transactions}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">
                        Total Amount:
                      </span>{" "}
                      {formatCurrency(selectedUser.total_amount)}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">
                        Average per Transaction:
                      </span>
                      {selectedUser.total_transactions > 0
                        ? formatCurrency(
                            selectedUser.total_amount /
                              selectedUser.total_transactions
                          )
                        : formatCurrency(0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Admin;
