import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { groupService } from "../services/groupService";
import {
  Group,
  GroupMember,
  GroupCategory,
  GroupTransaction,
  GroupSplitRequest,
  GroupSettlementData,
  GroupSplitType,
} from "../types";
import { CURRENCIES, getCurrencySymbol } from "../utils/currency";
import { formatMoney, formatDate } from "../lib/format";
import { Card } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Button, IconButton } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input, Select, Textarea } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { Icons } from "../components/ui/icons";
import { format } from "date-fns";
import { toast } from "sonner";

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [categories, setCategories] = useState<GroupCategory[]>([]);
  const [transactions, setTransactions] = useState<GroupTransaction[]>([]);
  const [splitRequests, setSplitRequests] = useState<GroupSplitRequest[]>([]);
  const [settlementData, setSettlementData] = useState<GroupSettlementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaySplitModal, setShowPaySplitModal] = useState(false);
  const [selectedSplitReq, setSelectedSplitReq] = useState<GroupSplitRequest | null>(null);
  const [paySplitMethod, setPaySplitMethod] = useState("upi");
  const [paySplitNotes, setPaySplitNotes] = useState("");
  const [isPayingSplit, setIsPayingSplit] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedDeclineReq, setSelectedDeclineReq] = useState<GroupSplitRequest | null>(null);
  const [declineNotes, setDeclineNotes] = useState("");
  const [isDecliningSplit, setIsDecliningSplit] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);

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
  const [newCatColor, setNewCatColor] = useState("#0284C7");

  const loadAll = useCallback(async () => {
    if (!groupId) return;
    try {
      setIsLoading(true);
      const [groupDetails, cats, txs, settlements, splitReqs] = await Promise.all([
        groupService.getGroup(groupId),
        groupService.getGroupCategories(groupId),
        groupService.getGroupTransactions(groupId),
        groupService.getGroupSettlements(groupId),
        groupService.getGroupSplitRequests(groupId).catch(() => []),
      ]);

      setGroup(groupDetails.group);
      setMembers(groupDetails.members);
      setCategories(cats);
      setTransactions(txs);
      setSettlementData(settlements);
      setSplitRequests(splitReqs || []);

      if (groupDetails.members.length > 0) {
        setSelectedMemberIds(groupDetails.members.map((m) => m.user_id));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load group details";
      toast.error(message);
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

  const groupCurrency = group?.currency || "INR";
  const currSymbol = getCurrencySymbol(groupCurrency);

  const myNetBalance =
    settlementData?.netBalances.find((b) => b.userId === user?.id)?.net || 0;

  const toggleMemberSelection = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      if (selectedMemberIds.length === 1) {
        toast.error("At least one member must be selected for the split.");
        return;
      }
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !amount || !description) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid expense amount");
      return;
    }

    let splitDetails: Record<string, unknown> | undefined;

    if (splitType === "equal") {
      if (selectedMemberIds.length === 0) {
        toast.error("Select at least one member to split among");
        return;
      }
      splitDetails = {
        participants: selectedMemberIds,
      };
    } else if (splitType === "exact") {
      const totalCustom = Object.values(customAmounts).reduce(
        (sum, v) => sum + (parseFloat(v) || 0),
        0
      );
      if (Math.abs(totalCustom - parsedAmount) > 0.05) {
        toast.error(
          `Sum of split amounts (${formatMoney(totalCustom, groupCurrency)}) must match total expense (${formatMoney(parsedAmount, groupCurrency)})`
        );
        return;
      }
      splitDetails = {
        shares: Object.fromEntries(
          Object.entries(customAmounts).map(([k, v]) => [k, parseFloat(v) || 0])
        ),
      };
    } else if (splitType === "percentage") {
      const totalPct = Object.values(customPercentages).reduce(
        (sum, v) => sum + (parseFloat(v) || 0),
        0
      );
      if (Math.abs(totalPct - 100) > 0.1) {
        toast.error(`Percentages must add up to 100% (currently ${totalPct.toFixed(1)}%)`);
        return;
      }
      splitDetails = {
        percentages: Object.fromEntries(
          Object.entries(customPercentages).map(([k, v]) => [k, parseFloat(v) || 0])
        ),
      };
    } else if (splitType === "shares") {
      const totalShares = Object.values(customShares).reduce(
        (sum, v) => sum + (parseInt(v, 10) || 0),
        0
      );
      if (totalShares <= 0) {
        toast.error("Total shares must be greater than zero");
        return;
      }
      splitDetails = {
        shares: Object.fromEntries(
          Object.entries(customShares).map(([k, v]) => [k, parseInt(v, 10) || 1])
        ),
      };
    }

    try {
      await groupService.createGroupTransaction(groupId, {
        amount: parsedAmount,
        description: description.trim(),
        category_id: categoryId || undefined,
        paid_by: paidBy || user?.id || "",
        date,
        split_type: splitType,
        split_details: splitDetails,
      });

      toast.success("Expense recorded and split requests created!");
      setShowAddModal(false);
      setAmount("");
      setDescription("");
      setCategoryId("");
      setCustomAmounts({});
      setCustomPercentages({});
      setCustomShares({});
      loadAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record expense";
      toast.error(message);
    }
  };

  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !settleAmount || !settleFromUserId || !settleToUserId) return;

    const parsed = parseFloat(settleAmount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setIsSettling(true);
      await groupService.recordSettlementPayment(groupId, {
        from_user_id: settleFromUserId,
        to_user_id: settleToUserId,
        amount: parsed,
        payment_method: settleMethod,
        notes: settleNotes.trim() || undefined,
        date: format(new Date(), "yyyy-MM-dd"),
      });

      toast.success("Settlement payment recorded!");
      setShowSettleModal(false);
      setSettleAmount("");
      setSettleNotes("");
      loadAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record settlement";
      toast.error(message);
    } finally {
      setIsSettling(false);
    }
  };

  const openSettleModal = (fromId: string, toId: string, suggestedAmount: number) => {
    setSettleFromUserId(fromId);
    setSettleToUserId(toId);
    setSettleAmount(suggestedAmount.toString());
    setShowSettleModal(true);
  };

  const handleAcceptSplit = async (req: GroupSplitRequest) => {
    if (!groupId) return;
    try {
      await groupService.updateSplitRequestStatus(groupId, req.id, {
        status: "accepted",
      });
      toast.success("Split amount accepted!");
      loadAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to accept split";
      toast.error(message);
    }
  };

  const handleOpenDeclineSplit = (req: GroupSplitRequest) => {
    setSelectedDeclineReq(req);
    setDeclineNotes("");
    setShowDeclineModal(true);
  };

  const handleDeclineSplitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !selectedDeclineReq) return;

    try {
      setIsDecliningSplit(true);
      await groupService.updateSplitRequestStatus(groupId, selectedDeclineReq.id, {
        status: "declined",
        notes: declineNotes.trim() || undefined,
      });
      toast.success("Split request declined.");
      setShowDeclineModal(false);
      setSelectedDeclineReq(null);
      loadAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to decline split";
      toast.error(message);
    } finally {
      setIsDecliningSplit(false);
    }
  };

  const handleOpenPaySplit = (req: GroupSplitRequest) => {
    setSelectedSplitReq(req);
    setPaySplitMethod("upi");
    setPaySplitNotes("");
    setShowPaySplitModal(true);
  };

  const handlePaySplitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !selectedSplitReq) return;

    try {
      setIsPayingSplit(true);
      await groupService.updateSplitRequestStatus(groupId, selectedSplitReq.id, {
        status: "paid",
        payment_method: paySplitMethod,
        notes: paySplitNotes.trim() || undefined,
      });

      toast.success(
        `Split share settled! The original transaction has been auto-deducted in-place.`
      );
      setShowPaySplitModal(false);
      setSelectedSplitReq(null);
      loadAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to settle split share";
      toast.error(message);
    } finally {
      setIsPayingSplit(false);
    }
  };

  const handleRemindSplit = async (req: GroupSplitRequest) => {
    if (!groupId) return;
    try {
      await groupService.remindSplitRequest(groupId, req.id);
      toast.success(`Reminder sent to ${req.to_name || "member"}!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reminder";
      toast.error(message);
    }
  };

  const handleSettlementAction = async (settlementId: string, action: "approve" | "reject") => {
    if (!groupId) return;
    try {
      await groupService.approveSettlementPayment(groupId, settlementId, action);
      toast.success(action === "approve" ? "Settlement confirmed!" : "Settlement rejected.");
      loadAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Action failed";
      toast.error(message);
    }
  };

  const handleUpdateGroupCurrency = async (newCurrency: string) => {
    if (!groupId || !group) return;
    try {
      await groupService.updateGroupCurrency(groupId, newCurrency);
      setGroup({ ...group, currency: newCurrency });
      toast.success(`Group currency updated to ${newCurrency}`);
      loadAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change group currency";
      toast.error(message);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!groupId || !txToDelete) return;
    try {
      await groupService.deleteGroupTransaction(groupId, txToDelete);
      toast.success("Transaction deleted");
      setTxToDelete(null);
      loadAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete transaction";
      toast.error(message);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12">
        <EmptyState
          icon={<Icons.Groups size={24} />}
          title="Group not found"
          description="The requested group could not be found or access is restricted."
          action={
            <Button variant="primary" onClick={() => navigate("/group")}>
              Back to Groups
            </Button>
          }
        />
      </div>
    );
  }

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingSettlements =
    settlementData?.recordedSettlements?.filter(
      (s) => s.status === "pending" && s.to_user_id === user?.id
    ) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icons.Back size={16} />}
          onClick={() => navigate("/group")}
        >
          Back to Groups
        </Button>
      </div>

      {/* Main Group Header Card */}
      <Card className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text)] tracking-tight">
              {group.name}
            </h1>

            {/* Currency Selector */}
            <div className="relative inline-block">
              <select
                aria-label="Group currency"
                value={groupCurrency}
                onChange={(e) => handleUpdateGroupCurrency(e.target.value)}
                className="px-2.5 py-1 bg-[var(--surface-muted)] border border-[var(--border)] rounded-md text-xs font-mono font-medium text-[var(--text)] cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[var(--primary)] transition"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <span className="px-2.5 py-1 bg-[var(--surface-muted)] rounded-md text-xs font-mono font-medium text-[var(--text-muted)] border border-[var(--border)] flex items-center gap-1">
              CODE: {group.code}
              <IconButton
                variant="ghost"
                size="sm"
                ariaLabel="Copy code"
                icon={<Icons.Copy size={12} />}
                onClick={() => {
                  navigator.clipboard.writeText(group.code);
                  toast.success("Group code copied!");
                }}
              />
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl">
            {group.description || "Shared group expense ledger and automated debt simplification."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Icons.Share size={16} />}
            onClick={() => setShowInviteModal(true)}
          >
            Invite Friends
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Icons.Settle size={16} />}
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
          >
            Settle Up
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Icons.Add size={16} />}
            onClick={() => {
              setPaidBy(user?.id || "");
              setShowAddModal(true);
            }}
          >
            Add Expense
          </Button>
        </div>
      </Card>

      {/* Personal vs Group Currency Notice */}
      {user?.currency && group?.currency && user.currency !== group.currency && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-[var(--primary-subtle)] border border-[var(--primary)]/20 rounded-md text-xs text-[var(--text)]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--primary)]">Currency Note:</span>
            <span>
              This group uses <strong>{group.currency}</strong> ({getCurrencySymbol(group.currency)}), while your personal currency is <strong>{user.currency}</strong> ({getCurrencySymbol(user.currency)}).
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleUpdateGroupCurrency(user.currency!)}
          >
            Switch Group to {user.currency}
          </Button>
        </div>
      )}

      {/* Pending Settlement Confirmations */}
      {pendingSettlements.length > 0 && (
        <Card className="p-4 border-[var(--warning)]/30 bg-[var(--warning-subtle)] space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--warning)]">
            <Icons.Pending size={16} />
            <span>Pending Settlement Confirmations for You</span>
          </div>
          <div className="space-y-2">
            {pendingSettlements.map((s) => (
              <div
                key={s.id}
                className="bg-[var(--surface)] border border-[var(--border)] p-3 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-semibold text-[var(--text)]">
                    {s.from_name || "A member"}
                  </span>{" "}
                  marked payment of{" "}
                  <span className="font-semibold text-[var(--success)] tabular-nums">
                    {formatMoney(s.amount, groupCurrency)}
                  </span>{" "}
                  via <span className="uppercase font-medium">{s.payment_method}</span> on {formatDate(s.date)}.
                  {s.notes && <p className="text-[var(--text-muted)] italic mt-0.5">"{s.notes}"</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSettlementAction(s.id, "approve")}
                  >
                    Confirm Receipt
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSettlementAction(s.id, "reject")}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Overview StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Your Group Balance"
          value={
            myNetBalance > 0.01
              ? `+${formatMoney(myNetBalance, groupCurrency)}`
              : myNetBalance < -0.01
              ? `-${formatMoney(Math.abs(myNetBalance), groupCurrency)}`
              : formatMoney(0, groupCurrency)
          }
          variant={myNetBalance > 0.01 ? "success" : myNetBalance < -0.01 ? "danger" : "default"}
          helperText={
            myNetBalance > 0.01
              ? "You are owed money back overall"
              : myNetBalance < -0.01
              ? "You owe money to group members"
              : "All settled with group"
          }
        />

        <StatCard
          label="Total Group Spending"
          value={formatMoney(totalExpense, groupCurrency)}
          helperText={`${transactions.length} shared expense records`}
        />

        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Members ({members.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInviteModal(true)}
            >
              + Invite
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2 overflow-x-auto py-1">
            {members.map((m) => (
              <div
                key={m.id}
                title={`${m.name || m.email} (${m.role})`}
                className="w-8 h-8 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold flex items-center justify-center shrink-0"
              >
                {(m.name || m.email || "U").charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Split Requests Section */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
          <div>
            <h3 className="text-base font-semibold text-[var(--text)] flex items-center gap-2">
              <Icons.Bell size={18} />
              Split Requests & Approval Workflow
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Review split shares and settle payments. When paid, the payer's personal expense is automatically reduced in-place.
            </p>
          </div>
          <Badge variant="info">Ledger Auto-Deduction</Badge>
        </div>

        {/* Two Columns: Incoming vs Outgoing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Incoming Split Requests */}
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
              Requests Waiting For You ({splitRequests.filter((r) => r.to_user_id === user?.id && r.status !== "paid").length})
            </span>

            {splitRequests.filter((r) => r.to_user_id === user?.id).length === 0 ? (
              <div className="p-6 bg-[var(--surface-muted)] border border-[var(--border)] rounded-md text-center space-y-1">
                <Icons.Check size={20} className="text-[var(--success)] mx-auto" />
                <p className="text-xs font-semibold text-[var(--text)]">No split requests pending for you</p>
                <p className="text-[11px] text-[var(--text-muted)]">You're all settled on group expenses.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {splitRequests
                  .filter((r) => r.to_user_id === user?.id)
                  .map((req) => {
                    const isPending = req.status === "pending";
                    const isPaid = req.status === "paid";
                    const isDeclined = req.status === "declined";

                    return (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[var(--surface-muted)] text-[var(--text)] font-semibold text-xs flex items-center justify-center shrink-0 border border-[var(--border)]">
                              {(req.from_name || "M").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[var(--text)]">
                                {req.from_name} <span className="font-normal text-[var(--text-muted)]">paid for</span> "{req.expense_description}"
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                Total bill: {formatMoney(req.expense_total_amount || 0, groupCurrency)} • {formatDate(req.expense_date)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-semibold text-[var(--text)] tabular-nums block">
                              {formatMoney(req.amount, groupCurrency)}
                            </span>
                            <Badge
                              variant={
                                isPaid ? "success" : req.status === "accepted" ? "info" : isDeclined ? "danger" : "warning"
                              }
                              className="mt-0.5"
                            >
                              {isPaid ? "Paid" : req.status === "accepted" ? "Accepted" : isDeclined ? "Declined" : "Pending Review"}
                            </Badge>
                          </div>
                        </div>

                        {req.notes && (
                          <p className="text-[11px] text-[var(--text-muted)] italic bg-[var(--surface-muted)] p-1.5 rounded-sm">
                            Note: "{req.notes}"
                          </p>
                        )}

                        {!isPaid && !isDeclined && (
                          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                            {isPending && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Icons.Check size={14} />}
                                onClick={() => handleAcceptSplit(req)}
                              >
                                Accept
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Icons.Close size={14} />}
                              onClick={() => handleOpenDeclineSplit(req)}
                            >
                              Decline
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<Icons.Settle size={14} />}
                              onClick={() => handleOpenPaySplit(req)}
                            >
                              Pay Share ({formatMoney(req.amount, groupCurrency)})
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Column 2: Outgoing Split Requests */}
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
              Requests You Sent ({splitRequests.filter((r) => r.from_user_id === user?.id).length})
            </span>

            {splitRequests.filter((r) => r.from_user_id === user?.id).length === 0 ? (
              <div className="p-6 bg-[var(--surface-muted)] border border-[var(--border)] rounded-md text-center space-y-1">
                <Icons.Receipt size={20} className="text-[var(--text-muted)] mx-auto" />
                <p className="text-xs font-semibold text-[var(--text)]">No outgoing split requests</p>
                <p className="text-[11px] text-[var(--text-muted)]">When you record a group expense, members' split requests appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {splitRequests
                  .filter((r) => r.from_user_id === user?.id)
                  .map((req) => {
                    const isPaid = req.status === "paid";
                    const isDeclined = req.status === "declined";

                    return (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[var(--surface-muted)] text-[var(--text)] font-semibold text-xs flex items-center justify-center shrink-0 border border-[var(--border)]">
                              {(req.to_name || "M").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[var(--text)]">
                                {req.to_name} <span className="font-normal text-[var(--text-muted)]">owes share for</span> "{req.expense_description}"
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                Total bill: {formatMoney(req.expense_total_amount || 0, groupCurrency)} • {formatDate(req.expense_date)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-semibold text-[var(--text)] tabular-nums block">
                              {formatMoney(req.amount, groupCurrency)}
                            </span>
                            <Badge
                              variant={isPaid ? "success" : isDeclined ? "danger" : "warning"}
                              className="mt-0.5"
                            >
                              {isPaid ? "Paid" : isDeclined ? "Declined" : "Pending"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[11px]">
                          {isPaid ? (
                            <span className="text-[var(--success)] font-medium flex items-center gap-1">
                              <Icons.Check size={14} />
                              Auto-deducted {formatMoney(req.amount, groupCurrency)} from your personal expense
                            </span>
                          ) : isDeclined ? (
                            <span className="text-[var(--danger)] font-medium">
                              Declined: {req.notes || "Disputed amount"}
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)]">
                              Awaiting payment via UPI / Cash
                            </span>
                          )}

                          {!isPaid && !isDeclined && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Icons.Remind size={14} />}
                              onClick={() => handleRemindSplit(req)}
                            >
                              Remind
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Debt Minimization Engine */}
      {settlementData && (
        <Card className="p-5 space-y-4">
          <div className="border-b border-[var(--border)] pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-[var(--text)] flex items-center gap-2">
                <Icons.Settle size={18} />
                Simplified Debt Settlement
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Calculated to settle all group debts with the fewest possible transactions.
              </p>
            </div>
            <Badge variant="info">Min-Transactions Engine</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Direct Transfers */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Required Settlement Transfers
              </p>
              {settlementData.settlements.length === 0 ? (
                <div className="p-6 bg-[var(--surface-muted)] border border-[var(--border)] rounded-md text-center space-y-1">
                  <Icons.Check size={20} className="text-[var(--success)] mx-auto" />
                  <p className="text-sm font-semibold text-[var(--text)]">All debts settled</p>
                  <p className="text-xs text-[var(--text-muted)]">No member owes any money to anyone right now.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {settlementData.settlements.map((s, idx) => {
                    const isFromMe = s.fromUserId === user?.id;
                    const isToMe = s.toUserId === user?.id;

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-md border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className={isFromMe ? "font-semibold text-[var(--danger)]" : "text-[var(--text)]"}>
                            {isFromMe ? "You" : s.fromName}
                          </span>
                          <Icons.Forward size={14} className="text-[var(--text-muted)]" />
                          <span className={isToMe ? "font-semibold text-[var(--success)]" : "text-[var(--text)]"}>
                            {isToMe ? "You" : s.toName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-semibold tabular-nums text-[var(--text)]">
                            {formatMoney(s.amount, groupCurrency)}
                          </span>
                          {isFromMe && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => openSettleModal(s.fromUserId, s.toUserId, s.amount)}
                            >
                              Settle Now
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Member Net Balances */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Individual Net Standings
              </p>
              <div className="space-y-2">
                {settlementData.netBalances.map((nb) => {
                  const isMe = nb.userId === user?.id;
                  return (
                    <div
                      key={nb.userId}
                      className="p-2.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-md flex items-center justify-between text-xs sm:text-sm"
                    >
                      <span className={isMe ? "font-semibold text-[var(--primary)]" : "text-[var(--text)]"}>
                        {nb.name} {isMe && "(You)"}
                      </span>
                      <span
                        className={`font-semibold tabular-nums ${
                          nb.net > 0.01
                            ? "text-[var(--success)]"
                            : nb.net < -0.01
                            ? "text-[var(--danger)]"
                            : "text-[var(--text-muted)]"
                        }`}
                      >
                        {nb.net > 0.01
                          ? `+${formatMoney(nb.net, groupCurrency)} (gets back)`
                          : nb.net < -0.01
                          ? `-${formatMoney(Math.abs(nb.net), groupCurrency)} (owes)`
                          : formatMoney(0, groupCurrency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Activity Stream */}
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.Receipt size={18} />
            <h3 className="text-base font-semibold text-[var(--text)]">Recent Expenses & Activity</h3>
          </div>
          <span className="text-xs text-[var(--text-muted)]">{transactions.length} items</span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] space-y-2">
              <p className="text-sm">No group expenses recorded yet.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddModal(true)}
              >
                + Add First Group Expense
              </Button>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--surface-muted)] transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] font-semibold text-xs shrink-0">
                    {(tx.category?.name || "E").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-xs sm:text-sm text-[var(--text)]">{tx.description}</p>
                    <p className="text-[11px] text-[var(--text-muted)] flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span>Paid by {tx.paid_by_name || tx.paid_by_email || "Member"} {tx.paid_by === user?.id ? "(You)" : ""}</span>
                      <span>•</span>
                      <span>{formatDate(tx.date)}</span>
                      <span>•</span>
                      <span className="capitalize">{tx.split_type} split</span>
                    </p>

                    {tx.split_summary && tx.split_summary.totalRequests > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <Badge
                          variant={
                            tx.split_summary.paidRequests === tx.split_summary.totalRequests
                              ? "success"
                              : "info"
                          }
                        >
                          {tx.split_summary.paidRequests}/{tx.split_summary.totalRequests} Splits Settled
                        </Badge>
                        {tx.split_summary.paidSum > 0 && (
                          <span className="text-[10px] text-[var(--success)] font-medium">
                            ✓ {formatMoney(tx.split_summary.paidSum, groupCurrency)} auto-deducted
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="font-semibold text-[var(--text)] text-sm sm:text-base tabular-nums block">
                      {formatMoney(tx.amount, groupCurrency)}
                    </span>
                    {tx.paid_by === user?.id && tx.split_summary && tx.split_summary.paidSum > 0 && (
                      <span className="text-[10px] text-[var(--success)] font-medium tabular-nums block">
                        Net: {formatMoney(Math.max(0, tx.amount - tx.split_summary.paidSum), groupCurrency)}
                      </span>
                    )}
                  </div>
                  {(tx.paid_by === user?.id || group.my_role === "admin") && (
                    <IconButton
                      variant="danger"
                      size="sm"
                      ariaLabel="Delete expense"
                      icon={<Icons.Delete size={14} />}
                      onClick={() => setTxToDelete(tx.id)}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Modal: Add Expense */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Group Expense"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <Input
            label={`Amount (${currSymbol} - ${groupCurrency})`}
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />

          <Input
            label="Description"
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Resort Booking, Dinner at Olive Garden, Fuel"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Paid By"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              options={members.map((m) => ({
                label: `${m.name || m.email} ${m.user_id === user?.id ? "(You)" : ""}`,
                value: m.user_id,
              }))}
            />

            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={[
                { label: "General", value: "" },
                ...categories.map((c) => ({ label: c.name, value: c.id })),
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1.5">
              Split Method
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-[var(--surface-muted)] rounded-md text-xs font-medium">
              {(["equal", "exact", "percentage", "shares"] as GroupSplitType[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSplitType(st)}
                  className={`py-1.5 rounded-sm capitalize transition ${
                    splitType === st
                      ? "bg-[var(--surface)] text-[var(--primary)] font-semibold shadow-xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Member split list */}
          <div className="bg-[var(--surface-muted)] p-3 rounded-md border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
              <span>Split among members</span>
              {splitType === "equal" && (
                <span className="text-[var(--primary)] font-semibold">
                  {selectedMemberIds.length > 0 && amount && !isNaN(parseFloat(amount))
                    ? `${formatMoney(parseFloat(amount) / selectedMemberIds.length, groupCurrency)} / person`
                    : `${selectedMemberIds.length} members selected`}
                </span>
              )}
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {members.map((m) => {
                const isSelected = selectedMemberIds.includes(m.user_id);
                return (
                  <div
                    key={m.user_id}
                    className="flex items-center justify-between gap-3 text-xs p-2 bg-[var(--surface)] rounded-md border border-[var(--border)]"
                  >
                    <div
                      onClick={() => splitType === "equal" && toggleMemberSelection(m.user_id)}
                      className={`flex items-center gap-2 flex-1 cursor-pointer select-none ${
                        splitType === "equal" && !isSelected ? "opacity-50" : ""
                      }`}
                    >
                      {splitType === "equal" && (
                        <span>
                          {isSelected ? (
                            <Icons.Check size={14} className="text-[var(--primary)]" />
                          ) : (
                            <div className="w-3.5 h-3.5 border border-[var(--border)] rounded-xs" />
                          )}
                        </span>
                      )}
                      <span className="font-medium text-[var(--text)]">
                        {m.name || m.email} {m.user_id === user?.id && "(You)"}
                      </span>
                    </div>

                    {splitType === "exact" && (
                      <div className="flex items-center gap-1 w-28">
                        <span className="text-[var(--text-muted)] font-mono">{currSymbol}</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={customAmounts[m.user_id] || ""}
                          onChange={(e) =>
                            setCustomAmounts({ ...customAmounts, [m.user_id]: e.target.value })
                          }
                          className="w-full px-2 py-1 text-xs bg-[var(--surface-muted)] rounded-sm border border-[var(--border)] text-[var(--text)]"
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
                          className="w-full px-2 py-1 text-xs bg-[var(--surface-muted)] rounded-sm border border-[var(--border)] text-[var(--text)]"
                        />
                        <span className="text-[var(--text-muted)]">%</span>
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
                          className="w-full px-2 py-1 text-xs bg-[var(--surface-muted)] rounded-sm border border-[var(--border)] text-[var(--text)]"
                        />
                        <span className="text-[var(--text-muted)] text-[10px]">shares</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
            >
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Settle Payment */}
      <Modal
        isOpen={showSettleModal}
        onClose={() => setShowSettleModal(false)}
        title="Record Settlement Payment"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSettlePayment} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="From (Payer)"
              value={settleFromUserId}
              onChange={(e) => setSettleFromUserId(e.target.value)}
              options={members.map((m) => ({
                label: `${m.name || m.email} ${m.user_id === user?.id ? "(You)" : ""}`,
                value: m.user_id,
              }))}
            />

            <Select
              label="To (Recipient)"
              value={settleToUserId}
              onChange={(e) => setSettleToUserId(e.target.value)}
              options={members
                .filter((m) => m.user_id !== settleFromUserId)
                .map((m) => ({
                  label: `${m.name || m.email} ${m.user_id === user?.id ? "(You)" : ""}`,
                  value: m.user_id,
                }))}
            />
          </div>

          <Input
            label={`Amount (${currSymbol})`}
            type="number"
            step="0.01"
            required
            value={settleAmount}
            onChange={(e) => setSettleAmount(e.target.value)}
            placeholder="0.00"
          />

          <Select
            label="Payment Method"
            value={settleMethod}
            onChange={(e) => setSettleMethod(e.target.value)}
            options={[
              { label: "Google Pay / UPI / PhonePe", value: "upi" },
              { label: "Cash in Hand", value: "cash" },
              { label: "Direct Bank Wire / IMPS", value: "bank_transfer" },
              { label: "PayPal", value: "paypal" },
              { label: "Other Payment Mode", value: "other" },
            ]}
          />

          <Input
            label="Notes (Optional)"
            type="text"
            value={settleNotes}
            onChange={(e) => setSettleNotes(e.target.value)}
            placeholder="e.g. Sent via UPI Ref #12345"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowSettleModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSettling}
            >
              {isSettling ? "Recording..." : "Confirm Settlement"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Invite Members */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title={`Invite Members to ${group.name}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-muted)]">
            Anyone with this link can join this group and start adding or splitting expenses.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
              Direct Invite Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/join-group/${group.code}`}
                className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-md text-[var(--text)] font-mono"
              />
              <Button
                variant="primary"
                size="sm"
                icon={copiedLink ? <Icons.Check size={14} /> : <Icons.Copy size={14} />}
                onClick={copyInviteLink}
              >
                {copiedLink ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
              Group Code
            </label>
            <div className="p-3 bg-[var(--surface-muted)] rounded-md border border-[var(--border)] flex items-center justify-between">
              <span className="font-mono text-lg font-bold text-[var(--primary)] tracking-widest">
                {group.code}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(group.code);
                  toast.success("Group code copied!");
                }}
              >
                Copy Code
              </Button>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Join my expense group "${group.name}" on TrustTracker: ${window.location.origin}/join-group/${group.code}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2 bg-[var(--surface-muted)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text)] rounded-md text-xs font-semibold transition"
            >
              Share WhatsApp
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(
                `Invitation to join "${group.name}" on TrustTracker`
              )}&body=${encodeURIComponent(
                `Hey! Click the link below to join our shared expense group on TrustTracker:\n\n${window.location.origin}/join-group/${group.code}\n\nGroup Code: ${group.code}`
              )}`}
              className="flex-1 text-center py-2 bg-[var(--surface-muted)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text)] rounded-md text-xs font-semibold transition"
            >
              Share Email
            </a>
          </div>
        </div>
      </Modal>

      {/* Modal: Pay Split Share */}
      <Modal
        isOpen={showPaySplitModal && !!selectedSplitReq}
        onClose={() => setShowPaySplitModal(false)}
        title="Settle Your Split Share"
        maxWidth="max-w-md"
      >
        {selectedSplitReq && (
          <form onSubmit={handlePaySplitSubmit} className="space-y-4">
            <div className="p-3.5 bg-[var(--surface-muted)] rounded-md border border-[var(--border)] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Expense Item</span>
                <span className="font-semibold text-[var(--text)]">{selectedSplitReq.expense_description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Paid By</span>
                <span className="font-medium text-[var(--text)]">{selectedSplitReq.from_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Total Bill</span>
                <span className="font-medium text-[var(--text)]">{formatMoney(selectedSplitReq.expense_total_amount || 0, groupCurrency)}</span>
              </div>
              <div className="border-t border-[var(--border)] pt-2 flex justify-between items-center">
                <span className="font-semibold text-[var(--text)]">Your Share</span>
                <span className="text-base font-bold text-[var(--success)] tabular-nums">
                  {formatMoney(selectedSplitReq.amount, groupCurrency)}
                </span>
              </div>
            </div>

            <Select
              label="Payment Method"
              value={paySplitMethod}
              onChange={(e) => setPaySplitMethod(e.target.value)}
              options={[
                { label: "Google Pay / UPI / PhonePe", value: "upi" },
                { label: "Cash in Hand", value: "cash" },
                { label: "Bank Transfer / IMPS", value: "bank_transfer" },
                { label: "PayPal", value: "paypal" },
                { label: "Other", value: "other" },
              ]}
            />

            <Input
              label="Notes / Ref ID (Optional)"
              type="text"
              value={paySplitNotes}
              onChange={(e) => setPaySplitNotes(e.target.value)}
              placeholder="e.g. Sent via GPay UPI ref #987654"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowPaySplitModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isPayingSplit}
              >
                {isPayingSplit ? "Processing..." : `Confirm Payment (${formatMoney(selectedSplitReq.amount, groupCurrency)})`}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Decline Split Request */}
      <Modal
        isOpen={showDeclineModal && !!selectedDeclineReq}
        onClose={() => setShowDeclineModal(false)}
        title="Decline Split Request"
        maxWidth="max-w-md"
      >
        {selectedDeclineReq && (
          <form onSubmit={handleDeclineSplitSubmit} className="space-y-4">
            <p className="text-xs text-[var(--text-muted)]">
              You are declining the split share of <strong>{formatMoney(selectedDeclineReq.amount, groupCurrency)}</strong> for "{selectedDeclineReq.expense_description}". Let {selectedDeclineReq.from_name} know why.
            </p>

            <Textarea
              label="Reason for Declining"
              rows={3}
              required
              value={declineNotes}
              onChange={(e) => setDeclineNotes(e.target.value)}
              placeholder="e.g. I didn't participate in this expense, or the split amount is incorrect."
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="secondary"
                onClick={() => setShowDeclineModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                type="submit"
                disabled={isDecliningSplit}
              >
                {isDecliningSplit ? "Declining..." : "Confirm Decline"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={handleDeleteTransaction}
        title="Delete Group Expense"
        message="Are you sure you want to delete this expense? Any split requests and ledger entries associated with it will be removed."
        confirmText="Delete Expense"
      />
    </div>
  );
}
