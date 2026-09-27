import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";
import { Transaction } from "../types";
import { parseISO, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";

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
  addTransaction: (transaction: Omit<Transaction, "id" | "user_id" | "created_at">) => Promise<Transaction>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  isLoading: boolean;
  getTransactionsByMonth: (month: Date) => Transaction[];
  getTransactionsByCategory: (category: string) => Transaction[];
  getMonthlySummary: (month: Date) => TransactionSummary;
  getRecentTransactions: (limit: number) => Transaction[];
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionsProvider");
  }
  return context;
}

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await api.transactions.list();
      setTransactions(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "user_id" | "created_at">
  ): Promise<Transaction> => {
    try {
      const created = await api.transactions.create(transaction);
      setTransactions((prev) => [created, ...prev]);
      toast.success("Transaction recorded!");
      return created;
    } catch (error: any) {
      toast.error(error.message || "Failed to add transaction");
      throw error;
    }
  };

  const updateTransaction = async (
    id: string,
    updatedFields: Partial<Transaction>
  ): Promise<Transaction> => {
    try {
      const updated = await api.transactions.update(id, updatedFields);
      setTransactions((prev) => prev.map((tx) => (tx.id === id ? updated : tx)));
      toast.success("Transaction updated!");
      return updated;
    } catch (error: any) {
      toast.error(error.message || "Failed to update transaction");
      throw error;
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    try {
      await api.transactions.delete(id);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      toast.success("Transaction deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete transaction");
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
    return transactions.filter((transaction) => transaction.category_id === categoryId);
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
      const amount = Number(transaction.amount) || 0;
      if (transaction.type === "income") {
        summary.totalIncome += amount;
      } else {
        summary.totalExpense += amount;
      }

      const categoryKey = transaction.category_id || "uncategorized";
      if (!summary.categories[categoryKey]) {
        summary.categories[categoryKey] = { total: 0, count: 0 };
      }

      summary.categories[categoryKey].total += amount;
      summary.categories[categoryKey].count += 1;
    });

    summary.balance = summary.totalIncome - summary.totalExpense;
    return summary;
  };

  const getRecentTransactions = (limit: number): Transaction[] => {
    return transactions.slice(0, limit);
  };

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        refreshTransactions: loadTransactions,
        isLoading,
        getTransactionsByMonth,
        getTransactionsByCategory,
        getMonthlySummary,
        getRecentTransactions,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}
