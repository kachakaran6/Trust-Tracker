/**
 * Core Type Definitions for Trust-Tracker
 * Unified, strictly-typed data contracts
 */

export type UserRole = "normal" | "super_admin";
export type UserStatus = "active" | "banned";
export type TransactionType = "income" | "expense";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at?: string;
  last_sign_in_at?: string;
  role?: UserRole;
  status?: UserStatus;
  currency?: string;
  timezone?: string;
}

export interface AdminUser {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_sign_in_at?: string;
  user_role: UserRole;
  user_status: UserStatus;
  total_transactions: number;
  total_amount: number;
  currency?: string;
  timezone?: string;
  avatar_url?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalAmount: number;
  newUsersThisMonth: number;
  activeUsers: number;
  bannedUsers: number;
  superAdmins: number;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  description: string;
  date: string;
  created_at: string;
  category?: Category | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string;
  created_at: string;
  category?: Category;
  spent?: number;
  remaining?: number;
  percentage?: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  code: string;
  created_by: string;
  created_at: string;
  my_role?: "admin" | "member";
  member_count?: number;
  total_spent?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  name?: string;
  email?: string;
  avatar_url?: string;
}

export interface GroupCategory {
  id: string;
  group_id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
  created_at?: string;
}

export interface GroupTransaction {
  id: string;
  group_id: string;
  paid_by: string;
  paid_by_name?: string;
  paid_by_email?: string;
  paid_by_avatar?: string;
  amount: number;
  type: "income" | "expense";
  category_id: string | null;
  description: string;
  date: string;
  split_type: "equal" | "custom";
  split_details: Record<string, number>;
  created_at: string;
  category?: GroupCategory | null;
}

export interface SettlementInstruction {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
}

export interface NetBalance {
  userId: string;
  name: string;
  net: number;
}

export interface GroupSettlementData {
  netBalances: NetBalance[];
  settlements: SettlementInstruction[];
}

export interface PredictionForecastPoint {
  month: string;
  actual: number | null;
  predicted: number | null;
  confidence: number;
}

export interface CategoryPrediction {
  id: string;
  name: string;
  color: string;
  icon: string;
  currentAverage: number;
  predicted: number;
  trend: number;
  confidence: number;
}

export interface PredictionResponse {
  monthsAhead: number;
  modelType: string;
  avgMonthlyExpense: number;
  monthlyTrendSlope: number;
  forecast: PredictionForecastPoint[];
  categoryPredictions: CategoryPrediction[];
}

export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  categories: {
    category_id: string;
    category_name: string;
    color: string;
    icon: string;
    total: number;
    count: number;
  }[];
}
