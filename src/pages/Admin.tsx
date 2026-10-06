import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { AdminUser, AdminStats } from "../types";
import { formatMoney, formatDate } from "../lib/format";
import { usePageHeader } from "../contexts/PageHeaderContext";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Badge } from "../components/ui/Badge";
import { Button, IconButton } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { DataList, Column } from "../components/ui/DataList";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Icons } from "../components/ui/icons";
import { toast } from "sonner";

export default function Admin() {
  const { user } = useAuth();
  const { setPageHeader } = usePageHeader();

  useEffect(() => {
    setPageHeader("Admin Command Center");
  }, [setPageHeader]);

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
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<AdminUser | null>(null);

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load admin data";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRoleToggle = async (targetUser: AdminUser) => {
    const newRole = targetUser.user_role === "super_admin" ? "normal" : "super_admin";
    try {
      await api.admin.updateRole(targetUser.user_id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.user_id === targetUser.user_id ? { ...u, user_role: newRole } : u))
      );
      toast.success(`User role updated to ${newRole}`);
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update user role";
      toast.error(message);
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!userToToggleStatus) return;
    const newStatus = userToToggleStatus.user_status === "active" ? "banned" : "active";
    try {
      await api.admin.updateStatus(userToToggleStatus.user_id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userToToggleStatus.user_id ? { ...u, user_status: newStatus } : u))
      );
      toast.success(`User status updated to ${newStatus}`);
      setUserToToggleStatus(null);
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update user status";
      toast.error(message);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.admin.deleteUser(userToDelete.user_id);
      setUsers((prev) => prev.filter((u) => u.user_id !== userToDelete.user_id));
      toast.success(`User ${userToDelete.email} permanently deleted.`);
      setUserToDelete(null);
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete user";
      toast.error(message);
    }
  };

  const exportCSV = () => {
    const headers = [
      "User ID",
      "Email",
      "Full Name",
      "Role",
      "Status",
      "Total Transactions",
      "Total Amount",
      "Joined Date",
    ];
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
    link.setAttribute("download", `trusttracker_users_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("User list exported to CSV!");
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12">
        <Card className="p-8 space-y-3">
          <Icons.Admin size={32} className="text-[var(--danger)] mx-auto" />
          <h3 className="text-lg font-semibold text-[var(--text)]">Access Restricted</h3>
          <p className="text-xs text-[var(--text-muted)]">
            You need Super Admin privileges to view and manage platform administration.
          </p>
        </Card>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || u.user_role === roleFilter;
    const matchesStatus = !statusFilter || u.user_status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const columns: Column<AdminUser>[] = [
    {
      key: "user",
      header: "User",
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center font-semibold text-xs text-[var(--text)]">
            {(u.full_name || u.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-[var(--text)]">{u.full_name || "Anonymous"}</p>
            <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "user_role",
      header: "Role",
      render: (u) => (
        <Badge variant={u.user_role === "super_admin" ? "warning" : "neutral"}>
          {u.user_role === "super_admin" ? "Super Admin" : "User"}
        </Badge>
      ),
    },
    {
      key: "user_status",
      header: "Status",
      render: (u) => (
        <Badge variant={u.user_status === "active" ? "success" : "danger"}>
          {u.user_status === "active" ? "Active" : "Banned"}
        </Badge>
      ),
    },
    {
      key: "total_transactions",
      header: "Transactions",
      render: (u) => <span className="tabular-nums font-medium">{u.total_transactions}</span>,
    },
    {
      key: "total_amount",
      header: "Volume",
      render: (u) => (
        <span className="tabular-nums font-semibold text-[var(--text)]">
          {formatMoney(u.total_amount, user?.currency || "INR")}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Joined",
      render: (u) => (
        <span className="text-xs text-[var(--text-muted)]">{formatDate(u.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            variant="ghost"
            size="sm"
            ariaLabel="Inspect user details"
            icon={<Icons.Eye size={14} />}
            onClick={() => setSelectedUser(u)}
          />
          <IconButton
            variant="ghost"
            size="sm"
            ariaLabel={u.user_role === "super_admin" ? "Demote to normal" : "Promote to super admin"}
            icon={<Icons.Admin size={14} />}
            onClick={() => handleRoleToggle(u)}
            disabled={u.user_id === user?.id}
          />
          <IconButton
            variant="ghost"
            size="sm"
            ariaLabel={u.user_status === "active" ? "Ban user" : "Unban user"}
            icon={u.user_status === "active" ? <Icons.Close size={14} /> : <Icons.Check size={14} />}
            onClick={() => setUserToToggleStatus(u)}
            disabled={u.user_id === user?.id}
          />
          <IconButton
            variant="danger"
            size="sm"
            ariaLabel="Delete user"
            icon={<Icons.Delete size={14} />}
            onClick={() => setUserToDelete(u)}
            disabled={u.user_id === user?.id}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Admin Command Center"
        description="Monitor system health, manage accounts, audit transaction volume, and enforce platform moderation."
        secondaryActions={
          <Button
            variant="secondary"
            size="sm"
            icon={<Icons.Repeat size={14} />}
            onClick={loadData}
            disabled={isLoading}
          >
            Refresh
          </Button>
        }
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={<Icons.Download size={14} />}
            onClick={exportCSV}
          >
            Export CSV
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Registered Users"
          value={stats.totalUsers.toString()}
          helperText={`+${stats.newUsersThisMonth} registered this month`}
        />

        <StatCard
          label="Active / Banned"
          value={`${stats.activeUsers} / ${stats.bannedUsers}`}
          helperText={`${stats.superAdmins} Super Admins`}
        />

        <StatCard
          label="Total Transactions"
          value={stats.totalTransactions.toString()}
          helperText="Across all personal & shared ledgers"
        />

        <StatCard
          label="Platform Volume"
          value={formatMoney(stats.totalAmount, user?.currency || "INR")}
          helperText="Total spend recorded platform-wide"
        />
      </div>

      {/* Filters Bar */}
      <Card className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-80">
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="w-40">
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { label: "All Roles", value: "" },
                { label: "Super Admin", value: "super_admin" },
                { label: "Normal User", value: "normal" },
              ]}
            />
          </div>

          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { label: "All Statuses", value: "" },
                { label: "Active", value: "active" },
                { label: "Banned", value: "banned" },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Data List */}
      <DataList
        data={filteredUsers}
        columns={columns}
        keyExtractor={(u) => u.user_id}
        isLoading={isLoading}
        emptyState={{
          icon: <Icons.Admin size={24} />,
          title: "No users found",
          description: "No registered users match your search and filter criteria.",
        }}
        renderMobileCard={(u) => (
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center font-semibold text-xs text-[var(--text)]">
                  {(u.full_name || u.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-[var(--text)]">{u.full_name || "Anonymous"}</p>
                  <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Badge variant={u.user_role === "super_admin" ? "warning" : "neutral"}>
                  {u.user_role === "super_admin" ? "Admin" : "User"}
                </Badge>
                <Badge variant={u.user_status === "active" ? "success" : "danger"}>
                  {u.user_status}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border)]">
              <span className="text-[var(--text-muted)]">
                {u.total_transactions} txs • {formatMoney(u.total_amount, user?.currency || "INR")}
              </span>
              <span className="text-[var(--text-muted)]">{formatDate(u.created_at)}</span>
            </div>

            <div className="flex items-center justify-end gap-1 pt-2 border-t border-[var(--border)]">
              <IconButton
                variant="ghost"
                size="sm"
                ariaLabel="View details"
                icon={<Icons.Eye size={14} />}
                onClick={() => setSelectedUser(u)}
              />
              <IconButton
                variant="ghost"
                size="sm"
                ariaLabel="Toggle role"
                icon={<Icons.Admin size={14} />}
                onClick={() => handleRoleToggle(u)}
                disabled={u.user_id === user?.id}
              />
              <IconButton
                variant="ghost"
                size="sm"
                ariaLabel="Toggle status"
                icon={u.user_status === "active" ? <Icons.Close size={14} /> : <Icons.Check size={14} />}
                onClick={() => setUserToToggleStatus(u)}
                disabled={u.user_id === user?.id}
              />
              <IconButton
                variant="danger"
                size="sm"
                ariaLabel="Delete user"
                icon={<Icons.Delete size={14} />}
                onClick={() => setUserToDelete(u)}
                disabled={u.user_id === user?.id}
              />
            </div>
          </div>
        )}
      />

      {/* User Details Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Account Details"
        maxWidth="max-w-md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border)]">
              <div className="w-10 h-10 rounded-md bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center font-bold text-sm text-[var(--text)]">
                {(selectedUser.full_name || selectedUser.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-base text-[var(--text)]">
                  {selectedUser.full_name || "Anonymous User"}
                </h4>
                <p className="text-xs text-[var(--text-muted)]">{selectedUser.email}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">User ID</span>
                <span className="font-mono text-[var(--text)]">{selectedUser.user_id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Role</span>
                <Badge variant={selectedUser.user_role === "super_admin" ? "warning" : "neutral"}>
                  {selectedUser.user_role}
                </Badge>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Account Status</span>
                <Badge variant={selectedUser.user_status === "active" ? "success" : "danger"}>
                  {selectedUser.user_status}
                </Badge>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Total Transactions</span>
                <span className="font-semibold tabular-nums text-[var(--text)]">
                  {selectedUser.total_transactions}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Total Tracked Spend</span>
                <span className="font-semibold tabular-nums text-[var(--text)]">
                  {formatMoney(selectedUser.total_amount, user?.currency || "INR")}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[var(--text-muted)]">Registration Date</span>
                <span className="text-[var(--text)]">{formatDate(selectedUser.created_at)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Ban / Unban Dialog */}
      <ConfirmDialog
        isOpen={!!userToToggleStatus}
        onClose={() => setUserToToggleStatus(null)}
        onConfirm={handleConfirmStatusToggle}
        title={userToToggleStatus?.user_status === "active" ? "Ban User Account" : "Unban User Account"}
        message={`Are you sure you want to ${
          userToToggleStatus?.user_status === "active" ? "ban" : "unban"
        } ${userToToggleStatus?.email}? ${
          userToToggleStatus?.user_status === "active"
            ? "They will be immediately blocked from signing in and accessing data."
            : "Their access permissions will be restored."
        }`}
        confirmText={userToToggleStatus?.user_status === "active" ? "Ban Account" : "Unban Account"}
        variant={userToToggleStatus?.user_status === "active" ? "danger" : "primary"}
      />

      {/* Confirm Delete User Dialog */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDeleteUser}
        title="Permanently Delete User"
        message={`Are you sure you want to permanently delete ${userToDelete?.email}? This will delete all their recorded transactions, group memberships, and budgets. This action cannot be undone.`}
        confirmText="Delete Account"
      />
    </div>
  );
}
