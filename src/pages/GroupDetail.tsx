/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Copy,
  ArrowUp,
  ArrowDown,
  CreditCard,
  Split,
  Download,
  Trash2,
  Search,
  Filter,
  Calendar,
  Tag,
  Target,
} from "lucide-react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { groupService } from "../services/groupService";
import TransactionSplitModal from "../components/groups/TransactionSplitModal";
import { Group, GroupTransaction, GroupCategory } from "../utils/group";
import GroupBudgets from "../components/groups/GroupBudgets";
import { useGroupCategories } from "../hooks/useGroup";

const GroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  // State management
  const [group, setGroup] = useState<Group | null>(null);
  const [transactions, setTransactions] = useState<GroupTransaction[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categories, setCategories] = useState<GroupCategory[]>([]);
  const { addCategory } = useGroupCategories(
    groupId!
  );
  const [personalCategories, setPersonalCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [showBudgets, setShowBudgets] = useState(false);

  // Modal states
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<GroupTransaction | null>(null);


  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("this-month");

  const [members, setMembers] = useState<any[]>([]);
  // const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    loadGroupMembers();
  }, [groupId]);

  // Form state
  const [transactionForm, setTransactionForm] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    description: "",
    category_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Load data on component mount
  useEffect(() => {
    if (groupId) {
      loadAllData();
    }
  }, [groupId]);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    color: "#3B82F6",
    icon: "💰",
  });

  const PRESET_COLORS = [
    "#EF4444",
    "#F97316",
    "#F59E0B",
    "#EAB308",
    "#84CC16",
    "#22C55E",
    "#10B981",
    "#14B8A6",
    "#06B6D4",
    "#0EA5E9",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#A855F7",
    "#D946EF",
    "#EC4899",
    "#F43F5E",
    "#64748B",
  ];

  const PRESET_ICONS = [
    "💰",
    "💵",
    "💳",
    "🏦",
    "📊",
    "📈",
    "🛒",
    "🍔",
    "🚗",
    "🏠",
    "⚡",
    "🎬",
    "🎮",
    "👕",
    "💊",
    "✈️",
    "📱",
    "💻",
    "📚",
    "🎵",
  ];

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadGroupData(),
        loadTransactions(),
        loadCategories(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      showNotification("Failed to load group data", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadGroupData = async () => {
    try {
      const groupData = await groupService.getGroup(groupId!);
      setGroup(groupData);
    } catch (error) {
      console.error("Error loading group:", error);
      throw error;
    }
  };

  const loadTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const transactionData = await groupService.getGroupTransactions(groupId!);
      setTransactions(transactionData);
    } catch (error) {
      console.error("Error loading transactions:", error);
      throw error;
    } finally {
      setTransactionsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoryData = await groupService.getGroupCategories(groupId!);
      setCategories(categoryData);
    } catch (error) {
      console.error("Error loading categories:", error);
      // Don't throw here as categories might not exist yet
    }
  };

  const loadPersonalCategories = async () => {
    try {
      const { data } = await groupService.supabase
        .from("categories")
        .select("*")
        .order("name");
      setPersonalCategories(data || []);
    } catch (error) {
      console.error("Error loading personal categories:", error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    try {
      await addCategory(categoryForm);

      setShowAddCategory(false);
      setCategoryForm({
        name: "",
        type: "expense",
        color: "#3B82F6",
        icon: "💰",
      });

      showNotification("Category added successfully!", "success");
    } catch (error: any) {
      showNotification("Failed to add category: " + error.message, "error");
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionForm.amount || !transactionForm.description) return;

    try {
      await groupService.createGroupTransaction(groupId!, {
        ...transactionForm,
        amount: parseFloat(transactionForm.amount),
      });

      setShowAddTransaction(false);
      setTransactionForm({
        type: "expense",
        amount: "",
        description: "",
        category_id: "",
        date: format(new Date(), "yyyy-MM-dd"),
      });

      await loadTransactions();
      showNotification("Transaction added successfully!", "success");
    } catch (error: any) {
      showNotification("Failed to add transaction: " + error.message, "error");
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await groupService.deleteGroupTransaction(transactionId);
      await loadTransactions();
      showNotification("Transaction deleted successfully!", "success");
    } catch (error: any) {
      showNotification(
        "Failed to delete transaction: " + error.message,
        "error"
      );
    }
  };

  const handleCopyToPersonal = async (personalCategoryId: string) => {
    if (!selectedTransaction) return;

    try {
      await groupService.copyTransactionToPersonal(
        selectedTransaction.id,
        personalCategoryId
      );
      setShowCopyModal(false);
      setSelectedTransaction(null);
      showNotification(
        "Transaction copied to your personal wallet!",
        "success"
      );
    } catch (error: any) {
      showNotification("Failed to copy transaction: " + error.message, "error");
    }
  };

  const openCopyModal = async (transaction: GroupTransaction) => {
    setSelectedTransaction(transaction);
    await loadPersonalCategories();
    setShowCopyModal(true);
  };

  const copyGroupCode = () => {
    if (group) {
      navigator.clipboard.writeText(group.code);
      showNotification("Group code copied to clipboard!", "success");
    }
  };

  const loadGroupMembers = async () => {
    try {
      setLoading(true);
      const data = await groupService.getGroupMembers(groupId as string);

      const membersList = data.map((member) => ({
        id: member.user_id,
        name:
          member.users?.full_name?.trim() ||
          member.users?.email?.split("@")[0] ||
          "Unknown",
        email: member.users?.email || "",
        role: member.role || "member",
      }));

      setMembers(membersList);
    } catch (error) {
      console.error("Error loading group members:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Filter transactions
  const filterTransactions = () => {
    return transactions.filter((transaction) => {
      // Search term filter
      if (
        searchTerm &&
        !transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      if (categoryFilter && transaction.category_id !== categoryFilter) {
        return false;
      }

      // Type filter
      if (typeFilter && transaction.type !== typeFilter) {
        return false;
      }

      // Date filter
      if (dateFilter) {
        const date = parseISO(transaction.created_at);
        let filterStart, filterEnd;

        switch (dateFilter) {
          case "this-month":
            filterStart = startOfMonth(new Date());
            filterEnd = endOfMonth(new Date());
            break;
          case "last-month":
            filterStart = startOfMonth(subMonths(new Date(), 1));
            filterEnd = endOfMonth(subMonths(new Date(), 1));
            break;
          case "last-3-months":
            filterStart = startOfMonth(subMonths(new Date(), 2));
            filterEnd = endOfMonth(new Date());
            break;
          default:
            return true;
        }

        if (date < filterStart || date > filterEnd) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredCategories = categories.filter(
    (cat) => cat.type === transactionForm.type
  );

  const filteredTransactions = filterTransactions();

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      income,
      expense,
      balance: income - expense,
      membersCount: group?.group_members?.length || members.length || 0
    };
  }, [filteredTransactions, group, members]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-sky dark:bg-gray-900 transition-colors duration-300">
        <div className="flex flex-col items-center space-y-4 animate-fade-in-up">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <Card className="text-center py-16">
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">
          Group not found
        </h2>
        <p className="text-neutral-600 mb-4">
          The group you're looking for doesn't exist or you don't have access to
          it.
        </p>
        <Button variant="primary" onClick={() => navigate("/grp")}>
          Back to Groups
        </Button>
      </Card>
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-4">
            {/* <Button
              variant="ghost"
              icon={<ArrowLeft size={20} />}
              onClick={() => navigate("/grp")}
            >
              Back
            </Button> */}
            <Button
              variant="outline"
              icon={<Plus size={20} />}
              onClick={() => setShowAddCategory(true)}
            >
              Add Category
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-neutral-800">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-neutral-500">{group.description}</p>
              )}
            </div>
          </div>

          {/* 🧑 Group Member Names */}
          <div className="flex flex-wrap gap-2 mt-2">
            {members.map((member) => (
              <span
                key={member.id}
                className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full border border-primary-200"
              >
                {member.role === "admin" && (
                  <span
                    className="mr-1"
                    aria-label="Group Admin"
                    title="Group Admin"
                  >
                    👑
                  </span>
                )}
                {member.name || member.email?.split("@")[0] || "Unknown"}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <code className="bg-neutral-100 px-3 py-2 rounded-lg text-sm font-mono">
              {group.code}
            </code>
            <Button
              variant="outline"
              size="sm"
              icon={<Copy size={16} />}
              onClick={copyGroupCode}
            >
              Copy Code
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              icon={<Target size={20} />}
              onClick={() => setShowBudgets(true)}
            >
              Budgets
            </Button>
          </div>
          <Button
            variant="gradient"
            icon={<Plus size={20} />}
            onClick={() => setShowAddTransaction(true)}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-800 border-neutral-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
              <ArrowUp size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(stats.income)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 border-neutral-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3">
              <ArrowDown size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(stats.expense)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 border-neutral-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
              <CreditCard size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Net Balance</p>
              <p
                className={`text-lg font-semibold ${
                  stats.balance >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(stats.balance)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 border-neutral-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
              <Users size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Group Members</p>
              <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                {stats.membersCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Group Members Section
      <CollapsibleSection title="Group Members" defaultOpen={true}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200 hover:shadow transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                  {member.name[0]?.toUpperCase() || <User size={20} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-800">
                    {member.name}
                  </p>
                  <p className="text-xs text-neutral-500 capitalize">
                    {member.role}
                  </p>
                  <p className="text-xs text-neutral-400">{member.email}</p>
                </div>
              </div>
              {member.role !== "admin" && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<UserMinus size={16} />}
                  className="text-neutral-400 hover:text-danger-600 transition-colors"
                  aria-label="Remove user"
                />
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection> */}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag size={18} className="text-gray-400" />
            </div>
            <select
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={18} className="text-gray-400" />
            </div>
            <select
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={18} className="text-gray-400" />
            </div>
            <select
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="">All Time</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="last-3-months">Last 3 Months</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      <Card className="overflow-hidden">
        {transactionsLoading ? (
          <div className="p-12 text-center text-gray-500">
            Loading transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <CreditCard size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No transactions found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || categoryFilter || typeFilter || dateFilter
                ? "Try adjusting your filters to see more transactions."
                : "Get started by adding your first transaction."}
            </p>
            <Button
              variant="primary"
              onClick={() => setShowAddTransaction(true)}
              icon={<Plus size={16} />}
            >
              Add First Transaction
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Added By
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </div>
                        <div
                          className={`text-xs ${
                            transaction.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <p>
                        {transaction.created_by_user?.full_name ||
                          transaction.created_by_user?.email?.split("@")[0] ||
                          "Unknown User"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {format(
                        new Date(transaction.created_at),
                        "MMM d, yyyy, h:mm a"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span
                        className={`font-semibold ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Download size={14} />}
                          onClick={() => openCopyModal(transaction)}
                          title="Copy to personal wallet"
                          className="text-gray-400 hover:text-primary-600"
                        >
                          {" "}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Split size={14} />}
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowSplitModal(true);
                          }}
                          title="Split transaction"
                          className="text-gray-400 hover:text-blue-600"
                        >
                          {" "}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={14} />}
                          onClick={() =>
                            handleDeleteTransaction(transaction.id)
                          }
                          title="Delete transaction"
                          className="text-gray-400 hover:text-red-600"
                        >
                          {" "}
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Transaction Modal */}
      <Modal
        open={showAddTransaction}
        title="Add Group Transaction"
        onClose={() => setShowAddTransaction(false)}
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Transaction Type
            </label>
            <div className="flex gap-2">
              {["income", "expense"].map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={
                    transactionForm.type === type
                      ? type === "income"
                        ? "success"
                        : "danger"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setTransactionForm((prev) => ({
                      ...prev,
                      type: type as "income" | "expense",
                    }))
                  }
                  className="flex-1 capitalize"
                >
                  {type === "income" ? "💰" : "💸"} {type}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Category
            </label>
            <select
              value={transactionForm.category_id}
              onChange={(e) =>
                setTransactionForm({
                  ...transactionForm,
                  category_id: e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              required
            >
              <option value="">Select a category</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={transactionForm.amount}
              onChange={(e) =>
                setTransactionForm({
                  ...transactionForm,
                  amount: e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              placeholder="Enter amount"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={transactionForm.description}
              onChange={(e) =>
                setTransactionForm({
                  ...transactionForm,
                  description: e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              placeholder="Enter description"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={transactionForm.date}
              onChange={(e) =>
                setTransactionForm({
                  ...transactionForm,
                  date: e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddTransaction(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" variant="gradient" className="flex-1">
              Add Transaction
            </Button>
          </div>
        </form>
      </Modal>

      {/* Copy to Personal Modal */}
      <Modal
        open={showCopyModal}
        title="Copy to Personal Wallet"
        onClose={() => setShowCopyModal(false)}
      >
        <div className="space-y-4">
          {selectedTransaction && (
            <div className="p-4 bg-neutral-50 rounded-lg">
              <h4 className="font-medium text-neutral-800 mb-2">
                Transaction to Copy
              </h4>
              <p className="text-sm text-neutral-600">
                {selectedTransaction.description} -{" "}
                {formatCurrency(selectedTransaction.amount)}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Select Personal Category
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {personalCategories
                .filter((cat) => cat.type === selectedTransaction?.type)
                .map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCopyToPersonal(category.id)}
                    className="w-full p-3 text-left border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm mr-3"
                        style={{
                          backgroundColor: category.color + "20",
                          color: category.color,
                        }}
                      >
                        {category.icon}
                      </span>
                      <span className="font-medium text-neutral-800">
                        {category.name}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCopyModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      {/* Budget Modal */}
      <Modal
        open={showBudgets}
        title="Group Budgets"
        onClose={() => setShowBudgets(false)}
      >
        <div className="max-w-4xl">
          <GroupBudgets groupId={groupId!} />
        </div>
      </Modal>

      {/* Cateegory Modal */}
      {/* Add Category Modal */}
      <Modal
        open={showAddCategory}
        title="Add Category"
        onClose={() => setShowAddCategory(false)}
      >
        <form onSubmit={handleAddCategory} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Category Name
            </label>
            <input
              type="text"
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, name: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              placeholder="Enter category name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Category Type
            </label>
            <div className="flex gap-2">
              {["income", "expense"].map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={
                    categoryForm.type === type
                      ? type === "income"
                        ? "success"
                        : "danger"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setCategoryForm({
                      ...categoryForm,
                      type: type as "income" | "expense",
                    })
                  }
                  className="flex-1 capitalize"
                >
                  {type === "income" ? "💰" : "💸"} {type}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Color
            </label>
            <div className="grid grid-cols-9 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                    categoryForm.color === color
                      ? "border-neutral-400 scale-110"
                      : "border-neutral-200 hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCategoryForm({ ...categoryForm, color })}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-10 gap-2">
              {PRESET_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-lg transition-all duration-200 ${
                    categoryForm.icon === icon
                      ? "border-primary-400 bg-primary-50 scale-110"
                      : "border-neutral-200 hover:scale-105 hover:bg-neutral-50"
                  }`}
                  onClick={() => setCategoryForm({ ...categoryForm, icon })}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddCategory(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" variant="gradient" className="flex-1">
              Add Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transaction Split Modal */}
      <TransactionSplitModal
        open={showSplitModal}
        onClose={() => {
          setShowSplitModal(false);
          setSelectedTransaction(null);
        }}
        groupId={groupId!}
        categories={categories}
        existingTransaction={selectedTransaction}
        onTransactionAdded={() => {
          loadTransactions();
        }}
      />
    </div>
  );
};

export default GroupDetail;
