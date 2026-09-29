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
  GroupSplitType,
  GroupSettlementPayment,
} from "../types";
import { formatCurrency, getCurrencySymbol } from "../utils/currency";
import { Dropdown } from "../components/ui/Dropdown";
import { Badge } from "../components/ui/Badge";
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
  Share2,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  HelpCircle,
  Receipt,
  Wallet,
  Divide,
  Percent,
  Layers,
  CheckSquare,
  Square,
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
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Add Expense Form State
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paidBy, setPaidBy] = useState<string>("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [splitType, setSplitType] = useState<GroupSplitType>("equal");

  // Multi-participant selection & split details
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [customPercentages, setCustomPercentages] = useState<Record<string, string>>({});
  const [customShares, setCustomShares] = useState<Record<string, string>>({});

  // Settle Up Form State
  const [settleFromUserId, setSettleFromUserId] = useState("");
  const [settleToUserId, setSettleToUserId] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [settleMethod, setSettleMethod] = useState("upi");
  const [settleNotes, setSettleNotes] = useState("");
  const [isSettling, setIsSettling] = useState(false);

  // Category Modal Form State
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

      // Initialize default selections
      if (groupDetails.members.length > 0) {
        setSelectedMemberIds(groupDetails.members.map((m) => m.user_id));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load group details");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (user?.id && !paidBy) {
      setPaidBy(user.id);
    }
  }, [user, paidBy]);

  const groupCurrency = group?.currency || user?.currency || "USD";
  const currSymbol = getCurrencySymbol(groupCurrency);

  // Calculate user's personal balance in this group
  const myNetBalance = settlementData?.netBalances.find((nb) => nb.userId === user?.id)?.net || 0;

  // Pre-fill Settle Up Modal from a specific transfer
  const openSettleModal = (fromUserId: string, toUserId: string, defaultAmount: number) => {
    setSettleFromUserId(fromUserId);
    setSettleToUserId(toUserId);
    setSettleAmount(defaultAmount.toFixed(2));
    setSettleNotes(`Settled via ${settleMethod.toUpperCase()}`);
    setShowSettleModal(true);
  };

  // Toggle participant in Equal Split
  const toggleMemberSelection = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      if (selectedMemberIds.length > 1) {
        setSelectedMemberIds(selectedMemberIds.filter((id) => id !== memberId));
      } else {
        toast.info("At least one member must be selected for the split.");
      }
    } else {
      setSelectedMemberIds([...selectedMemberIds, memberId]);
    }
  };

  // Handle Add Expense
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !amount || !description) {
      toast.error("Please enter an amount and description.");
      return;
    }

    const totalNum = parseFloat(amount);
    if (isNaN(totalNum) || totalNum <= 0) {
      toast.error("Amount must be greater than zero.");
      return;
    }

    const splitDetails: Record<string, number> = {};

    if (splitType === "equal") {
      const share = totalNum / selectedMemberIds.length;
      selectedMemberIds.forEach((uid) => {
        splitDetails[uid] = Math.round(share * 100) / 100;
      });
    } else if (splitType === "exact") {
      let sum = 0;
      for (const m of members) {
        const val = parseFloat(customAmounts[m.user_id] || "0") || 0;
        splitDetails[m.user_id] = val;
        sum += val;
      }
      if (Math.abs(sum - totalNum) > 0.05) {
        toast.error(`The exact splits sum to ${formatCurrency(sum, groupCurrency)}, but the total is ${formatCurrency(totalNum, groupCurrency)}.`);
        return;
      }
    } else if (splitType === "percentage") {
      let pctSum = 0;
      for (const m of members) {
        const pct = parseFloat(customPercentages[m.user_id] || "0") || 0;
        splitDetails[m.user_id] = pct;
        pctSum += pct;
      }
      if (Math.abs(pctSum - 100) > 0.1) {
        toast.error(`Percentages must total 100% (currently ${pctSum}%).`);
        return;
      }
    } else if (splitType === "shares") {
      for (const m of members) {
        const s = parseFloat(customShares[m.user_id] || "1") || 1;
        splitDetails[m.user_id] = s;
      }
    }

    try {
      await groupService.createGroupTransaction(groupId, {
        amount: totalNum,
        description: description.trim(),
        category_id: categoryId || null,
        date,
        split_type: splitType,
        split_details: splitDetails,
        paid_by: paidBy || user?.id,
      });

      toast.success("Group expense recorded!");
      setShowAddModal(false);
      setAmount("");
      setDescription("");
      setCustomAmounts({});
      setCustomPercentages({});
      setCustomShares({});
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to record expense");
    }
  };

  // Handle Settle Up Payment
  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !settleToUserId || !settleAmount) {
      toast.error("Please fill in recipient and amount.");
      return;
    }

    try {
      setIsSettling(true);
      await groupService.settlePayment(groupId, {
        from_user_id: settleFromUserId || user?.id,
        to_user_id: settleToUserId,
        amount: parseFloat(settleAmount),
        payment_method: settleMethod,
        notes: settleNotes.trim(),
        auto_confirm: true,
      });

      toast.success("Settlement payment recorded!");
      setShowSettleModal(false);
      setSettleAmount("");
      setSettleNotes("");
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to record settlement");
    } finally {
      setIsSettling(false);
    }
  };

  // Handle Settlement Approval / Rejection
  const handleSettlementAction = async (settleId: string, action: "approve" | "reject") => {
    if (!groupId) return;
    try {
      await groupService.approveSettlement(groupId, settleId, action);
      toast.success(action === "approve" ? "Settlement approved!" : "Settlement rejected.");
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update settlement");
    }
  };

  // Handle Delete Settlement
  const handleDeleteSettlement = async (settleId: string) => {
    if (!groupId) return;
    if (!window.confirm("Are you sure you want to delete this settlement record?")) return;
    try {
      await groupService.deleteSettlement(groupId, settleId);
      toast.success("Settlement record deleted.");
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete settlement");
    }
  };

  // Handle Create Category
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

  // Handle Delete Transaction
  const handleDeleteTransaction = async (txId: string) => {
    if (!groupId) return;
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
      await groupService.deleteGroupTransaction(groupId, txId);
      toast.success("Transaction deleted");
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete transaction");
    }
  };

  const copyInviteLink = () => {
    if (!group) return;
    const inviteUrl = `${window.location.origin}/join-group/${group.code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
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
      <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto my-12 shadow-sm">
        <p className="text-slate-400">Group not found or access restricted.</p>
        <button
          onClick={() => navigate("/group")}
          className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingSettlements = settlementData?.recordedSettlements?.filter(
    (s) => s.status === "pending" && s.to_user_id === user?.id
  ) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button */}
      <button
        onClick={() => navigate("/group")}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Groups
      </button>

      {/* Main Group Header Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{group.name}</h1>
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-mono font-bold text-indigo-300">
              {groupCurrency}
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono font-semibold text-slate-300">
              CODE: {group.code}
            </span>
          </div>
          <p className="text-sm text-slate-300 max-w-xl">
            {group.description || "Shared group expense ledger and automated debt simplification."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Invite Friends
          </button>
          <button
            onClick={() => {
              if (members.length >= 2) {
                const other = members.find((m) => m.user_id !== user?.id);
                setSettleFromUserId(user?.id || "");
                setSettleToUserId(other?.user_id || "");
                setSettleAmount("");
                setShowSettleModal(true);
              } else {
                toast.info("Add at least 2 members to settle debts.");
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            Settle Up
          </button>
          <button
            onClick={() => {
              setPaidBy(user?.id || "");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Pending Settlement Approvals Alert */}
      {pendingSettlements.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-900 dark:text-amber-200 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-500">
            <Clock className="w-4 h-4" />
            <span>Pending Settlement Confirmations for You</span>
          </div>
          <div className="space-y-2">
            {pendingSettlements.map((s) => (
              <div
                key={s.id}
                className="bg-white/60 dark:bg-slate-800/80 border border-amber-500/20 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {s.from_name || "A member"}
                  </span>{" "}
                  marked payment of{" "}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(s.amount, groupCurrency)}
                  </span>{" "}
                  to you via <span className="uppercase font-semibold">{s.payment_method}</span> on {s.date}.
                  {s.notes && <p className="text-slate-500 italic mt-0.5">"{s.notes}"</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSettlementAction(s.id, "approve")}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition cursor-pointer"
                  >
                    Confirm Receipt
                  </button>
                  <button
                    onClick={() => handleSettlementAction(s.id, "reject")}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Personal Standing */}
        <div
          className={`p-5 rounded-2xl border shadow-sm ${
            myNetBalance > 0.01
              ? "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-950/30"
              : myNetBalance < -0.01
              ? "bg-rose-500/10 border-rose-500/20 dark:bg-rose-950/30"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/60"
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your Group Balance</span>
          <p
            className={`text-2xl font-extrabold mt-1 ${
              myNetBalance > 0.01
                ? "text-emerald-600 dark:text-emerald-400"
                : myNetBalance < -0.01
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {myNetBalance > 0.01
              ? `+ ${formatCurrency(myNetBalance, groupCurrency)}`
              : myNetBalance < -0.01
              ? `- ${formatCurrency(Math.abs(myNetBalance), groupCurrency)}`
              : "All Settled Up ($0)"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {myNetBalance > 0.01
              ? "You are owed money back overall"
              : myNetBalance < -0.01
              ? "You owe money to group members"
              : "You have no outstanding debts"}
          </p>
        </div>

        {/* Card 2: Total Group Spend */}
        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Group Spending</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalExpense, groupCurrency)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{transactions.length} shared expense records</p>
        </div>

        {/* Card 3: Members */}
        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Members ({members.length})</span>
            <button
              onClick={() => setShowInviteModal(true)}
              className="text-xs text-indigo-500 hover:text-indigo-400 font-semibold cursor-pointer"
            >
              + Invite
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2 overflow-x-auto py-1">
            {members.map((m) => (
              <div
                key={m.id}
                title={`${m.name || m.email} (${m.role})`}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-bold flex items-center justify-center flex-shrink-0 border border-indigo-500/20 shadow-sm"
              >
                {(m.name || m.email || "U").charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Debt Minimization Engine (Splitwise / Google Pay Style) */}
      {settlementData && (
        <div className="bg-slate-900 border border-indigo-500/20 rounded-3xl p-6 shadow-xl text-white space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Simplified Debt Settlement ("Who Owes Whom")
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated using the Greedy Min-Cash-Flow algorithm to settle all debts in minimum possible transactions.
              </p>
            </div>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-mono font-bold">
              Min-Transactions Engine
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Direct Transfers */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Required Settlement Transfers
              </p>
              {settlementData.settlements.length === 0 ? (
                <div className="p-8 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-white">All group debts are completely settled up!</p>
                  <p className="text-xs text-slate-400">No member owes any money to anyone right now.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {settlementData.settlements.map((s, idx) => {
                    const isFromMe = s.fromUserId === user?.id;
                    const isToMe = s.toUserId === user?.id;

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl flex items-center justify-between text-sm transition border ${
                          isFromMe
                            ? "bg-rose-950/40 border-rose-500/40"
                            : isToMe
                            ? "bg-emerald-950/40 border-emerald-500/40"
                            : "bg-slate-800/70 border-slate-700/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isFromMe ? "text-rose-300 underline" : "text-slate-200"}`}>
                              {isFromMe ? "You" : s.fromName}
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                            <span className={`font-bold ${isToMe ? "text-emerald-300 underline" : "text-slate-200"}`}>
                              {isToMe ? "You" : s.toName}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-white bg-indigo-600/90 px-3 py-1 rounded-xl text-xs shadow-sm">
                            {formatCurrency(s.amount, groupCurrency)}
                          </span>
                          {isFromMe && (
                            <button
                              onClick={() => openSettleModal(s.fromUserId, s.toUserId, s.amount)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
                            >
                              Settle Now
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Member Net Balances */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Individual Net Standings
              </p>
              <div className="space-y-2">
                {settlementData.netBalances.map((nb) => {
                  const isMe = nb.userId === user?.id;
                  return (
                    <div
                      key={nb.userId}
                      className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isMe ? "text-indigo-300" : "text-slate-200"}`}>
                          {nb.name} {isMe && "(You)"}
                        </span>
                      </div>
                      <span
                        className={`font-bold ${
                          nb.net > 0.01
                            ? "text-emerald-400"
                            : nb.net < -0.01
                            ? "text-rose-400"
                            : "text-slate-400"
                        }`}
                      >
                        {nb.net > 0.01
                          ? `+ ${formatCurrency(nb.net, groupCurrency)} (gets back)`
                          : nb.net < -0.01
                          ? `- ${formatCurrency(Math.abs(nb.net), groupCurrency)} (owes)`
                          : "Settled ($0)"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Stream */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Expenses & Activity</h3>
          </div>
          <span className="text-xs text-slate-400">{transactions.length} items</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p>No group expenses recorded yet.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
              >
                + Add First Group Expense
              </button>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ backgroundColor: tx.category?.color || "#6366F1" }}
                  >
                    {(tx.category?.name || "E").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{tx.description}</p>
                    <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                      <span>Paid by {tx.paid_by_name || tx.paid_by_email || "Member"}</span>
                      <span>•</span>
                      <span>{format(new Date(tx.date), "MMM d, yyyy")}</span>
                      <span>•</span>
                      <span className="capitalize px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] font-semibold">
                        {tx.split_type} split
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-slate-900 dark:text-white text-base">
                    {formatCurrency(tx.amount, groupCurrency)}
                  </span>
                  {(tx.paid_by === user?.id || group.my_role === "admin") && (
                    <button
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Add Expense (Splitwise / Google Pay Style) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-500" />
                  Add Group Expense
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="space-y-4">
                {/* Amount and Currency */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Amount ({currSymbol} - {groupCurrency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">
                      {currSymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-extrabold text-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Resort Booking, Dinner at Olive Garden, Fuel"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Paid By and Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Paid By</label>
                    <select
                      value={paidBy}
                      onChange={(e) => setPaidBy(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                    >
                      {members.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.name || m.email} {m.user_id === user?.id ? "(You)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

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
                </div>

                {/* Split Method Tabs */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Split Method
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setSplitType("equal")}
                      className={`py-2 rounded-xl transition ${
                        splitType === "equal"
                          ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      = Equal
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitType("exact")}
                      className={`py-2 rounded-xl transition ${
                        splitType === "exact"
                          ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Exact {currSymbol}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitType("percentage")}
                      className={`py-2 rounded-xl transition ${
                        splitType === "percentage"
                          ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      % Percent
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitType("shares")}
                      className={`py-2 rounded-xl transition ${
                        splitType === "shares"
                          ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Shares
                    </button>
                  </div>
                </div>

                {/* Split Participants Inputs */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>Split among members</span>
                    {splitType === "equal" && (
                      <span className="text-indigo-500">
                        {selectedMemberIds.length > 0 && amount && !isNaN(parseFloat(amount))
                          ? `${formatCurrency(parseFloat(amount) / selectedMemberIds.length, groupCurrency)} / person`
                          : `${selectedMemberIds.length} people selected`}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {members.map((m) => {
                      const isSelected = selectedMemberIds.includes(m.user_id);

                      return (
                        <div
                          key={m.user_id}
                          className="flex items-center justify-between gap-3 text-xs p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50"
                        >
                          <div
                            onClick={() => splitType === "equal" && toggleMemberSelection(m.user_id)}
                            className={`flex items-center gap-2 flex-1 cursor-pointer select-none ${
                              splitType === "equal" && !isSelected ? "opacity-40" : ""
                            }`}
                          >
                            {splitType === "equal" && (
                              <span>
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                              </span>
                            )}
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {m.name || m.email} {m.user_id === user?.id && "(You)"}
                            </span>
                          </div>

                          {splitType === "exact" && (
                            <div className="flex items-center gap-1 w-28">
                              <span className="text-slate-400 font-bold">{currSymbol}</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={customAmounts[m.user_id] || ""}
                                onChange={(e) =>
                                  setCustomAmounts({ ...customAmounts, [m.user_id]: e.target.value })
                                }
                                className="w-full px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                              />
                            </div>
                          )}

                          {splitType === "percentage" && (
                            <div className="flex items-center gap-1 w-24">
                              <input
                                type="number"
                                step="0.1"
                                placeholder="0"
                                value={customPercentages[m.user_id] || ""}
                                onChange={(e) =>
                                  setCustomPercentages({ ...customPercentages, [m.user_id]: e.target.value })
                                }
                                className="w-full px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                              />
                              <span className="text-slate-400 font-bold">%</span>
                            </div>
                          )}

                          {splitType === "shares" && (
                            <div className="flex items-center gap-1 w-24">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                placeholder="1"
                                value={customShares[m.user_id] || "1"}
                                onChange={(e) =>
                                  setCustomShares({ ...customShares, [m.user_id]: e.target.value })
                                }
                                className="w-full px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                              />
                              <span className="text-slate-400 font-semibold text-[10px]">shares</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Settle Up Payment */}
      <AnimatePresence>
        {showSettleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                  Record Settlement Payment
                </h3>
                <button
                  onClick={() => setShowSettleModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSettlePayment} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">From (Payer)</label>
                    <select
                      value={settleFromUserId}
                      onChange={(e) => setSettleFromUserId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs"
                    >
                      {members.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.name || m.email} {m.user_id === user?.id ? "(You)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">To (Recipient)</label>
                    <select
                      value={settleToUserId}
                      onChange={(e) => setSettleToUserId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs"
                    >
                      {members
                        .filter((m) => m.user_id !== settleFromUserId)
                        .map((m) => (
                          <option key={m.user_id} value={m.user_id}>
                            {m.name || m.email} {m.user_id === user?.id ? "(You)" : ""}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Amount ({currSymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={settleMethod}
                    onChange={(e) => setSettleMethod(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                  >
                    <option value="upi">Google Pay / UPI / PhonePe</option>
                    <option value="cash">Cash in Hand</option>
                    <option value="bank_transfer">Direct Bank Wire / IMPS</option>
                    <option value="paypal">PayPal</option>
                    <option value="other">Other Payment Mode</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    placeholder="e.g. Sent via UPI Ref #12345"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSettleModal(false)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSettling}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSettling ? "Recording..." : "Confirm Settlement"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Share Invite Link */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-indigo-500" />
                  Invite Members to {group.name}
                </h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Anyone with this link can join this group and start adding or splitting expenses.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Direct Invite Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/join-group/${group.code}`}
                      className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 font-mono"
                    />
                    <button
                      onClick={copyInviteLink}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer flex-shrink-0"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Group Code</label>
                  <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-mono text-lg font-extrabold text-indigo-600 dark:text-indigo-400 tracking-widest">
                      {group.code}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(group.code);
                        toast.success("Group code copied!");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold cursor-pointer"
                    >
                      Copy Code
                    </button>
                  </div>
                </div>

                {/* Quick Share Links */}
                <div className="pt-2 flex gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Join my expense group "${group.name}" on Trust-Tracker: ${window.location.origin}/join-group/${group.code}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    Share via WhatsApp
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(
                      `Invitation to join "${group.name}" on Trust-Tracker`
                    )}&body=${encodeURIComponent(
                      `Hey! Click the link below to join our shared expense group on Trust-Tracker:\n\n${window.location.origin}/join-group/${group.code}\n\nGroup Code: ${group.code}`
                    )}`}
                    className="flex-1 text-center py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition"
                  >
                    Share via Email
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
