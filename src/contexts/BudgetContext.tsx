import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useTransactions } from "./TransactionsContext";
import { api } from "../lib/api";
import { Budget } from "../types";
import { toast } from "sonner";

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentage: number;
  categories: {
    [categoryId: string]: {
      budget: number;
      spent: number;
      remaining: number;
      percentage: number;
    };
  };
}

interface BudgetContextType {
  budgets: Budget[];
  addBudget: (budget: { category_id: string; amount: number; month: string }) => Promise<Budget>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  refreshBudgets: () => Promise<void>;
  getBudgetByCategory: (categoryId: string, month: string) => Budget | undefined;
  getBudgetSummary: (month: string) => BudgetSummary;
  isLoading: boolean;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
}

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { getTransactionsByMonth } = useTransactions();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBudgets = useCallback(async () => {
    if (!user) {
      setBudgets([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await api.budgets.list();
      setBudgets(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load budgets");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const addBudget = async (budget: {
    category_id: string;
    amount: number;
    month: string;
  }): Promise<Budget> => {
    try {
      const saved = await api.budgets.upsert(budget);
      setBudgets((prev) => {
        const index = prev.findIndex((b) => b.category_id === budget.category_id && b.month === budget.month);
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = saved;
          return copy;
        }
        return [...prev, saved];
      });
      toast.success("Budget saved!");
      return saved;
    } catch (error: any) {
      toast.error(error.message || "Failed to save budget");
      throw error;
    }
  };

  const updateBudget = async (_id: string, budget: Partial<Budget>): Promise<void> => {
    if (budget.category_id && budget.amount && budget.month) {
      await addBudget({
        category_id: budget.category_id,
        amount: budget.amount,
        month: budget.month,
      });
    }
  };

  const deleteBudget = async (id: string): Promise<void> => {
    try {
      await api.budgets.delete(id);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      toast.success("Budget deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete budget");
      throw error;
    }
  };

  const getBudgetByCategory = (categoryId: string, month: string): Budget | undefined => {
    return budgets.find((b) => b.category_id === categoryId && b.month === month);
  };

  const getBudgetSummary = (month: string): BudgetSummary => {
    const monthlyBudgets = budgets.filter((b) => b.month === month);

    const [year, monthNum] = month.split("-").map((n) => parseInt(n, 10));
    const startDate = new Date(year, (monthNum || 1) - 1, 1);
    const monthlyTransactions = getTransactionsByMonth(startDate);

    const summary: BudgetSummary = {
      totalBudget: 0,
      totalSpent: 0,
      remaining: 0,
      percentage: 0,
      categories: {},
    };

    summary.totalBudget = monthlyBudgets.reduce((total, b) => total + Number(b.amount), 0);

    monthlyBudgets.forEach((b) => {
      summary.categories[b.category_id] = {
        budget: Number(b.amount),
        spent: 0,
        remaining: Number(b.amount),
        percentage: 0,
      };
    });

    monthlyTransactions.forEach((tx) => {
      if (tx.type === "expense" && tx.category_id && summary.categories[tx.category_id]) {
        const amount = Number(tx.amount);
        summary.totalSpent += amount;

        const cat = summary.categories[tx.category_id];
        cat.spent += amount;
        cat.remaining = cat.budget - cat.spent;
        cat.percentage = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
      }
    });

    summary.remaining = summary.totalBudget - summary.totalSpent;
    summary.percentage =
      summary.totalBudget > 0 ? (summary.totalSpent / summary.totalBudget) * 100 : 0;

    return summary;
  };

  return (
    <BudgetContext.Provider
      value={{
        budgets,
        addBudget,
        updateBudget,
        deleteBudget,
        refreshBudgets: loadBudgets,
        getBudgetByCategory,
        getBudgetSummary,
        isLoading,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}
