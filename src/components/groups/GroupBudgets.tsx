/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Target,
  TrendingUp,
  AlertTriangle,
  Edit3,
  Trash2,
} from "lucide-react";
import { format, endOfMonth } from "date-fns";
import { groupService } from "../../services/groupService";
import { toast, Toaster } from "react-hot-toast";
import Button from "../ui/Button";
import Card from "../ui/Card";
// import Badge from "../ui/Badge";

interface GroupBudget {
  id: string;
  group_id: string;
  category_id: string;
  amount: number;
  period: "Monthly" | "Weekly" | "Quarterly" | "Yearly";
  start_date: string;
  created_by: string;
  created_at: string;
  group_categories?: {
    name: string;
    color: string;
    icon: string;
  };
  spent?: number;
}

interface GroupBudgetsProps {
  groupId: string;
  isPreview?: boolean;
}

const GroupBudgets: React.FC<GroupBudgetsProps> = ({
  groupId,
  isPreview = false,
}) => {
  const [budgets, setBudgets] = useState<GroupBudget[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<GroupBudget | null>(null);

  // Form state
  const [budgetForm, setBudgetForm] = useState({
    category_id: "",
    amount: "",
    period: "Monthly" as "Monthly" | "Weekly" | "Quarterly" | "Yearly",
    start_date: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    if (groupId) {
      loadBudgets();
      loadCategories();
    }
  }, [groupId]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await groupService.getGroupBudgets(groupId);

      // Calculate spent amounts for each budget
      const budgetsWithSpent = await Promise.all(
        data.map(async (budget) => {
          const spent = await calculateSpentAmount(budget);
          return { ...budget, spent };
        })
      );

      setBudgets(budgetsWithSpent);
    } catch (error) {
      console.error("Error loading budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await groupService.getGroupCategories(groupId);
      setCategories(data.filter((cat) => cat.type === "expense"));
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const calculateSpentAmount = async (budget: GroupBudget): Promise<number> => {
    try {
      const transactions = await groupService.getGroupTransactions(groupId);

      const startDate = new Date(budget.start_date);
      let endDate: Date;

      switch (budget.period) {
        case "Weekly":
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
          break;
        case "Monthly":
          endDate = endOfMonth(startDate);
          break;
        case "Quarterly":
          endDate = new Date(startDate);
          endDate.setMonth(startDate.getMonth() + 3);
          break;
        case "Yearly":
          endDate = new Date(startDate);
          endDate.setFullYear(startDate.getFullYear() + 1);
          break;
        default:
          endDate = endOfMonth(startDate);
      }

      const spent = transactions
        .filter(
          (t) =>
            t.category_id === budget.category_id &&
            t.type === "expense" &&
            new Date(t.transaction_date) >= startDate &&
            new Date(t.transaction_date) <= endDate
        )
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return spent;
    } catch (error) {
      console.error("Error calculating spent amount:", error);
      return 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetForm.category_id || !budgetForm.amount) return;

    try {
      const budgetData = {
        ...budgetForm,
        amount: parseFloat(budgetForm.amount),
      };

      if (editingBudget) {
        await groupService.updateGroupBudget(editingBudget.id, budgetData);
      } else {
        await groupService.createGroupBudget(groupId, budgetData);
      }

      setShowAddModal(false);
      setEditingBudget(null);
      setBudgetForm({
        category_id: "",
        amount: "",
        period: "Monthly",
        start_date: format(new Date(), "yyyy-MM-dd"),
      });

      await loadBudgets();
    } catch (error: any) {
      console.error("Error saving budget:", error);
      toast.error("Failed to save budget: " + error.message);
    }
  };

  const handleEdit = (budget: GroupBudget) => {
    setEditingBudget(budget);
    setBudgetForm({
      category_id: budget.category_id,
      amount: budget.amount.toString(),
      period: budget.period,
      start_date: budget.start_date,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (budgetId: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;

    try {
      await groupService.deleteGroupBudget(budgetId);
      await loadBudgets();
    } catch (error: any) {
      console.error("Error deleting budget:", error);
      toast.error("Failed to delete budget: " + error.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getBudgetStatus = (budget: GroupBudget) => {
    const spent = budget.spent || 0;
    const percentage = (spent / budget.amount) * 100;

    if (percentage > 100)
      return { status: "over", color: "danger", icon: AlertTriangle };
    if (percentage >= 80)
      return { status: "warning", color: "warning", icon: TrendingUp };
    return { status: "good", color: "success", icon: Target };
  };

  if (loading) {
    return (
      <div className=" flex justify-center items-center bg-white duration-300">
        <div className="flex flex-col items-center space-y-4 animate-fade-in-up">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin-fast"></div>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-primary-600">
              F
            </div>
          </div>
          <p className="text-sm text-white/90">Loading admin data....</p>
        </div>
      </div>
    );
  }

  const displayBudgets = isPreview ? budgets.slice(0, 3) : budgets;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      {!isPreview && (
        <div className="flex items-center justify-between">
          <div>
            {/* <h3 className="text-lg font-semibold text-neutral-800">
              Group Budgets
            </h3> */}
            <p className="text-sm text-neutral-500">
              Track and manage group spending limits
            </p>
          </div>
          <Button
            variant="gradient"
            icon={<Plus size={16} />}
            onClick={() => setShowAddModal(true)}
          >
            Add Budget
          </Button>
        </div>
      )}

      {displayBudgets.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target size={32} className="text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-800 mb-2">
            No budgets set
          </h3>
          <p className="text-neutral-600 mb-4">
            Create budgets to track group spending limits
          </p>
          {!isPreview && (
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
              icon={<Plus size={16} />}
            >
              Create First Budget
            </Button>
          )}
        </div>
      ) : (
        <div className=" grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-2">
          <AnimatePresence>
            {displayBudgets.map((budget, index) => {
              const {
                status,
                color,
                icon: StatusIcon,
              } = getBudgetStatus(budget);
              const percentage = Math.min(
                ((budget.spent || 0) / budget.amount) * 100,
                100
              );

              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="border border-neutral-400 rounded-xl p-5 sm:p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 group">
                    <div className="flex items-start justify-between mb-5 ">
                      <div className="flex items-center ">
                        <div
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-xl mr-4"
                          style={{
                            backgroundColor: `${budget.group_categories?.color}20`,
                            color: budget.group_categories?.color,
                          }}
                        >
                          {budget.group_categories?.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-neutral-800 text-base sm:text-lg">
                            {budget.group_categories?.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-neutral-500">
                            {budget.period}
                          </p>
                        </div>
                      </div>

                      {!isPreview && (
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            variant="ghost"
                            size="icon"
                            icon={<Edit3 size={16} />}
                            onClick={() => handleEdit(budget)}
                            className="text-neutral-400 hover:text-primary-600"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            icon={<Trash2 size={16} />}
                            onClick={() => handleDelete(budget.id)}
                            className="text-neutral-400 hover:text-danger-600"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-neutral-500">Spent</span>
                        <span className="font-medium">
                          {formatCurrency(budget.spent || 0)}
                        </span>
                      </div>

                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <motion.div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            status === "over"
                              ? "bg-danger-500"
                              : status === "warning"
                              ? "bg-warning-500"
                              : "bg-success-500"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                        />
                      </div>

                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-neutral-500">Budget</span>
                        <span className="font-medium">
                          {formatCurrency(budget.amount)}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs sm:text-sm text-neutral-500">
                        <span>Remaining</span>
                        <span
                          className={
                            budget.spent && budget.spent > budget.amount
                              ? "text-danger-600"
                              : ""
                          }
                        >
                          {formatCurrency(
                            Math.max(0, budget.amount - (budget.spent || 0))
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Budget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">
              {editingBudget ? "Edit Budget" : "Add Budget"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Category
                </label>
                <select
                  value={budgetForm.category_id}
                  onChange={(e) =>
                    setBudgetForm({
                      ...budgetForm,
                      category_id: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Budget Amount
                </label>
                <input
                  type="number"
                  value={budgetForm.amount}
                  onChange={(e) =>
                    setBudgetForm({ ...budgetForm, amount: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter budget amount"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Period
                </label>
                <select
                  value={budgetForm.period}
                  onChange={(e) =>
                    setBudgetForm({
                      ...budgetForm,
                      period: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={budgetForm.start_date}
                  onChange={(e) =>
                    setBudgetForm({ ...budgetForm, start_date: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingBudget(null);
                    setBudgetForm({
                      category_id: "",
                      amount: "",
                      period: "Monthly",
                      start_date: format(new Date(), "yyyy-MM-dd"),
                    });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" className="flex-1">
                  {editingBudget ? "Update Budget" : "Create Budget"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupBudgets;
