import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { groupService } from "../services/groupService";
import {
  Group,
  GroupMember,
  GroupCategory,
  GroupTransaction,
  GroupSettlementData,
} from "../types";
import {
  Users,
  Plus,
  Copy,
  Check,
  CreditCard,
  ArrowRight,
  Trash2,
  Calendar,
  Sparkles,
  ArrowLeft,
  DollarSign,
  Tag,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [categories, setCategories] = useState<GroupCategory[]>([]);
  const [transactions, setTransactions] = useState<GroupTransaction[]>([]);
  const [settlementData, setSettlementData] = useState<GroupSettlementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form State
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({});
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#3B82F6");

  const loadAll = useCallback(async () => {
    if (!groupId) return;
    try {
      setIsLoading(true);
      const [groupDetails, cats, txs, settlements] = await Promise.all([
        groupService.getGroup(groupId),
        groupService.getGroupCategories(groupId),
        groupService.getGroupTransactions(groupId),
        groupService.getGroupSettlements(groupId),
      ]);

      setGroup(groupDetails.group);
      setMembers(groupDetails.members);
      setCategories(cats);
      setTransactions(txs);
      setSettlementData(settlements);
    } catch (err: any) {
      toast.error(err.message || "Failed to load group details");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const copyInviteCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.code);
    setCopiedCode(true);
    toast.success("Group code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !amount || !description) {
      toast.error("Please fill in amount and description.");
      return;
    }

    try {
      await groupService.createGroupTransaction(groupId, {
        amount: parseFloat(amount),
        description,
        category_id: categoryId || null,
        date,
        split_type: splitType,
        split_details: splitType === "custom" ? customSplits : {},
      });

      toast.success("Group expense added!");
      setShowAddModal(false);
      setAmount("");
      setDescription("");
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add expense");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !newCatName.trim()) return;

    try {
      await groupService.createGroupCategory(groupId, {
        name: newCatName.trim(),
        color: newCatColor,
      });
      toast.success("Category created!");
      setShowCategoryModal(false);
      setNewCatName("");
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to create category");
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!groupId) return;
    if (!window.confirm("Are you sure you want to delete this group transaction?")) return;

    try {
      await groupService.deleteGroupTransaction(groupId, txId);
      toast.success("Transaction deleted");
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete transaction");
    }
  };

  if (isLoading && !group) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Group not found.</p>
        <button
          onClick={() => navigate("/group")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation */}
      <button
        onClick={() => navigate("/group")}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Groups
      </button>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/80 via-slate-800 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold">{group.name}</h1>
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-mono font-bold text-indigo-300">
              CODE: {group.code}
            </span>
          </div>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">{group.description || "Shared group expense ledger"}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={copyInviteCode}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-medium transition cursor-pointer"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copiedCode ? "Copied" : "Share Invite Code"}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Group Expense
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Group Spending</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${totalExpense.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">{transactions.length} shared transactions</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Members</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{members.length}</p>
          <div className="flex items-center gap-1.5 mt-2 overflow-hidden">
            {members.slice(0, 5).map((m) => (
              <div
                key={m.id}
                title={m.name || m.email}
                className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-500 text-xs font-bold flex items-center justify-center"
              >
                {(m.name || m.email || "U").charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Categories</span>
          <div className="flex items-center justify-between mt-1">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{categories.length}</p>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="text-xs text-indigo-500 hover:text-indigo-400 font-semibold cursor-pointer"
            >
              + Add Category
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">Custom tags for this group</p>
        </div>
      </div>

      {/* Automated Settlement / Debt Minimization Engine */}
      {settlementData && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 shadow-sm text-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Automated Debt Settlement Engine ("Who Owes Whom")
            </h3>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-semibold">
              Min-Cash-Flow Algorithm
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Net Balances */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Member Net Balances</p>
              <div className="space-y-2">
                {settlementData.netBalances.map((nb) => (
                  <div
                    key={nb.userId}
                    className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{nb.name}</span>
                    <span
                      className={`font-bold ${
                        nb.net > 0 ? "text-emerald-400" : nb.net < 0 ? "text-red-400" : "text-slate-400"
                      }`}
                    >
                      {nb.net > 0 ? `+ $${nb.net.toFixed(2)} (gets back)` : nb.net < 0 ? `- $${Math.abs(nb.net).toFixed(2)} (owes)` : "Settled ($0)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Transfers */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Direct Settlement Transfers</p>
              {settlementData.settlements.length === 0 ? (
                <div className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-xl text-center text-slate-400 text-sm">
                  🎉 All group debts are completely settled up!
                </div>
              ) : (
                <div className="space-y-2">
                  {settlementData.settlements.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-indigo-900/30 border border-indigo-500/30 rounded-xl flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-red-300">{s.fromName}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-emerald-300">{s.toName}</span>
                      </div>
                      <span className="font-bold text-white bg-indigo-600 px-3 py-1 rounded-lg text-xs">
                        ${s.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Feed */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Group Activity</h3>
          <span className="text-xs text-slate-400">{transactions.length} entries</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No transactions yet. Click "Add Group Expense" to record the first split!
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: tx.category?.color || "#6366F1" }}
                  >
                    {(tx.category?.name || "E").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{tx.description}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Paid by {tx.paid_by_name || tx.paid_by_email || "Member"}</span>
                      <span>•</span>
                      <span>{format(new Date(tx.date), "MMM d, yyyy")}</span>
                      <span>•</span>
                      <span className="capitalize">{tx.split_type} split</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 dark:text-white text-base">
                    ${Number(tx.amount).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDeleteTransaction(tx.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Add Expense */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Group Expense</h3>
              <form onSubmit={handleCreateTransaction} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Dinner at Italian Bistro"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                    >
                      <option value="">General</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Split Method</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSplitType("equal")}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                        splitType === "equal"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      Split Equally ({members.length} members)
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-sm"
                  >
                    Record Expense
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add Category */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Group Category</h3>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Flight Tickets"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Color</label>
                  <div className="flex gap-2">
                    {["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCatColor(color)}
                        className={`w-7 h-7 rounded-full transition ${
                          newCatColor === color ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : ""
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-sm"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
