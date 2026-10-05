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
  original_amount?: number | null;
  split_received_amount?: number;
  split_status?: string; // 'none' | 'pending_split' | 'partially_settled' | 'fully_settled' | 'settled_share'
  group_id?: string | null;
  group_transaction_id?: string | null;
  group_name?: string | null;
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

/* ==================== GROUPS & EXPENSE SPLITTING ==================== */

export interface Group {
  id: string;
  name: string;
  description?: string;
  code: string;
  currency?: string;
  created_by: string;
  created_at: string;
  my_role?: "admin" | "member";
  member_count?: number;
  total_spent?: number;
}

export interface GroupInvitePreview {
  id: string;
  name: string;
  description?: string;
  code: string;
  currency: string;
  created_at: string;
  creator_name: string;
  member_count: number;
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
  user_currency?: string;
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

export type GroupSplitType = "equal" | "exact" | "percentage" | "shares" | "custom";

export interface GroupTransactionSplitSummary {
  totalRequests: number;
  paidRequests: number;
  paidSum: number;
  pendingSum: number;
}

export interface GroupTransaction {
  id: string;
  group_id: string;
  paid_by: string;
  personal_transaction_id?: string | null;
  paid_by_name?: string;
  paid_by_email?: string;
  paid_by_avatar?: string;
  amount: number;
  type: "income" | "expense";
  category_id: string | null;
  description: string;
  date: string;
  split_type: GroupSplitType;
  split_details: Record<string, number>;
  created_at: string;
  category?: GroupCategory | null;
  split_summary?: GroupTransactionSplitSummary | null;
}

export interface GroupSplitRequest {
  id: string;
  group_id: string;
  group_transaction_id: string;
  from_user_id: string;
  from_name?: string;
  from_email?: string;
  from_avatar?: string;
  to_user_id: string;
  to_name?: string;
  to_email?: string;
  to_avatar?: string;
  amount: number;
  status: "pending" | "accepted" | "paid" | "declined";
  payment_method?: string;
  notes?: string;
  paid_at?: string | null;
  settlement_id?: string | null;
  created_at: string;
  expense_description?: string;
  expense_total_amount?: number;
  expense_date?: string;
  group_name?: string;
  group_currency?: string;
  is_incoming?: boolean; // Current user is recipient (owes money)
  is_outgoing?: boolean; // Current user is creator (is owed money)
}

export interface GroupSettlementPayment {
  id: string;
  group_id: string;
  from_user_id: string;
  from_name?: string;
  from_email?: string;
  to_user_id: string;
  to_name?: string;
  to_email?: string;
  amount: number;
  date: string;
  notes?: string;
  payment_method: string;
  status: "pending" | "confirmed" | "rejected";
  created_at: string;
  approved_at?: string;
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
  recordedSettlements?: GroupSettlementPayment[];
}

/* ==================== LOANS & EMI MANAGEMENT ==================== */

export interface Loan {
  id: string;
  user_id: string;
  name: string;
  type: "borrowed" | "lent";
  counterparty: string;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  start_date: string;
  emi_day: number;
  monthly_emi: number;
  currency: string;
  status: "active" | "closed" | "defaulted";
  notes?: string;
  created_at: string;
  total_paid?: number;
  paid_installments?: number;
  total_expected?: number;
  total_interest?: number;
  remaining_balance?: number;
  progress_percent?: number;
  next_due_date?: string;
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  payment_number: number;
  amount: number;
  principal_component: number;
  interest_component: number;
  payment_date: string;
  status: "paid" | "pending" | "skipped";
  notes?: string;
  created_at: string;
}

export interface AmortizationScheduleItem {
  paymentNumber: number;
  dueDate: string;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  remainingBalance: number;
  isPaid?: boolean;
  paymentId?: string | null;
  paidDate?: string | null;
  paidAmount?: number | null;
}

export interface LoanSummary {
  totalBorrowedPrincipal: number;
  totalBorrowedRemaining: number;
  monthlyEmiBurden: number;
  totalLentPrincipal: number;
  totalLentRemaining: number;
  monthlyLentReceivable: number;
  activeLoansCount: number;
}

/* ==================== SUBSCRIPTIONS MANAGEMENT ==================== */

export type BillingCycle = "monthly" | "quarterly" | "yearly" | "weekly";

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  category: string;
  cost: number;
  currency: string;
  billing_cycle: BillingCycle;
  next_billing_date: string;
  payment_method: string;
  icon: string;
  color: string;
  status: "active" | "paused" | "cancelled";
  reminder_days: number;
  is_trial: boolean;
  trial_ends_at?: string | null;
  notes?: string;
  created_at: string;
  monthly_cost?: number;
  yearly_cost?: number;
  days_until_renewal?: number;
  is_renewing_soon?: boolean;
}

export interface SubscriptionSummary {
  totalMonthlyBurn: number;
  totalAnnualBurn: number;
  activeCount: number;
  pausedCount: number;
  renewingIn7DaysCount: number;
  categoryBreakdown: { name: string; monthlyTotal: number }[];
}

/* ==================== DEBTS & LENDER MANAGEMENT ==================== */

export interface Debt {
  id: string;
  user_id: string;
  counterparty_name: string;
  counterparty_contact: string;
  type: "i_owe" | "owed_to_me";
  amount: number;
  amount_paid: number;
  currency: string;
  due_date?: string | null;
  status: "active" | "partially_paid" | "settled" | "overdue";
  notes?: string;
  created_at: string;
  remaining_balance?: number;
  progress_percent?: number;
  payment_count?: number;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  payment_date: string;
  notes?: string;
  created_at: string;
}

export interface DebtSummary {
  totalIOwe: number;
  totalOwedToMe: number;
  netBalance: number;
  activeCount: number;
  settledCount: number;
  overdueCount: number;
}

/* ==================== PREDICTIONS & ANALYTICS ==================== */

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
