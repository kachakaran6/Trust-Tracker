import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";
import { Category } from "../types";
import { toast } from "sonner";

interface CategoriesContextType {
  categories: Category[];
  addCategory: (category: Omit<Category, "id" | "user_id">) => Promise<Category>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  getIncomeCategories: () => Category[];
  getExpenseCategories: () => Category[];
  refreshCategories: () => Promise<void>;
  isLoading: boolean;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error("useCategories must be used within a CategoriesProvider");
  }
  return context;
}

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await api.categories.list();
      setCategories(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const addCategory = async (category: Omit<Category, "id" | "user_id">): Promise<Category> => {
    try {
      const created = await api.categories.create(category);
      setCategories((prev) => [...prev, created]);
      toast.success(`Category "${created.name}" created!`);
      return created;
    } catch (error: any) {
      toast.error(error.message || "Failed to add category");
      throw error;
    }
  };

  const updateCategory = async (id: string, updatedFields: Partial<Category>): Promise<Category> => {
    try {
      const updated = await api.categories.update(id, updatedFields);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      toast.success(`Category updated!`);
      return updated;
    } catch (error: any) {
      toast.error(error.message || "Failed to update category");
      throw error;
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    try {
      await api.categories.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
      throw error;
    }
  };

  const getCategoryById = (id: string): Category | undefined => {
    return categories.find((c) => c.id === id);
  };

  const getIncomeCategories = (): Category[] => {
    return categories.filter((c) => c.type === "income");
  };

  const getExpenseCategories = (): Category[] => {
    return categories.filter((c) => c.type === "expense");
  };

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
        getIncomeCategories,
        getExpenseCategories,
        refreshCategories: loadCategories,
        isLoading,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}
