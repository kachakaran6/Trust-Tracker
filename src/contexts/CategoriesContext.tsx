import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase, Category } from "../lib/supabase";

interface CategoriesContextType {
  categories: Category[];
  addCategory: (category: Omit<Category, "id" | "user_id">) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  getIncomeCategories: () => Category[];
  getExpenseCategories: () => Category[];
  isLoading: boolean;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(
  undefined
);

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error("useCategories must be used within a CategoriesProvider");
  }
  return context;
}

export function CategoriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCategories();
    } else {
      setCategories([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadCategories = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      if (data.length === 0) {
        // Create default categories for new users
        await createDefaultCategories();
      } else {
        setCategories(data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultCategories = async () => {
    if (!user) return;

    const defaultCategories = [
      { name: "Salary", type: "income", color: "#4F46E5", icon: "Briefcase" },
      { name: "Freelance", type: "income", color: "#8B5CF6", icon: "Laptop" },
      {
        name: "Investments",
        type: "income",
        color: "#6366F1",
        icon: "TrendingUp",
      },
      {
        name: "Food",
        type: "expense",
        color: "#F97316",
        icon: "UtensilsCrossed",
      },
      {
        name: "Transportation",
        type: "expense",
        color: "#3B82F6",
        icon: "Car",
      },
      {
        name: "Entertainment",
        type: "expense",
        color: "#EC4899",
        icon: "Film",
      },
      {
        name: "Utilities",
        type: "expense",
        color: "#10B981",
        icon: "Lightbulb",
      },
      { name: "Rent", type: "expense", color: "#6366F1", icon: "Home" },
    ];

    try {
      // 1. Get existing category names
      const { data: existing, error: fetchError } = await supabase
        .from("categories")
        .select("name")
        .eq("user_id", user.id);

      if (fetchError) throw fetchError;

      const existingNames = (existing ?? []).map((cat) => cat.name);

      // 2. Filter out categories already present
      const categoriesToInsert = defaultCategories.filter(
        (cat) => !existingNames.includes(cat.name)
      );

      if (categoriesToInsert.length === 0) return;

      // 3. Insert only missing categories
      const { data, error: insertError } = await supabase
        .from("categories")
        .insert(categoriesToInsert.map((cat) => ({ ...cat, user_id: user.id })))
        .select();

      if (insertError) throw insertError;

      setCategories((prev) => [...prev, ...(data ?? [])]);
    } catch (error) {
      console.error("Error creating default categories:", error);
    }
  };

  const addCategory = async (category: Omit<Category, "id" | "user_id">) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([
          {
            ...category,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setCategories((prev) => [...prev, data]);
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  };

  const updateCategory = async (
    id: string,
    updatedFields: Partial<Category>
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("categories")
        .update(updatedFields)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      setCategories((prev) =>
        prev.map((category) =>
          category.id === id ? { ...category, ...data } : category
        )
      );
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setCategories((prev) => prev.filter((category) => category.id !== id));
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  };

  const getCategoryById = (id: string): Category | undefined => {
    return categories.find((category) => category.id === id);
  };

  const getIncomeCategories = (): Category[] => {
    return categories.filter((category) => category.type === "income");
  };

  const getExpenseCategories = (): Category[] => {
    return categories.filter((category) => category.type === "expense");
  };

  const value = {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getIncomeCategories,
    getExpenseCategories,
    isLoading,
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}
