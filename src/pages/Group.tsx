/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  //   QrCode,
  Copy,
  Settings,
  LogOut,
  Eye,
  //   Calendar,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
// import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { useGroups } from "../hooks/useGroup";

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const { groups, loading, createGroup, joinGroup, leaveGroup, deleteGroup } =
    useGroups();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Create group form
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
  });

  // Join group form
  const [joinCode, setJoinCode] = useState("");

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    try {
      setSubmitting(true);
      await createGroup(
        createForm.name.trim(),
        createForm.description.trim() || undefined
      );
      setShowCreateModal(false);
      setCreateForm({ name: "", description: "" });
      showNotification("Group created successfully!", "success");
    } catch (error: any) {
      showNotification("Failed to create group: " + error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      setSubmitting(true);
      await joinGroup(joinCode.trim().toUpperCase());
      setShowJoinModal(false);
      setJoinCode("");
      showNotification("Successfully joined the group!", "success");
    } catch (error: any) {
      showNotification("Failed to join group: " + error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to leave "${groupName}"?`)) return;

    try {
      await leaveGroup(groupId);
      showNotification("Left group successfully", "success");
    } catch (error: any) {
      showNotification("Failed to leave group: " + error.message, "error");
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${groupName}"? This action cannot be undone.`
      )
    )
      return;

    try {
      await deleteGroup(groupId);
      showNotification("Group deleted successfully", "success");
    } catch (error: any) {
      showNotification("Failed to delete group: " + error.message, "error");
    }
  };

  const copyGroupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showNotification("Group code copied to clipboard!", "success");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="flex flex-col items-center space-y-4 animate-fade-in-up">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-primary-600">
              F
            </div>
          </div>
          <p className="text-sm text-neutral-500">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              notification.type === "success"
                ? "bg-success-600 text-white"
                : "bg-danger-600 text-white"
            }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Group Wallet</h1>
          <p className="text-neutral-500 mt-2">
            Manage shared expenses with friends, family, or teams
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            icon={<UserPlus size={20} />}
            onClick={() => setShowJoinModal(true)}
            className="shadow-sm hover:shadow-md transition-all duration-200"
          >
            Join Group
          </Button>
          <Button
            variant="gradient"
            icon={<Plus size={20} />}
            onClick={() => setShowCreateModal(true)}
            className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Create Group
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center justify-between p-4 bg-white border border-gray-300 shadow-sm rounded-lg">
          <div>
            <p className="text-sm font-medium text-neutral-500">Total Groups</p>
            <p className="text-2xl font-bold text-primary-600">
              {groups.length}
            </p>
          </div>
          <div className="p-3 bg-primary-100 rounded-full">
            <Users className="text-primary-600" size={24} />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-white border border-gray-300 shadow-sm rounded-lg">
          <div>
            <p className="text-sm font-medium text-neutral-500">
              Active Groups
            </p>
            <p className="text-2xl font-bold text-success-600">
              {groups.length}
            </p>
          </div>
          <div className="p-3 bg-success-100 rounded-full">
            <Settings className="text-success-600" size={24} />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-white border border-gray-300 shadow-sm rounded-lg">
          <div>
            <p className="text-sm font-medium text-neutral-500">
              Total Members
            </p>
            <p className="text-2xl font-bold text-neutral-800">
              {groups.reduce(
                (sum, group) =>
                  sum + (group._group_members_count?.[0]?.count || 0),
                0
              )}
            </p>
          </div>
          <div className="p-3 bg-neutral-100 rounded-full">
            <Users className="text-neutral-600" size={24} />
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <Card variant="glass" className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-neutral-800 mb-2">
              No groups yet
            </h3>
            <p className="text-neutral-600 mb-6">
              Create your first group or join an existing one to start managing
              shared expenses.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowJoinModal(true)}
                icon={<UserPlus size={16} />}
              >
                Join Group
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                icon={<Plus size={16} />}
              >
                Create Group
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  variant="glass"
                  className="group hover:shadow-lg shadow-md transition-all duration-300 cursor-pointer border border-slate-300 hover:border-primary-400"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mr-3">
                          <Users className="text-primary-600" size={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-800 group-hover:text-primary-600 transition-colors">
                            {group.name}
                          </h3>
                          <p className="text-sm text-neutral-500">
                            {group._group_members_count?.[0]?.count || 0}{" "}
                            members
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye size={16} />}
                          className="text-neutral-400 hover:text-primary-600"
                          onClick={() => navigate(`/grp/${group.id}`)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          className="text-neutral-400 hover:text-danger-600"
                          onClick={() =>
                            handleDeleteGroup(group.id, group.name)
                          }
                        />
                      </div>
                    </div>

                    {/* {group.description && (
                      <p className="text-sm text-neutral-600 mb-4">
                        {group.description}
                      </p>
                    )} */}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-500">
                          Group Code
                        </span>
                        <div className="flex items-center space-x-2">
                          <code className="bg-neutral-100 px-2 py-1 rounded text-sm font-mono">
                            {group.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Copy size={14} />}
                            className="text-neutral-400 hover:text-primary-600"
                            onClick={() => copyGroupCode(group.code)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-500">
                          Created
                        </span>
                        <span className="text-sm text-neutral-700">
                          {format(new Date(group.created_at), "MMM dd, yyyy")}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-neutral-200">
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/group/${group.id}`)}
                            className="flex-1"
                            icon={<Eye size={16} />}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleLeaveGroup(group.id, group.name)
                            }
                            className="flex-1"
                            icon={<LogOut size={16} />}
                          >
                            Leave
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Group Modal */}
      <Modal
        open={showCreateModal}
        title="Create New Group"
        onClose={() => setShowCreateModal(false)}
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              placeholder="Enter group name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={createForm.description}
              onChange={(e) =>
                setCreateForm({ ...createForm, description: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              placeholder="What's this group for?"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              isLoading={submitting}
              className="flex-1"
            >
              Create Group
            </Button>
          </div>
        </form>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        open={showJoinModal}
        title="Join Group"
        onClose={() => setShowJoinModal(false)}
      >
        <form onSubmit={handleJoinGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Group Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 font-mono"
              placeholder="Enter 6-character code"
              maxLength={6}
              required
            />
            <p className="text-sm text-neutral-500 mt-2">
              Ask a group member for the 6-character group code
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowJoinModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              isLoading={submitting}
              className="flex-1"
            >
              Join Group
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Groups;
