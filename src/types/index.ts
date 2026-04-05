/**
 * Core Type Definitions for Trust-Tracker
 * 
 * These interfaces represent the unified data structures used across the application.
 * All components and services should transition to using these types instead of 'any'.
 */

export type UserRole = "normal" | "super_admin";
export type UserStatus = "active" | "banned";
export type TransactionType = "income" | "expense";

export interface UserMetadata {
  full_name?: string;
  name?: string;
  picture?: string;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
  last_sign_in_at?: string;
  role?: UserRole;
  status?: UserStatus;
  currency?: string;
  timezone?: string;
  welcome_email_sent?: boolean;
  raw_user_meta_data?: UserMetadata;
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
  raw_user_meta_data?: UserMetadata;
}

export interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalAmount: number;
}

export interface AdminStatsLocal extends AdminStats {
  newUsersThisMonth: number;
  activeUsers: number;
  bannedUsers: number;
  superAdmins: number;
}

export interface Category {
  id: string;
  user_id: string;
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
  description: string | null;
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
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  code: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  full_name?: string;
  email?: string;
  user?: User;
}
