import { supabase } from "../lib/supabase";
import {
  Group,
  //   GroupMember,
  GroupCategory,
  GroupTransaction,
  GroupBudget,
} from "../utils/group";

export const groupService = {
  supabase, // Export supabase for use in components

  // Groups
  async getMyGroups() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get groups where user is creator or member
    const { data: memberGroups, error: memberError } = await supabase
      .from("group_members")
      .select(
        `
        group_id,
        groups!inner(
          *,
          _group_members_count:group_members(count)
        )
      `
      )
      .eq("user_id", user.id);

    if (memberError) throw memberError;

    // Extract groups from the member relationship
    const groups = memberGroups?.map((mg) => mg.groups).filter(Boolean) || [];

    return groups;
  },

  async createGroup(name: string, description?: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Generate unique code
    const { data: codeData, error: codeError } = await supabase.rpc(
      "generate_group_code"
    );
    if (codeError) throw codeError;

    // Create group
    const { data: group, error } = await supabase
      .from("groups")
      .insert({
        name,
        description,
        code: codeData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // ✅ Add creator as a group member
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
    });

    if (memberError) throw memberError;

    return group;
  },

  async joinGroup(code: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // First, find the group by code
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("code", code.toUpperCase())
      .maybeSingle(); // ✅ prevents 406 if group not found

    if (groupError) throw groupError;
    if (!group) throw new Error("Group not found");

    // Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .maybeSingle(); // ✅ prevents 406

    if (memberCheckError) throw memberCheckError;
    if (existingMember) {
      throw new Error("You are already a member of this group");
    }

    // Add user as member
    const { data, error } = await supabase
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: "member",
        full_name: user.user_metadata.full_name,
        email: user.email,
      })
      .select()
      .single(); // ✅ fine here because insert should always return one row

    if (error) throw error;
    return data;
  },

  async getGroup(groupId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("groups")
      .select(
        `
      *,
      group_members(
        id,
        role,
        joined_at,
        user_id
      )
    `
      )
      .eq("id", groupId)
      .single();

    if (error) throw error;

    // Check if current user is a member
    const isMember = data.group_members?.some(
      (member) => member.user_id === user.id
    );

    if (!isMember) {
      throw new Error("Access denied: You are not a member of this group");
    }

    return data;
  },

  async updateGroup(groupId: string, updates: Partial<Group>) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("groups")
      .update(updates)
      .eq("id", groupId)
      .eq("created_by", user.id) // Only creator can update
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteGroup(groupId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId)
      .eq("created_by", user.id); // Only creator can delete

    if (error) throw error;
  },

  async leaveGroup(groupId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);

    if (error) throw error;
  },

  // Group Categories
  async getGroupCategories(groupId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // First check if user is a member
    const { data: membership } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      throw new Error("Access denied: You are not a member of this group");
    }

    const { data, error } = await supabase
      .from("group_categories")
      .select("*")
      .eq("group_id", groupId)
      .order("name");

    if (error) throw error;
    return data;
  },

  async createGroupCategory(
    groupId: string,
    category: Omit<GroupCategory, "id" | "group_id" | "created_at">
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Check if user is a member
    const { data: membership } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      throw new Error("Access denied: You are not a member of this group");
    }

    const { data, error } = await supabase
      .from("group_categories")
      .insert({
        ...category,
        group_id: groupId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Group Transactions
  async getGroupTransactions(groupId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Check if user is a member
    const { data: membership } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      throw new Error("Access denied: You are not a member of this group");
    }

    const { data, error } = await supabase
      .from("group_transactions")
      .select(`*`)
      .eq("group_id", groupId)
      .order("transaction_date", { ascending: false });

    if (error) throw error;
    return data;
  },

  async createGroupTransaction(
    groupId: string,
    transaction: Omit<
      GroupTransaction,
      "id" | "group_id" | "created_by" | "created_at"
    >
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: membership } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      throw new Error("Access denied: You are not a member of this group");
    }

    const { type, date, ...cleanTransaction } = transaction;

    const { data, error } = await supabase
      .from("group_transactions")
      .insert({
        ...cleanTransaction,
        type, // ✅ FIXED: now we save the type
        transaction_date: date,
        group_id: groupId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGroupTransaction(
    transactionId: string,
    updates: Partial<GroupTransaction>
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("group_transactions")
      .update(updates)
      .eq("id", transactionId)
      .eq("created_by", user.id) // Only creator can update
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteGroupTransaction(transactionId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("group_transactions")
      .delete()
      .eq("id", transactionId)
      .eq("created_by", user.id); // Only creator can delete

    if (error) throw error;
  },

  async copyTransactionToPersonal(
    groupTransactionId: string,
    categoryId: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get the group transaction
    const { data: groupTx, error: fetchError } = await supabase
      .from("group_transactions")
      .select("*")
      .eq("id", groupTransactionId)
      .single();

    if (fetchError) throw fetchError;

    // Create personal transaction
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        category_id: categoryId,
        amount: groupTx.amount,
        type: groupTx.type,
        description: `${groupTx.description} (copied from group)`,
        date: groupTx.transaction_date,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Group Budgets
  async getGroupBudgets(groupId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Check if user is a member
    const { data: membership } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      throw new Error("Access denied: You are not a member of this group");
    }

    const { data, error } = await supabase
      .from("group_budgets")
      .select(
        `
        *,
        group_categories(name, color, icon)
      `
      )
      .eq("group_id", groupId)
      .order("start_date", { ascending: false });

    if (error) throw error;
    return data;
  },

  async deleteGroupBudget(budgetId: string) {
    const { error } = await supabase
      .from("group_budgets")
      .delete()
      .eq("id", budgetId);

    if (error) throw error;
  },

  async updateGroupBudget(
    budgetId: string,
    updates: Partial<
      Omit<GroupBudget, "id" | "group_id" | "created_by" | "created_at">
    >
  ) {
    const { data, error } = await supabase
      .from("group_budgets")
      .update(updates)
      .eq("id", budgetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createGroupBudget(
    groupId: string,
    budget: Omit<GroupBudget, "id" | "group_id" | "created_by" | "created_at">
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("group_budgets")
      .insert({
        ...budget,
        group_id: groupId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Group Analytics
  async getGroupSummary(groupId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Check if user is a member
    const { data: membership } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      throw new Error("Access denied: You are not a member of this group");
    }

    const { data: transactions, error: txError } = await supabase
      .from("group_transactions")
      .select("amount")
      .eq("group_id", groupId);

    if (txError) throw txError;

    const { data: members, error: memberError } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId);

    if (memberError) throw memberError;

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      memberCount: members.length,
    };
  },

  async getGroupMembers(groupId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // 1. Fetch group members
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .order("joined_at");

    if (membersError) throw membersError;
    if (!members || members.length === 0) return [];

    // 2. Extract user IDs
    const userIds = members.map((m) => m.user_id);

    // 3. Fetch corresponding users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", userIds);

    if (usersError) throw usersError;

    // 4. Map user info to members
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const enrichedMembers = members.map((member) => ({
      ...member,
      users: userMap[member.user_id] || {
        full_name: "Unknown",
        email: "",
      },
    }));

    return enrichedMembers;
  },

  async updateMemberRole(memberId: string, role: "admin" | "member") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("group_members")
      .update({ role })
      .eq("id", memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeMember(memberId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", memberId);

    if (error) throw error;
  },
};
