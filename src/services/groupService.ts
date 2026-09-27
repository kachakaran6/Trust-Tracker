import { api } from "../lib/api";
import {
  Group,
  GroupMember,
  GroupCategory,
  GroupTransaction,
  GroupSettlementData,
} from "../types";

export const groupService = {
  async getMyGroups(): Promise<Group[]> {
    return api.groups.list();
  },

  async createGroup(name: string, description?: string): Promise<Group> {
    return api.groups.create({ name, description });
  },

  async joinGroup(code: string): Promise<{ message: string; group: Group }> {
    return api.groups.join(code);
  },

  async getGroup(groupId: string): Promise<{ group: Group; myRole: "admin" | "member"; members: GroupMember[] }> {
    return api.groups.getDetails(groupId);
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
      split_type?: "equal" | "custom";
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
};
