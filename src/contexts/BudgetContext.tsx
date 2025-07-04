/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useTransactions } from "./TransactionsContext";
import { supabase, Budget } from "../lib/supabase";
// import { startOfMonth, endOfMonth, format } from "date-fns";

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
  addBudget: (
    budget: Omit<Budget, "id" | "user_id" | "created_at">
  ) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetByCategory: (
    categoryId: string,
    month: string
  ) => Budget | undefined;
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
  const { transactions, getTransactionsByMonth } = useTransactions();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBudgets();
    } else {
      setBudgets([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadBudgets = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error("Error loading budgets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addBudget = async (
    budget: Omit<Budget, "id" | "user_id" | "created_at">
  ) => {
    if (!user) return;

    try {
      const existingBudget = budgets.find(
        (b) => b.category_id === budget.category_id && b.month === budget.month
      );

      if (existingBudget) {
        return updateBudget(existingBudget.id, budget);
      }

      const { data, error } = await supabase
        .from("budgets")
        .insert([{ ...budget, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setBudgets((prev) => [...prev, data]);
    } catch (error) {
      console.error("Error adding budget:", error);
      throw error;
    }
  };

  const updateBudget = async (id: string, updatedFields: Partial<Budget>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("budgets")
        .update(updatedFields)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      setBudgets((prev) =>
        prev.map((budget) =>
          budget.id === id ? { ...budget, ...data } : budget
        )
      );
    } catch (error) {
      console.error("Error updating budget:", error);
      throw error;
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setBudgets((prev) => prev.filter((budget) => budget.id !== id));
    } catch (error) {
      console.error("Error deleting budget:", error);
      throw error;
    }
  };

  const getBudgetByCategory = (
    categoryId: string,
    month: string
  ): Budget | undefined => {
    return budgets.find(
      (budget) => budget.category_id === categoryId && budget.month === month
    );
  };

  const getBudgetSummary = (month: string): BudgetSummary => {
    const monthlyBudgets = budgets.filter((budget) => budget.month === month);

    const [year, monthNum] = month.split("-").map((n) => parseInt(n));
    const startDate = new Date(year, monthNum - 1, 1);
    const monthlyTransactions = getTransactionsByMonth(startDate);

    const summary: BudgetSummary = {
      totalBudget: 0,
      totalSpent: 0,
      remaining: 0,
      percentage: 0,
      categories: {},
    };

    summary.totalBudget = monthlyBudgets.reduce(
      (total, budget) => total + budget.amount,
      0
    );

    // ✅ PRE-FILL CATEGORIES with budget even if no spending
    monthlyBudgets.forEach((budget) => {
      summary.categories[budget.category_id] = {
        budget: budget.amount,
        spent: 0,
        remaining: budget.amount,
        percentage: 0,
      };
    });

    // Then calculate spending
    monthlyTransactions.forEach((transaction) => {
      if (transaction.type === "expense") {
        const budget = monthlyBudgets.find(
          (b) => b.category_id === transaction.category_id
        );
        if (!budget) return;

        summary.totalSpent += transaction.amount;

        const catSummary = summary.categories[budget.category_id];
        catSummary.spent += transaction.amount;
        catSummary.remaining = catSummary.budget - catSummary.spent;
        catSummary.percentage = Math.min(
          (catSummary.spent / catSummary.budget) * 100,
          100
        );
      }
    });

    summary.remaining = summary.totalBudget - summary.totalSpent;
    summary.percentage =
      summary.totalBudget > 0
        ? Math.min((summary.totalSpent / summary.totalBudget) * 100, 100)
        : 0;

    return summary;
  };

  const value = {
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetByCategory,
    getBudgetSummary,
    isLoading,
  };

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
}
