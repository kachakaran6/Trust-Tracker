import { api } from "../lib/api";
import {
  Group,
  GroupMember,
  GroupCategory,
  GroupTransaction,
  GroupSettlementData,
  GroupInvitePreview,
  GroupSplitType,
  GroupSettlementPayment,
} from "../types";

export const groupService = {
  async getMyGroups(): Promise<Group[]> {
    return api.groups.list();
  },

  async createGroup(name: string, description?: string, currency?: string): Promise<Group> {
    return api.groups.create({ name, description, currency });
  },

  async joinGroup(code: string): Promise<{ message: string; group: Group }> {
    return api.groups.join(code);
  },

  async getInvitePreview(code: string): Promise<GroupInvitePreview> {
    return api.groups.getInvitePreview(code);
  },

  async getGroup(groupId: string): Promise<{ group: Group; myRole: "admin" | "member"; members: GroupMember[] }> {
    return api.groups.getDetails(groupId);
  },

  async updateGroup(groupId: string, data: { name?: string; description?: string; currency?: string }): Promise<Group> {
    return api.groups.update(groupId, data);
  },

  async getGroupCategories(groupId: string): Promise<GroupCategory[]> {
    return api.groups.getCategories(groupId);
  },

  async createGroupCategory(
    groupId: string,
    category: { name: string; type?: "income" | "expense"; color?: string; icon?: string }
  ): Promise<GroupCategory> {
    return api.groups.createCategory(groupId, category);
  },

  async getGroupTransactions(groupId: string): Promise<GroupTransaction[]> {
    return api.groups.getTransactions(groupId);
  },

  async createGroupTransaction(
    groupId: string,
    transaction: {
      amount: number;
      type?: "income" | "expense";
      category_id?: string | null;
      description?: string;
      date?: string;
      split_type?: GroupSplitType;
      split_details?: Record<string, number>;
      paid_by?: string;
    }
  ): Promise<GroupTransaction> {
    return api.groups.createTransaction(groupId, transaction);
  },

  async deleteGroupTransaction(groupId: string, transactionId: string): Promise<void> {
    await api.groups.deleteTransaction(groupId, transactionId);
  },

  async getGroupSettlements(groupId: string): Promise<GroupSettlementData> {
    return api.groups.getSettlements(groupId);
  },

  async settlePayment(
    groupId: string,
    payload: {
      to_user_id: string;
      from_user_id?: string;
      amount: number;
      date?: string;
      notes?: string;
      payment_method?: string;
      auto_confirm?: boolean;
    }
  ): Promise<{ message: string; settlement: GroupSettlementPayment }> {
    return api.groups.settlePayment(groupId, payload);
  },

  async approveSettlement(
    groupId: string,
    settleId: string,
    action: "approve" | "reject"
  ): Promise<{ message: string; settlement: GroupSettlementPayment }> {
    return api.groups.approveSettlement(groupId, settleId, action);
  },

  async deleteSettlement(groupId: string, settleId: string): Promise<{ message: string }> {
    return api.groups.deleteSettlement(groupId, settleId);
  },
};
