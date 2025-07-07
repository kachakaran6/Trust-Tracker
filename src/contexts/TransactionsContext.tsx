/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase, Transaction } from "../lib/supabase";
import { parseISO, startOfMonth, endOfMonth } from "date-fns";

interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categories: {
    [key: string]: {
      total: number;
      count: number;
    };
  };
}

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (
    transaction: Omit<Transaction, "id" | "user_id" | "created_at">
  ) => Promise<void>;
  updateTransaction: (
    id: string,
    transaction: Partial<Transaction>
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  isLoading: boolean;
  getTransactionsByMonth: (month: Date) => Transaction[];
  getTransactionsByCategory: (category: string) => Transaction[];
  getMonthlySummary: (month: Date) => TransactionSummary;
  getRecentTransactions: (limit: number) => Transaction[];
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(
  undefined
);

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error(
      "useTransactions must be used within a TransactionsProvider"
    );
  }
  return context;
}

export function TransactionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTransactions();
    } else {
      setTransactions([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "user_id" | "created_at">
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert([
          {
            ...transaction,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      setTransactions((prev) => [data, ...prev]);
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    }
  };

  const updateTransaction = async (
    id: string,
    updatedFields: Partial<Transaction>
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("transactions")
        .update(updatedFields)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === id ? { ...transaction, ...data } : transaction
        )
      );
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setTransactions((prev) =>
        prev.filter((transaction) => transaction.id !== id)
      );
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  };

  const getTransactionsByMonth = (month: Date): Transaction[] => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);

    return transactions.filter((transaction) => {
      const transactionDate = parseISO(transaction.date);
      return transactionDate >= start && transactionDate <= end;
    });
  };

  const getTransactionsByCategory = (categoryId: string): Transaction[] => {
    return transactions.filter(
      (transaction) => transaction.category_id === categoryId
    );
  };

  const getMonthlySummary = (month: Date): TransactionSummary => {
    const monthlyTransactions = getTransactionsByMonth(month);

    const summary: TransactionSummary = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      categories: {},
    };

    monthlyTransactions.forEach((transaction) => {
      if (transaction.type === "income") {
        summary.totalIncome += transaction.amount;
      } else {
        summary.totalExpense += transaction.amount;
      }

      if (!summary.categories[transaction.category_id]) {
        summary.categories[transaction.category_id] = { total: 0, count: 0 };
      }

      summary.categories[transaction.category_id].total += transaction.amount;
      summary.categories[transaction.category_id].count += 1;
    });

    summary.balance = summary.totalIncome - summary.totalExpense;

    return summary;
  };

  const getRecentTransactions = (limit: number): Transaction[] => {
    return transactions.slice(0, limit);
  };

  const value = {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    isLoading,
    getTransactionsByMonth,
    getTransactionsByCategory,
    getMonthlySummary,
    getRecentTransactions,
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}
