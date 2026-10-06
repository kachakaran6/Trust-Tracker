import React, { useState, useEffect } from "react";
import { useBudget } from "../contexts/BudgetContext";
import { useCategories } from "../contexts/CategoriesContext";
import { useAuth } from "../contexts/AuthContext";
import { formatMoney, formatCategory } from "../lib/format";
import { format, addMonths } from "date-fns";
import { usePageHeader } from "../contexts/PageHeaderContext";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card } from "../components/ui/Card";
import { Button, IconButton } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { ProgressBar } from "../components/ui/ProgressBar";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Modal } from "../components/ui/Modal";
import { Icons } from "../components/ui/icons";
import { Budget as BudgetType } from "../types";

export default function Budget() {
  const { user } = useAuth();
  const { setPageHeader } = usePageHeader();
  const { budgets, addBudget, updateBudget, deleteBudget, getBudgetSummary } =
    useBudget();
  const { getExpenseCategories, getCategoryById } = useCategories();

  useEffect(() => {
    setPageHeader("Budget Planning");
  }, [setPageHeader]);

  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetType | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentMonth = format(new Date(), "yyyy-MM");
  const nextMonth = format(addMonths(new Date(), 1), "yyyy-MM");
  const expenseCategories = getExpenseCategories();

  const [formCategory, setFormCategory] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMonth, setFormMonth] = useState(currentMonth);

  const currentMonthSummary = getBudgetSummary(currentMonth);
  const monthBudgets = budgets.filter((b) => b.month === currentMonth);

  const formatCurrency = (val: number) => formatMoney(val, user?.currency);

  const openAddForm = () => {
    setFormCategory(expenseCategories[0]?.id || "");
    setFormAmount("");
    setFormMonth(currentMonth);
    setEditingBudget(null);
    setIsAddingBudget(true);
  };

  const openEditForm = (b: BudgetType) => {
    setEditingBudget(b);
    setFormCategory(b.category_id);
    setFormAmount(String(b.amount));
    setFormMonth(b.month);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (!amount || !formCategory || !formMonth) return;

    if (editingBudget) {
      await updateBudget(editingBudget.id, {
        category_id: formCategory,
        amount,
        month: formMonth,
      });
      setEditingBudget(null);
    } else {
      await addBudget({
        category_id: formCategory,
        amount,
        month: formMonth,
      });
      setIsAddingBudget(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setIsDeleting(true);
      await deleteBudget(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Failed to delete budget:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets & Spending Limits"
        description="Set category spending thresholds to keep your cashflow in check and receive pace alerts."
        action={
          <Button
            variant="primary"
            icon={<Icons.Add size={16} />}
            onClick={openAddForm}
          >
            Add Budget
          </Button>
        }
      />

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Budget"
          value={formatCurrency(currentMonthSummary.totalBudget)}
          helperText={`Allocated for ${format(new Date(), "MMMM yyyy")}`}
          variant="neutral"
        />

        <StatCard
          label="Spent So Far"
          value={formatCurrency(currentMonthSummary.totalSpent)}
          helperText={`${Math.round(currentMonthSummary.percentage)}% consumed`}
          variant={currentMonthSummary.percentage >= 100 ? "danger" : currentMonthSummary.percentage >= 80 ? "warning" : "neutral"}
        />

        <StatCard
          label="Remaining Balance"
          value={formatCurrency(currentMonthSummary.remaining)}
          helperText="Available spending buffer"
          variant={currentMonthSummary.remaining < 0 ? "danger" : "success"}
        />

        <Card padding="sm" className="flex flex-col justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-[var(--text-muted)]">
              Overall Pace
            </p>
            <p className="text-xl sm:text-2xl font-semibold tracking-tight mt-1 text-[var(--text)] tabular-nums">
              {Math.round(currentMonthSummary.percentage)}%
            </p>
          </div>
          <div className="mt-2">
            <ProgressBar value={currentMonthSummary.percentage} max={100} />
          </div>
        </Card>
      </div>

      {/* Budgets List Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-[var(--text)]">
          Category Budgets ({monthBudgets.length})
        </h2>

        {monthBudgets.length === 0 ? (
          <EmptyState
            icon={<Icons.Budget size={24} />}
            title="No budgets configured"
            description="Create category budgets to track spending progress in real-time."
            action={
              <Button
                variant="primary"
                size="sm"
                icon={<Icons.Add size={16} />}
                onClick={openAddForm}
              >
                Add Your First Budget
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthBudgets.map((b) => {
              const category = getCategoryById(b.category_id);
              const spent = b.spent || 0;
              const pct = (spent / (b.amount || 1)) * 100;
              const remaining = b.amount - spent;

              return (
                <Card key={b.id} padding="md" className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--text)] shrink-0">
                        {category?.name ? category.name.charAt(0).toUpperCase() : "B"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[var(--text)] truncate">
                          {formatCategory(category?.name)}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {format(new Date(b.month + "-01"), "MMMM yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <IconButton
                        aria-label="Edit budget"
                        variant="ghost"
                        size="sm"
                        icon={<Icons.Edit size={14} />}
                        onClick={() => openEditForm(b)}
                      />
                      <IconButton
                        aria-label="Delete budget"
                        variant="danger-ghost"
                        size="sm"
                        icon={<Icons.Delete size={14} />}
                        onClick={() => setDeleteTargetId(b.id)}
                      />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <ProgressBar
                    value={spent}
                    max={b.amount}
                    showPercentage
                    label={`${formatCurrency(spent)} of ${formatCurrency(b.amount)}`}
                  />

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-[var(--border)] text-[var(--text-muted)]">
                    <span>
                      {remaining >= 0 ? "Remaining: " : "Over budget: "}
                      <strong
                        className={`tabular-nums ${
                          remaining < 0 ? "text-[var(--danger)]" : "text-[var(--text)]"
                        }`}
                      >
                        {formatCurrency(Math.abs(remaining))}
                      </strong>
                    </span>
                    <span className="tabular-nums font-medium">
                      {Math.round(pct)}% used
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Budget Modal */}
      <Modal
        open={isAddingBudget || Boolean(editingBudget)}
        onClose={() => {
          setIsAddingBudget(false);
          setEditingBudget(null);
        }}
        title={editingBudget ? "Edit Budget Limit" : "Create Category Budget"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Expense Category"
            required
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
          >
            <option value="">Select a category</option>
            {expenseCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {formatCategory(cat.name)}
              </option>
            ))}
          </Select>

          <Input
            label="Budget Amount"
            type="number"
            step="0.01"
            required
            placeholder="e.g. 5000"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
          />

          <Select
            label="Target Month"
            value={formMonth}
            onChange={(e) => setFormMonth(e.target.value)}
          >
            <option value={currentMonth}>
              Current Month ({format(new Date(), "MMMM yyyy")})
            </option>
            <option value={nextMonth}>
              Next Month ({format(addMonths(new Date(), 1), "MMMM yyyy")})
            </option>
          </Select>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddingBudget(false);
                setEditingBudget(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingBudget ? "Update Budget" : "Save Budget"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Budget"
        message="Are you sure you want to remove this category budget? Past transactions will remain intact."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
