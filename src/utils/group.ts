export interface Group {
  group_members?: GroupMember[];
  _group_members_count?: { count: number }[];
  id: string;
  name: string;
  description?: string;
  code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  users?: {
    full_name: string;
    email: string;
  };
}

export interface GroupCategory {
  id: string;
  group_id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
  created_at: string;
}

export interface GroupTransaction {
  id: string;
  group_id: string;
  category_id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  date: string;
  created_by: string;
  created_at: string;
  group_categories?: GroupCategory;
  created_by_user?: {
    full_name: string;
    email: string;
  };
}

export interface GroupBudget {
  id: string;
  group_id: string;
  category_id: string;
  amount: number;
  period: "Monthly" | "Weekly" | "Quarterly" | "Yearly";
  start_date: string;
  created_by: string;
  created_at: string;
  group_categories?: GroupCategory;
  spent?: number;
}

export interface GroupSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  memberCount: number;
}
