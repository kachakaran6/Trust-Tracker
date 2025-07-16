import { useState, useEffect } from "react";
import { groupService } from "../services/groupService";
import { Group, GroupSummary, Transaction, Category } from "../utils/group";

// --- Reusable hook for loading and error state ---
const useAsyncState = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const wrap = async <T>(fn: () => Promise<T>) => {
    try {
      setLoading(true);
      setError(null);
      return await fn();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, setError, wrap };
};

// --- useGroups Hook ---
export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const { loading, error, setError, wrap } = useAsyncState();

  const loadGroups = async () => {
    const data = await wrap(() => groupService.getMyGroups());
    setGroups(data);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const createGroup = async (name: string, description?: string) => {
    const newGroup = await wrap(() =>
      groupService.createGroup(name, description)
    );
    await loadGroups();
    return newGroup;
  };

  const joinGroup = async (code: string) => {
    await wrap(() => groupService.joinGroup(code));
    await loadGroups();
  };

  const leaveGroup = async (groupId: string) => {
    await wrap(() => groupService.leaveGroup(groupId));
    await loadGroups();
  };

  const deleteGroup = async (groupId: string) => {
    await wrap(() => groupService.deleteGroup(groupId));
    await loadGroups();
  };

  return {
    groups,
    loading,
    error,
    loadGroups,
    createGroup,
    joinGroup,
    leaveGroup,
    deleteGroup,
  };
};

// --- useGroupSummary Hook ---
export const useGroupSummary = (groupId: string) => {
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const { loading, error, wrap } = useAsyncState();

  const loadSummary = async () => {
    const data = await wrap(() => groupService.getGroupSummary(groupId));
    setSummary(data);
  };

  useEffect(() => {
    if (groupId) loadSummary();
  }, [groupId]);

  return { summary, loading, error, loadSummary };
};

// --- useGroupTransactions Hook ---
export const useGroupTransactions = (groupId: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { loading, error, wrap } = useAsyncState();

  const loadTransactions = async () => {
    const data = await wrap(() => groupService.getGroupTransactions(groupId));
    setTransactions(data);
  };

  const addTransaction = async (transaction: Omit<Transaction, "id">) => {
    await wrap(() => groupService.createGroupTransaction(groupId, transaction));
    await loadTransactions();
  };

  const deleteTransaction = async (transactionId: string) => {
    await wrap(() => groupService.deleteGroupTransaction(transactionId));
    await loadTransactions();
  };

  useEffect(() => {
    if (groupId) loadTransactions();
  }, [groupId]);

  return {
    transactions,
    loading,
    error,
    loadTransactions,
    addTransaction,
    deleteTransaction,
  };
};

// --- useGroupCategories Hook ---
export const useGroupCategories = (groupId: string) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const { loading, error, wrap } = useAsyncState();

  const loadCategories = async () => {
    const data = await wrap(() => groupService.getGroupCategories(groupId));
    setCategories(data);
  };

  const addCategory = async (category: Omit<Category, "id">) => {
    await wrap(() => groupService.createGroupCategory(groupId, category));
    await loadCategories();
  };

  useEffect(() => {
    if (groupId) loadCategories();
  }, [groupId]);

  return {
    categories,
    loading,
    error,
    loadCategories,
    addCategory,
  };
};
