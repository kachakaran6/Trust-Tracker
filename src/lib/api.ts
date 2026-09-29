import {
  User,
  Category,
  Transaction,
  Budget,
  Group,
  GroupMember,
  GroupCategory,
  GroupTransaction,
  GroupSettlementData,
  GroupInvitePreview,
  GroupSettlementPayment,
  GroupSplitType,
  Loan,
  LoanSummary,
  AmortizationScheduleItem,
  LoanPayment,
  Subscription,
  SubscriptionSummary,
  Debt,
  DebtSummary,
  DebtPayment,
  PredictionResponse,
  MonthlySummary,
  AdminUser,
  AdminStats,
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "tt_token";

export const authStorage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clearToken: (): void => localStorage.removeItem(TOKEN_KEY),
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    authStorage.clearToken();
    if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register") && !window.location.pathname.includes("/join-group")) {
      window.location.href = "/login";
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Authentication
  auth: {
    register: (payload: { email: string; password: string; name?: string; currency?: string; timezone?: string }) =>
      apiFetch<{ user: User; token: string; message: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    login: (payload: { email: string; password: string }) =>
      apiFetch<{ user: User; token: string; message: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    me: () => apiFetch<{ user: User }>("/auth/me"),
    updateProfile: (payload: Partial<User>) =>
      apiFetch<{ user: User; message: string }>("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    updatePassword: (payload: { currentPassword: string; newPassword: string }) =>
      apiFetch<{ message: string }>("/auth/password", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    logout: () => {
      authStorage.clearToken();
    },
  },

  // Categories
  categories: {
    list: () => apiFetch<Category[]>("/categories"),
    create: (payload: { name: string; type: "income" | "expense"; color?: string; icon?: string }) =>
      apiFetch<Category>("/categories", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<Category>) =>
      apiFetch<Category>(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      apiFetch<{ message: string }>(`/categories/${id}`, {
        method: "DELETE",
      }),
  },

  // Transactions
  transactions: {
    list: (params?: { month?: string; category_id?: string; type?: string; search?: string; limit?: number; offset?: number; sort_by?: string; order?: string }) => {
      const query = new URLSearchParams();
      if (params?.month) query.set("month", params.month);
      if (params?.category_id) query.set("category_id", params.category_id);
      if (params?.type) query.set("type", params.type);
      if (params?.search) query.set("search", params.search);
      if (params?.limit) query.set("limit", params.limit.toString());
      if (params?.offset) query.set("offset", params.offset.toString());
      if (params?.sort_by) query.set("sort_by", params.sort_by);
      if (params?.order) query.set("order", params.order);
      const q = query.toString();
      return apiFetch<Transaction[]>(`/transactions${q ? `?${q}` : ""}`);
    },
    create: (payload: { amount: number; type: "income" | "expense"; category_id?: string | null; description?: string; date?: string }) =>
      apiFetch<Transaction>("/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<Transaction>) =>
      apiFetch<Transaction>(`/transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      apiFetch<{ message: string }>(`/transactions/${id}`, {
        method: "DELETE",
      }),
    getMonthlySummary: (month?: string) =>
      apiFetch<MonthlySummary>(`/transactions/summary/monthly${month ? `?month=${month}` : ""}`),
  },

  // Budgets
  budgets: {
    list: (month?: string) =>
      apiFetch<Budget[]>(`/budgets${month ? `?month=${month}` : ""}`),
    upsert: (payload: { category_id: string; amount: number; month: string }) =>
      apiFetch<Budget>("/budgets", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      apiFetch<{ message: string }>(`/budgets/${id}`, {
        method: "DELETE",
      }),
  },

  // Groups & Expense Splitting
  groups: {
    list: () => apiFetch<Group[]>("/groups"),
    create: (payload: { name: string; description?: string; currency?: string }) =>
      apiFetch<Group>("/groups", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    join: (code: string) =>
      apiFetch<{ message: string; group: Group }>("/groups/join", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    getInvitePreview: (code: string) =>
      apiFetch<GroupInvitePreview>(`/groups/invite/${code}`),
    getDetails: (groupId: string) =>
      apiFetch<{ group: Group; myRole: "admin" | "member"; members: GroupMember[] }>(`/groups/${groupId}`),
    update: (groupId: string, payload: { name?: string; description?: string; currency?: string }) =>
      apiFetch<Group>(`/groups/${groupId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    getTransactions: (groupId: string) =>
      apiFetch<GroupTransaction[]>(`/groups/${groupId}/transactions`),
    createTransaction: (groupId: string, payload: {
      amount: number;
      type?: "income" | "expense";
      category_id?: string | null;
      description?: string;
      date?: string;
      split_type?: GroupSplitType;
      split_details?: Record<string, number>;
      paid_by?: string;
    }) =>
      apiFetch<GroupTransaction>(`/groups/${groupId}/transactions`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    deleteTransaction: (groupId: string, txId: string) =>
      apiFetch<{ message: string }>(`/groups/${groupId}/transactions/${txId}`, {
        method: "DELETE",
      }),
    getCategories: (groupId: string) =>
      apiFetch<GroupCategory[]>(`/groups/${groupId}/categories`),
    createCategory: (groupId: string, payload: { name: string; type?: "income" | "expense"; color?: string; icon?: string }) =>
      apiFetch<GroupCategory>(`/groups/${groupId}/categories`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    getSettlements: (groupId: string) =>
      apiFetch<GroupSettlementData>(`/groups/${groupId}/settlements`),
    settlePayment: (groupId: string, payload: {
      to_user_id: string;
      from_user_id?: string;
      amount: number;
      date?: string;
      notes?: string;
      payment_method?: string;
      auto_confirm?: boolean;
    }) =>
      apiFetch<{ message: string; settlement: GroupSettlementPayment }>(`/groups/${groupId}/settle`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    approveSettlement: (groupId: string, settleId: string, action: "approve" | "reject") =>
      apiFetch<{ message: string; settlement: GroupSettlementPayment }>(`/groups/${groupId}/settle/${settleId}/approve`, {
        method: "PUT",
        body: JSON.stringify({ action }),
      }),
    deleteSettlement: (groupId: string, settleId: string) =>
      apiFetch<{ message: string }>(`/groups/${groupId}/settle/${settleId}`, {
        method: "DELETE",
      }),
  },

  // Loans & EMI
  loans: {
    list: () => apiFetch<{ loans: Loan[]; summary: LoanSummary }>("/loans"),
    create: (payload: {
      name: string;
      type: "borrowed" | "lent";
      counterparty: string;
      principal_amount: number;
      interest_rate?: number;
      tenure_months: number;
      start_date: string;
      emi_day?: number;
      currency?: string;
      monthly_emi?: number;
      notes?: string;
    }) =>
      apiFetch<Loan>("/loans", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    get: (id: string) =>
      apiFetch<{ loan: Loan; schedule: AmortizationScheduleItem[]; payments: LoanPayment[] }>(`/loans/${id}`),
    pay: (id: string, payload: {
      payment_number?: number;
      amount?: number;
      payment_date?: string;
      notes?: string;
      record_in_transactions?: boolean;
    }) =>
      apiFetch<{ message: string; payment: LoanPayment }>(`/loans/${id}/pay`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      apiFetch<{ message: string }>(`/loans/${id}`, {
        method: "DELETE",
      }),
  },

  // Subscriptions
  subscriptions: {
    list: () => apiFetch<{ subscriptions: Subscription[]; summary: SubscriptionSummary }>("/subscriptions"),
    create: (payload: {
      name: string;
      category?: string;
      cost: number;
      currency?: string;
      billing_cycle?: string;
      next_billing_date: string;
      payment_method?: string;
      icon?: string;
      color?: string;
      status?: string;
      reminder_days?: number;
      is_trial?: boolean;
      trial_ends_at?: string | null;
      notes?: string;
    }) =>
      apiFetch<Subscription>("/subscriptions", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<Subscription>) =>
      apiFetch<Subscription>(`/subscriptions/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    renew: (id: string, record_in_transactions = false) =>
      apiFetch<{ message: string; subscription: Subscription }>(`/subscriptions/${id}/renew`, {
        method: "POST",
        body: JSON.stringify({ record_in_transactions }),
      }),
    delete: (id: string) =>
      apiFetch<{ message: string }>(`/subscriptions/${id}`, {
        method: "DELETE",
      }),
  },

  // Personal Debts & Lender
  debts: {
    list: () => apiFetch<{ debts: Debt[]; summary: DebtSummary }>("/debts"),
    create: (payload: {
      counterparty_name: string;
      counterparty_contact?: string;
      type: "i_owe" | "owed_to_me";
      amount: number;
      currency?: string;
      due_date?: string | null;
      notes?: string;
    }) =>
      apiFetch<Debt>("/debts", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    get: (id: string) =>
      apiFetch<{ debt: Debt; payments: DebtPayment[] }>(`/debts/${id}`),
    recordPayment: (id: string, payload: {
      amount: number;
      payment_date?: string;
      notes?: string;
      record_in_transactions?: boolean;
    }) =>
      apiFetch<{ message: string; payment: DebtPayment; totalPaid: number; status: string }>(`/debts/${id}/payments`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      apiFetch<{ message: string }>(`/debts/${id}`, {
        method: "DELETE",
      }),
  },

  // Predictions
  predictions: {
    getForecast: (range = 3) =>
      apiFetch<PredictionResponse>(`/predictions?range=${range}`),
  },

  // AI NLP Diary Parser
  ai: {
    parseDiary: (text: string) =>
      apiFetch<{
        transactions: {
          amount: number;
          type: "income" | "expense";
          description: string;
          category_id: string | null;
          date: string;
        }[];
        engine: string;
      }>("/ai/parse-diary", {
        method: "POST",
        body: JSON.stringify({ text }),
      }),
  },

  // Admin
  admin: {
    getStats: () => apiFetch<AdminStats>("/admin/stats"),
    getUsers: () => apiFetch<AdminUser[]>("/admin/users"),
    updateRole: (userId: string, role: "normal" | "super_admin") =>
      apiFetch<{ success: boolean; message: string }>(`/admin/users/${userId}/role`, {
        method: "POST",
        body: JSON.stringify({ role }),
      }),
    updateStatus: (userId: string, status: "active" | "banned") =>
      apiFetch<{ success: boolean; message: string }>(`/admin/users/${userId}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    deleteUser: (userId: string) =>
      apiFetch<{ success: boolean; message: string }>(`/admin/users/${userId}`, {
        method: "DELETE",
      }),
  },

  // Analytics
  analytics: {
    createSession: (sessionData: any, accessToken?: string, expiresInHours = 24) =>
      apiFetch<{ id: string; created_at: string; expires_at: string }>("/analytics/session", {
        method: "POST",
        body: JSON.stringify({ session_data: sessionData, access_token: accessToken, expires_in_hours: expiresInHours }),
      }),
    getSession: (id: string, token?: string) =>
      apiFetch<{ id: string; sessionData: any; createdAt: string; expiresAt: string }>(
        `/analytics/session/${id}${token ? `?token=${encodeURIComponent(token)}` : ""}`
      ),
  },
};
