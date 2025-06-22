/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { format, parseISO } from "date-fns";
import {
  Users,
  IndianRupee,
  //   TrendingUp,
  Shield,
  Eye,
  Ban,
  CheckCircle,
  //   AlertTriangle,
  BarChart3,
  Calendar,
  Search,
  Filter,
  Download,
  UserCheck,
  UserX,
  Crown,
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_sign_in_at: string;
  role: "normal" | "super_admin";
  total_transactions: number;
  total_amount: number;
  status: "active" | "banned";
}

interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalAmount: number;
  newUsersThisMonth: number;
  activeUsers: number;
  bannedUsers: number;
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
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Check if user is super admin
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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

      if (error) {
        console.error("Error checking admin access:", error);
        return;
      }

      setIsSuperAdmin(data?.role === "super_admin");
    } catch (error) {
      console.error("Error checking admin access:", error);
    }
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch user stats from the view
      const { data: usersWithStats, error } = await supabase
        .from("admin_user_stats")
        .select("*");

      if (error) throw error;

      const users = usersWithStats.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name || "Unknown",
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        role: user.role || "normal",
        total_transactions: user.total_transactions || 0,
        total_amount: user.total_amount || 0,
        status: "active" as const, // You can later derive this from another column
      }));

      setUsers(users);

      // Summary stats
      const totalUsers = users.length;
      const totalTransactions = users.reduce(
        (sum, u) => sum + u.total_transactions,
        0
      );
      const totalAmount = users.reduce((sum, u) => sum + u.total_amount, 0);

      const thisMonth = new Date();
      thisMonth.setDate(1);

      const newUsersThisMonth = users.filter(
        (u) => new Date(u.created_at) >= thisMonth
      ).length;

      const activeUsers = users.filter((u) => u.status === "active").length;
      const bannedUsers = users.filter((u) => u.status === "banned").length;

      setStats({
        totalUsers,
        totalTransactions,
        totalAmount,
        newUsersThisMonth,
        activeUsers,
        bannedUsers,
      });
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async (
    userId: string,
    action: "promote" | "demote" | "ban" | "unban"
  ) => {
    try {
      if (action === "promote" || action === "demote") {
        const newRole = action === "promote" ? "super_admin" : "normal";

        const { error } = await supabase
          .from("user_roles")
          .upsert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      // Reload data
      await loadAdminData();

      alert(`User ${action}d successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      alert(`Failed to ${action} user. Please try again.`);
    }
  };

  const viewUserDetails = async (user: AdminUser) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const exportData = () => {
    const csvContent = [
      [
        "Email",
        "Name",
        "Role",
        "Created At",
        "Transactions",
        "Total Amount",
        "Status",
      ].join(","),
      ...filteredUsers.map((user) =>
        [
          user.email,
          user.name,
          user.role,
          format(parseISO(user.created_at), "yyyy-MM-dd"),
          user.total_transactions,
          user.total_amount,
          user.status,
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

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // If not super admin, show access denied
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to access the admin panel.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-primary-300 h-12 w-12 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
            <Crown size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Super Admin Panel</p>
          </div>
        </div>
        <button onClick={exportData} className="btn-primary flex items-center">
          <Download size={16} className="mr-2" />
          Export Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

        <div
          className="card p-4 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <UserCheck size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-xl font-bold">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div
          className="card p-4 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <UserX size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Banned Users</p>
              <p className="text-xl font-bold">{stats.bannedUsers}</p>
            </div>
          </div>
        </div>

        <div
          className="card p-4 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-xl font-bold">{stats.totalTransactions}</p>
            </div>
          </div>
        </div>

        <div
          className="card p-4 animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
              <IndianRupee size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Volume</p>
              <p className="text-xl font-bold">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div
          className="card p-4 animate-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
              <Calendar size={20} className="text-indigo-600" />
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

          <select
            className="select-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>

          <div className="text-sm text-gray-500 flex items-center">
            <Filter size={16} className="mr-2" />
            {filteredUsers.length} of {users.length} users
          </div>
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
                  Transactions
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3 text-primary-700 font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
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
                        user.role === "super_admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role === "super_admin" ? "Super Admin" : "User"}
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
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status}
                    </span>
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

                      {user.role === "normal" ? (
                        <button
                          onClick={() => handleUserAction(user.id, "promote")}
                          className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded transition-colors"
                          title="Promote to admin"
                        >
                          <Crown size={16} />
                        </button>
                      ) : (
                        user.id !== user.id && (
                          <button
                            onClick={() => handleUserAction(user.id, "demote")}
                            className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded transition-colors"
                            title="Demote to user"
                          >
                            <UserCheck size={16} />
                          </button>
                        )
                      )}

                      {user.status === "active" ? (
                        <button
                          onClick={() => handleUserAction(user.id, "ban")}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Ban user"
                        >
                          <Ban size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(user.id, "unban")}
                          className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors"
                          title="Unban user"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">User Details</h2>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>{" "}
                    {selectedUser.name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedUser.email}
                  </div>
                  <div>
                    <span className="font-medium">Role:</span>{" "}
                    {selectedUser.role}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    {selectedUser.status}
                  </div>
                  <div>
                    <span className="font-medium">Joined:</span>{" "}
                    {format(parseISO(selectedUser.created_at), "MMM d, yyyy")}
                  </div>
                  {selectedUser.last_sign_in_at && (
                    <div>
                      <span className="font-medium">Last Login:</span>{" "}
                      {format(
                        parseISO(selectedUser.last_sign_in_at),
                        "MMM d, yyyy"
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Activity Summary</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Total Transactions:</span>{" "}
                    {selectedUser.total_transactions}
                  </div>
                  <div>
                    <span className="font-medium">Total Amount:</span>{" "}
                    {formatCurrency(selectedUser.total_amount)}
                  </div>
                  <div>
                    <span className="font-medium">
                      Average per Transaction:
                    </span>{" "}
                    {selectedUser.total_transactions > 0
                      ? formatCurrency(
                          selectedUser.total_amount /
                            selectedUser.total_transactions
                        )
                      : "$0"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowUserModal(false)}
                className="btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
