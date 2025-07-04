/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useBudget } from "../contexts/BudgetContext";
import { useCategories } from "../contexts/CategoriesContext";
import { useAuth } from "../contexts/AuthContext";
import { format, addMonths } from "date-fns";
import { PlusCircle, Pencil, Trash } from "lucide-react";

function Budget() {
  const { user } = useAuth();
  const { budgets, addBudget, updateBudget, deleteBudget, getBudgetSummary } =
    useBudget();
  const { getExpenseCategories, getCategoryById } = useCategories();

  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

  const [budgetForm, setBudgetForm] = useState({
    categoryId: "",
    amount: "",
    month: format(new Date(), "yyyy-MM"),
  });

  const expenseCategories = getExpenseCategories();
  const currentMonth = format(new Date(), "yyyy-MM");
  const nextMonth = format(addMonths(new Date(), 1), "yyyy-MM");

  const currentMonthSummary = getBudgetSummary(currentMonth);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBudgetForm((prev) => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setBudgetForm({
      categoryId: "",
      amount: "",
      month: currentMonth,
    });
    setIsAddingBudget(true);
  };

  const openEditForm = (budget: any) => {
    setBudgetForm({
      categoryId: budget.category_id,
      amount: budget.amount.toString(),
      month: budget.month,
    });
    setEditingBudgetId(budget.id);
    setIsEditingBudget(true);
  };

  const closeForm = () => {
    setIsAddingBudget(false);
    setIsEditingBudget(false);
    setEditingBudgetId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetForm.amount);
    if (!amount || !budgetForm.categoryId || !budgetForm.month) return;

    if (editingBudgetId) {
      await updateBudget(editingBudgetId, {
        category_id: budgetForm.categoryId,
        amount,
        month: budgetForm.month,
      });
    } else {
      await addBudget({
        category_id: budgetForm.categoryId,
        amount,
        month: budgetForm.month,
      });
    }

    closeForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this budget?")) {
      await deleteBudget(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: user?.currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => Math.round(value) + "%";

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "bg-danger-500";
    if (percentage >= 75) return "bg-warning-500";
    return "bg-success-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Budget Planning</h1>
        <button onClick={openAddForm} className="btn-primary">
          <PlusCircle size={16} className="mr-1" />
          Add Budget
        </button>
      </div>

      {(isAddingBudget || isEditingBudget) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 animate-slide-up">
            <h2 className="text-xl font-semibold mb-4">
              {editingBudgetId ? "Edit Budget" : "Add New Budget"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="categoryId" className="form-label">
                    Category
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    className="select-field"
                    value={budgetForm.categoryId}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a category</option>
                    {expenseCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="amount" className="form-label">
                    Budget Amount
                  </label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    required
                    className="input-field"
                    placeholder="0"
                    value={budgetForm.amount}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="month" className="form-label">
                    Month
                  </label>
                  <select
                    id="month"
                    name="month"
                    required
                    className="select-field"
                    value={budgetForm.month}
                    onChange={handleInputChange}
                  >
                    <option value={currentMonth}>
                      {format(new Date(currentMonth + "-01"), "MMMM yyyy")}{" "}
                      (Current)
                    </option>
                    <option value={nextMonth}>
                      {format(new Date(nextMonth + "-01"), "MMMM yyyy")} (Next)
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingBudgetId ? "Update" : "Add"} Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Summary */}
      <div className="card p-6">
        <div className="flex justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Overall Budget</h2>
            <p className="text-sm text-gray-500">
              Month of {format(new Date(currentMonth + "-01"), "MMMM yyyy")}
            </p>
          </div>
          <p className="text-lg font-semibold">
            {formatCurrency(currentMonthSummary.totalSpent)} /{" "}
            {formatCurrency(currentMonthSummary.totalBudget)}
          </p>
        </div>

        <div className="relative pt-1">
          <div className="flex justify-between text-sm mb-2">
            <span>{formatPercentage(currentMonthSummary.percentage)} used</span>
            <span>
              {formatCurrency(currentMonthSummary.remaining)} remaining
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              style={{
                width: `${Math.min(currentMonthSummary.percentage, 100)}%`,
              }}
              className={`h-full ${getStatusColor(
                currentMonthSummary.percentage
              )}`}
            ></div>
          </div>
        </div>
      </div>

      {/* Category Budgets */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Category Budgets</h2>
        <div className="grid gap-4">
          {Object.entries(currentMonthSummary.categories).map(
            ([categoryId, data]) => {
              const category = getCategoryById(categoryId);
              if (!category) return null;

              const matchedBudget = budgets.find(
                (b) => b.category_id === categoryId && b.month === currentMonth
              );

              return (
                <div key={categoryId} className="card p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 flex items-center justify-center rounded-full"
                        style={{
                          backgroundColor: category.color + "20",
                          color: category.color,
                        }}
                      >
                        {category.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(data.spent)} of{" "}
                          {formatCurrency(data.budget)} used
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {matchedBudget && (
                        <>
                          <button
                            onClick={() => openEditForm(matchedBudget)}
                            className="btn-sm btn-outline"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(matchedBudget.id)}
                            className="btn-sm btn-danger"
                          >
                            <Trash size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStatusColor(data.percentage)}`}
                      style={{ width: `${Math.min(data.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatPercentage(data.percentage)} used</span>
                    <span>{formatCurrency(data.remaining)} left</span>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

export default Budget;
