import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Debt, DebtSummary, DebtPayment } from "../types";
import { CURRENCIES, formatCurrency, getCurrencySymbol } from "../utils/currency";
import { Dropdown } from "../components/ui/Dropdown";
import { Badge } from "../components/ui/Badge";
import {
  Handshake,
  Plus,
  Calendar,
  CreditCard,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  User,
  Phone,
  MessageCircle,
  TrendingDown,
  TrendingUp,
  History,
  Check,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { usePageHeader } from "../contexts/PageHeaderContext";

export default function Debts() {
  const { user } = useAuth();
  const { setPageHeader } = usePageHeader();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageHeader("Debts & Lender Ledger");
  }, [setPageHeader]);

  // Tab filter
  const [activeTab, setActiveTab] = useState<"all" | "i_owe" | "owed_to_me" | "settled">("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<DebtPayment[]>([]);

  // Add Debt Form State
  const [counterpartyName, setCounterpartyName] = useState("");
  const [counterpartyContact, setCounterpartyContact] = useState("");
  const [debtType, setDebtType] = useState<"i_owe" | "owed_to_me">("owed_to_me");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(user?.currency || "USD");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Repayment Form State
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [payNotes, setPayNotes] = useState("");
  const [recordInTx, setRecordInTx] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  const loadDebts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.debts.list();
      setDebts(res.debts);
      setSummary(res.summary);
    } catch (err: any) {
      toast.error(err.message || "Failed to load debts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterpartyName || !amount || parseFloat(amount) <= 0) {
      toast.error("Please provide person name and a valid amount.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.debts.create({
        counterparty_name: counterpartyName.trim(),
        counterparty_contact: counterpartyContact.trim(),
        type: debtType,
        amount: parseFloat(amount),
        currency,
        due_date: dueDate || null,
        notes: notes.trim(),
      });

      toast.success("Debt record added!");
      setShowAddModal(false);
      setCounterpartyName("");
      setCounterpartyContact("");
      setAmount("");
      setDueDate("");
      setNotes("");
      loadDebts();
    } catch (err: any) {
      toast.error(err.message || "Failed to create debt record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !payAmount || parseFloat(payAmount) <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    try {
      setIsPaying(true);
      await api.debts.recordPayment(selectedDebt.id, {
        amount: parseFloat(payAmount),
        payment_date: payDate,
        notes: payNotes.trim(),
        record_in_transactions: recordInTx,
      });

      toast.success("Repayment recorded successfully!");
      setShowPayModal(false);
      setSelectedDebt(null);
      setPayAmount("");
      setPayNotes("");
      loadDebts();
    } catch (err: any) {
      toast.error(err.message || "Failed to record repayment");
    } finally {
      setIsPaying(false);
    }
  };

  const viewHistory = async (debt: Debt) => {
    try {
      setSelectedDebt(debt);
      const res = await api.debts.get(debt.id);
      setPaymentHistory(res.payments);
      setShowHistoryModal(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to load payment history");
    }
  };

  const openReminderModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowReminderModal(true);
  };

  const generateWhatsAppReminderUrl = (debt: Debt) => {
    const dCurr = debt.currency || user?.currency || "USD";
    const msg = `Hi ${debt.counterparty_name}, friendly reminder regarding the outstanding balance of ${formatCurrency(
      debt.remaining_balance || debt.amount,
      dCurr
    )} on Trust-Tracker. Thanks!`;
    const cleanPhone = (debt.counterparty_contact || "").replace(/[^0-9]/g, "");
    return cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const handleDeleteDebt = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this debt ledger entry?")) return;
    try {
      await api.debts.delete(id);
      toast.success("Debt record deleted.");
      loadDebts();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete debt");
    }
  };

  const currencyOptions = CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.flag || ""} ${c.code} (${c.symbol}) - ${c.name}`,
    badge: c.symbol,
  }));

  const filteredDebts = debts.filter((d) => {
    if (activeTab === "all") return true;
    if (activeTab === "settled") return d.status === "settled";
    return d.type === activeTab && d.status !== "settled";
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-end mb-2">
        <button
          onClick={() => {
            setCurrency(user?.currency || "USD");
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-md shadow-primary-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Debt Record
        </button>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Owed to Me */}
          <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Money Owed to You</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(summary.totalOwedToMe, user?.currency)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Receivable from others</p>
          </div>

          {/* I Owe */}
          <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Money You Owe</span>
              <ArrowUpRight className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {formatCurrency(summary.totalIOwe, user?.currency)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Payable to lenders</p>
          </div>

          {/* Net Position */}
          <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Standing</span>
            <p
              className={`text-2xl font-extrabold mt-1 ${
                summary.netBalance > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : summary.netBalance < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {summary.netBalance > 0
                ? `+ ${formatCurrency(summary.netBalance, user?.currency)}`
                : summary.netBalance < 0
                ? `- ${formatCurrency(Math.abs(summary.netBalance), user?.currency)}`
                : "$0.00"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {summary.netBalance >= 0 ? "You are a net creditor" : "You have net payables"}
            </p>
          </div>

          {/* Overdue / Active */}
          <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Records</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {summary.activeCount}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {summary.overdueCount > 0 ? (
                <span className="text-rose-500 font-semibold">{summary.overdueCount} overdue entries!</span>
              ) : (
                `${summary.settledCount} fully settled`
              )}
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "all"
              ? "bg-primary-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          All ({debts.length})
        </button>
        <button
          onClick={() => setActiveTab("owed_to_me")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "owed_to_me"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Owed to Me (Receivables)
        </button>
        <button
          onClick={() => setActiveTab("i_owe")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "i_owe"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          I Owe (Payables)
        </button>
        <button
          onClick={() => setActiveTab("settled")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "settled"
              ? "bg-primary-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Settled
        </button>
      </div>

      {/* Debts List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : filteredDebts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center mx-auto mb-4">
            <Handshake className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Debt Records Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Record informal loans, shared bills, or personal credit with friends and colleagues to keep a clean, transparent repayment ledger.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow-sm cursor-pointer"
          >
            Add Your First Record
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDebts.map((debt) => {
            const dCurr = debt.currency || user?.currency || "USD";
            const isOwedToMe = debt.type === "owed_to_me";
            const isSettled = debt.status === "settled";

            return (
              <motion.div
                key={debt.id}
                whileHover={{ y: -2 }}
                className={`bg-white dark:bg-slate-800 border rounded-3xl p-6 shadow-sm flex flex-col justify-between transition ${
                  isSettled
                    ? "border-slate-200 dark:border-slate-700/40 opacity-70"
                    : isOwedToMe
                    ? "border-emerald-500/30 dark:border-emerald-500/20"
                    : "border-rose-500/30 dark:border-rose-500/20"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${
                          isOwedToMe
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-rose-500/10 text-rose-500"
                        }`}
                      >
                        {debt.counterparty_name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {debt.counterparty_name}
                        </h3>
                        {debt.counterparty_contact && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" /> {debt.counterparty_contact}
                          </p>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant={isSettled ? "success" : isOwedToMe ? "success" : "danger"}
                      size="sm"
                    >
                      {isSettled
                        ? "Settled"
                        : isOwedToMe
                        ? "Owed to You"
                        : "You Owe"}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Remaining Balance</span>
                      <p
                        className={`text-2xl font-extrabold ${
                          isSettled
                            ? "text-slate-400 line-through"
                            : isOwedToMe
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {formatCurrency(debt.remaining_balance !== undefined ? debt.remaining_balance : debt.amount, dCurr)}
                      </p>
                    </div>

                    <div className="text-right text-xs text-slate-400">
                      <span>Total Principal: {formatCurrency(debt.amount, dCurr)}</span>
                      {debt.due_date && (
                        <p className="mt-0.5 flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" /> Due: {format(new Date(debt.due_date), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Paid: {formatCurrency(debt.amount_paid || 0, dCurr)}</span>
                      <span>{debt.progress_percent || 0}% settled</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOwedToMe ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${debt.progress_percent || 0}%` }}
                      />
                    </div>
                  </div>

                  {debt.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl">
                      "{debt.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!isSettled && (
                      <button
                        onClick={() => {
                          setSelectedDebt(debt);
                          setPayAmount((debt.remaining_balance || debt.amount).toString());
                          setShowPayModal(true);
                        }}
                        className="px-3.5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Record Repayment
                      </button>
                    )}

                    {isOwedToMe && !isSettled && (
                      <a
                        href={generateWhatsAppReminderUrl(debt)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1 cursor-pointer"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Remind
                      </a>
                    )}

                    <button
                      onClick={() => viewHistory(debt)}
                      className="p-2 text-slate-400 hover:text-primary-600 rounded-lg transition cursor-pointer"
                      title="Payment History"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteDebt(debt.id)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Debt Record */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-sky-500" />
                  Add Personal Debt Record
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateDebt} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Debt Direction</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDebtType("owed_to_me")}
                      className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        debtType === "owed_to_me"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      I Lent Money (They owe me)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDebtType("i_owe")}
                      className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        debtType === "i_owe"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      I Borrowed (I owe them)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                      Person / Entity Name
                    </label>
                    <input
                      type="text"
                      required
                      value={counterpartyName}
                      onChange={(e) => setCounterpartyName(e.target.value)}
                      placeholder="e.g. Rahul Sharma, Alice"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                      Phone / Contact (for WhatsApp)
                    </label>
                    <input
                      type="text"
                      value={counterpartyContact}
                      onChange={(e) => setCounterpartyContact(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="5000.00"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-bold"
                    />
                  </div>

                  <div>
                    <Dropdown
                      label="Currency"
                      options={currencyOptions}
                      value={currency}
                      onChange={setCurrency}
                      searchable
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Target Repayment Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Lent for concert tickets / emergency"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Record"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Record Repayment */}
      <AnimatePresence>
        {showPayModal && selectedDebt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  Record Repayment
                </h3>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">{selectedDebt.counterparty_name}</p>
                <p className="text-slate-400">
                  Remaining: {formatCurrency(selectedDebt.remaining_balance || selectedDebt.amount, selectedDebt.currency)}
                </p>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Repayment Amount ({getCurrencySymbol(selectedDebt.currency)})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold text-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="e.g. Paid via GPay / Cash"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recordDebtTx"
                    checked={recordInTx}
                    onChange={(e) => setRecordInTx(e.target.checked)}
                    className="rounded text-primary-600"
                  />
                  <label htmlFor="recordDebtTx" className="text-xs text-slate-600 dark:text-slate-300">
                    Also record entry in general transactions
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPaying}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {isPaying ? "Saving..." : "Confirm Repayment"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Payment History */}
      <AnimatePresence>
        {showHistoryModal && selectedDebt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-sky-500" />
                  Repayment History
                </h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">{selectedDebt.counterparty_name}</p>
                <p className="text-slate-400">
                  Total Principal: {formatCurrency(selectedDebt.amount, selectedDebt.currency)} • Remaining:{" "}
                  {formatCurrency(selectedDebt.remaining_balance || selectedDebt.amount, selectedDebt.currency)}
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {paymentHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No payments recorded yet.</p>
                ) : (
                  paymentHistory.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(p.amount, selectedDebt.currency)}
                        </p>
                        <p className="text-slate-400 mt-0.5">
                          {format(new Date(p.payment_date), "MMM d, yyyy")} {p.notes && `• ${p.notes}`}
                        </p>
                      </div>
                      <Badge variant="success" size="sm">
                        Paid
                      </Badge>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
