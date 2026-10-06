import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Debt, DebtSummary, DebtPayment } from "../types";
import { CURRENCIES, getCurrencySymbol } from "../utils/currency";
import { formatMoney, formatDate } from "../lib/format";
import { usePageHeader } from "../contexts/PageHeaderContext";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Tabs } from "../components/ui/Tabs";
import { Badge } from "../components/ui/Badge";
import { Button, IconButton } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Input";
import { ProgressBar } from "../components/ui/ProgressBar";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Icons } from "../components/ui/icons";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Debts() {
  const { user } = useAuth();
  const { setPageHeader } = usePageHeader();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageHeader("Debts & Lenders");
  }, [setPageHeader]);

  // Tab filter
  const [activeTab, setActiveTab] = useState<string>("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);

  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<DebtPayment[]>([]);

  // Add Debt Form State
  const [counterpartyName, setCounterpartyName] = useState("");
  const [counterpartyContact, setCounterpartyContact] = useState("");
  const [debtType, setDebtType] = useState<"i_owe" | "owed_to_me">("owed_to_me");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(user?.currency || "INR");
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load debts";
      toast.error(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create debt record";
      toast.error(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record repayment";
      toast.error(message);
    } finally {
      setIsPaying(false);
    }
  };

  const handleOpenHistory = async (debt: Debt) => {
    setSelectedDebt(debt);
    try {
      const res = await api.debts.get(debt.id);
      setPaymentHistory(res.payments || []);
      setShowHistoryModal(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load history";
      toast.error(message);
    }
  };

  const handleDeleteDebt = async () => {
    if (!debtToDelete) return;
    try {
      await api.debts.delete(debtToDelete);
      toast.success("Debt record deleted.");
      setDebtToDelete(null);
      loadDebts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete debt";
      toast.error(message);
    }
  };

  const handleOpenReminder = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowReminderModal(true);
  };

  const filteredDebts = debts.filter((d) => {
    if (activeTab === "all") return true;
    if (activeTab === "settled") return d.status === "settled";
    return d.type === activeTab && d.status !== "settled";
  });

  const tabOptions = [
    { id: "all", label: `All (${debts.length})` },
    { id: "owed_to_me", label: "Owed to You (Receivables)" },
    { id: "i_owe", label: "You Owe (Payables)" },
    { id: "settled", label: "Settled" },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Debts & Lenders"
        description="Track peer-to-peer debts, personal loans, and money owed to or from friends and colleagues."
        action={
          <Button
            variant="primary"
            icon={<Icons.Add size={16} />}
            onClick={() => {
              setCurrency(user?.currency || "INR");
              setShowAddModal(true);
            }}
          >
            Add Debt Record
          </Button>
        }
      />

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Money Owed to You"
            value={formatMoney(summary.totalOwedToMe, user?.currency)}
            variant="success"
            helperText="Receivable from others"
          />

          <StatCard
            label="Money You Owe"
            value={formatMoney(summary.totalIOwe, user?.currency)}
            variant="danger"
            helperText="Payable to lenders"
          />

          <StatCard
            label="Net Standing"
            value={
              summary.netBalance > 0
                ? `+${formatMoney(summary.netBalance, user?.currency)}`
                : summary.netBalance < 0
                ? `-${formatMoney(Math.abs(summary.netBalance), user?.currency)}`
                : formatMoney(0, user?.currency)
            }
            variant={summary.netBalance > 0 ? "success" : summary.netBalance < 0 ? "danger" : "default"}
            helperText={summary.netBalance >= 0 ? "You are a net creditor" : "You have net payables"}
          />

          <StatCard
            label="Active Records"
            value={summary.activeCount.toString()}
            helperText={
              summary.overdueCount > 0
                ? `${summary.overdueCount} overdue entries`
                : `${summary.settledCount} fully settled`
            }
            variant={summary.overdueCount > 0 ? "warning" : "default"}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={tabOptions}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />

      {/* Debts List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
        </div>
      ) : filteredDebts.length === 0 ? (
        <EmptyState
          icon={<Icons.Debts size={24} />}
          title="No debt records found"
          description="Record informal loans, shared bills, or personal credit with friends to keep a clean repayment ledger."
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<Icons.Add size={16} />}
              onClick={() => {
                setCurrency(user?.currency || "INR");
                setShowAddModal(true);
              }}
            >
              Add First Record
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDebts.map((debt) => {
            const dCurr = debt.currency || user?.currency || "INR";
            const isOwedToMe = debt.type === "owed_to_me";
            const isSettled = debt.status === "settled";
            const remaining =
              debt.remaining_balance !== undefined ? debt.remaining_balance : debt.amount;
            const progress = debt.progress_percent || 0;

            return (
              <Card
                key={debt.id}
                className={`p-5 flex flex-col justify-between space-y-4 ${
                  isSettled ? "opacity-60" : ""
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center font-semibold text-sm text-[var(--text)]">
                        {debt.counterparty_name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-[var(--text)]">
                          {debt.counterparty_name}
                        </h3>
                        {debt.counterparty_contact && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {debt.counterparty_contact}
                          </p>
                        )}
                      </div>
                    </div>

                    <Badge variant={isSettled ? "neutral" : isOwedToMe ? "success" : "danger"}>
                      {isSettled ? "Settled" : isOwedToMe ? "Owed to You" : "You Owe"}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-[var(--text-muted)]">Remaining Balance</span>
                      <p
                        className={`text-2xl font-bold tabular-nums ${
                          isSettled
                            ? "text-[var(--text-muted)] line-through"
                            : isOwedToMe
                            ? "text-[var(--success)]"
                            : "text-[var(--danger)]"
                        }`}
                      >
                        {formatMoney(remaining, dCurr)}
                      </p>
                    </div>

                    <div className="text-right text-xs text-[var(--text-muted)]">
                      <span>Total: {formatMoney(debt.amount, dCurr)}</span>
                      {debt.due_date && (
                        <p className="mt-0.5">
                          Due: {formatDate(debt.due_date)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                      <span>Paid: {formatMoney(debt.amount_paid || 0, dCurr)}</span>
                      <span>{progress}% settled</span>
                    </div>
                    <ProgressBar value={progress} max={100} showLabel={false} />
                  </div>

                  {debt.notes && (
                    <p className="mt-2 text-xs text-[var(--text-muted)] italic bg-[var(--surface-muted)] p-2 rounded-md">
                      "{debt.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!isSettled && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Icons.Check size={14} />}
                        onClick={() => {
                          setSelectedDebt(debt);
                          setPayAmount(remaining.toString());
                          setPayDate(format(new Date(), "yyyy-MM-dd"));
                          setPayNotes("");
                          setShowPayModal(true);
                        }}
                      >
                        Record Repayment
                      </Button>
                    )}
                    {isOwedToMe && !isSettled && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Icons.Remind size={14} />}
                        onClick={() => handleOpenReminder(debt)}
                      >
                        Remind
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <IconButton
                      variant="ghost"
                      size="sm"
                      ariaLabel="Payment history"
                      icon={<Icons.Diary size={14} />}
                      onClick={() => handleOpenHistory(debt)}
                    />
                    <IconButton
                      variant="danger"
                      size="sm"
                      ariaLabel="Delete record"
                      icon={<Icons.Delete size={14} />}
                      onClick={() => setDebtToDelete(debt.id)}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Add Debt */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record Debt or Loan"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateDebt} className="space-y-4">
          <Select
            label="Transaction Direction"
            value={debtType}
            onChange={(e) => setDebtType(e.target.value as "i_owe" | "owed_to_me")}
            options={[
              { label: "Owed to Me (I lent money)", value: "owed_to_me" },
              { label: "I Owe (I borrowed money)", value: "i_owe" },
            ]}
          />

          <Input
            label="Person / Contact Name"
            type="text"
            required
            value={counterpartyName}
            onChange={(e) => setCounterpartyName(e.target.value)}
            placeholder="e.g. Rahul Sharma, Alice"
          />

          <Input
            label="Contact Info (Phone / Email)"
            type="text"
            value={counterpartyContact}
            onChange={(e) => setCounterpartyContact(e.target.value)}
            placeholder="e.g. +91 98765 43210"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />

            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={CURRENCIES.map((c) => ({
                label: `${c.code} (${c.symbol})`,
                value: c.code,
              }))}
            />
          </div>

          <Input
            label="Due Date (Optional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Textarea
            label="Notes (Optional)"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reason for debt, agreed terms..."
          />

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
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Record"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Payment */}
      <Modal
        isOpen={showPayModal && !!selectedDebt}
        onClose={() => setShowPayModal(false)}
        title={`Record Repayment for ${selectedDebt?.counterparty_name || ""}`}
        maxWidth="max-w-md"
      >
        {selectedDebt && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <Input
              label={`Repayment Amount (${getCurrencySymbol(selectedDebt.currency)})`}
              type="number"
              step="0.01"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="0.00"
            />

            <Input
              label="Payment Date"
              type="date"
              required
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
            />

            <Input
              label="Notes (Optional)"
              type="text"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="e.g. Paid via Google Pay"
            />

            <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer">
              <input
                type="checkbox"
                checked={recordInTx}
                onChange={(e) => setRecordInTx(e.target.checked)}
                className="rounded-xs text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span>Also record in personal Transactions ledger</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowPayModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isPaying}
              >
                {isPaying ? "Recording..." : "Confirm Repayment"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: History */}
      <Modal
        isOpen={showHistoryModal && !!selectedDebt}
        onClose={() => setShowHistoryModal(false)}
        title={`Payment History: ${selectedDebt?.counterparty_name || ""}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          {paymentHistory.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] text-center py-6">
              No repayment records found yet for this ledger entry.
            </p>
          ) : (
            <div className="space-y-2">
              {paymentHistory.map((pmt) => (
                <div
                  key={pmt.id}
                  className="p-3 bg-[var(--surface-muted)] rounded-md border border-[var(--border)] flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-[var(--text)] tabular-nums">
                      {formatMoney(pmt.amount, selectedDebt?.currency || user?.currency || "INR")}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {formatDate(pmt.payment_date)} {pmt.notes ? `• ${pmt.notes}` : ""}
                    </p>
                  </div>
                  <Badge variant="success">Paid</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal: Reminder Generator */}
      <Modal
        isOpen={showReminderModal && !!selectedDebt}
        onClose={() => setShowReminderModal(false)}
        title="Send Payment Reminder"
        maxWidth="max-w-md"
      >
        {selectedDebt && (
          <div className="space-y-4 text-xs">
            <p className="text-[var(--text-muted)]">
              Send a polite reminder to <strong>{selectedDebt.counterparty_name}</strong> for the outstanding balance of{" "}
              <strong>{formatMoney(selectedDebt.remaining_balance || selectedDebt.amount, selectedDebt.currency || user?.currency || "INR")}</strong>.
            </p>

            <div>
              <label className="block font-semibold text-[var(--text-muted)] uppercase mb-1">
                Preview Message
              </label>
              <div className="p-3 bg-[var(--surface-muted)] rounded-md border border-[var(--border)] font-mono text-xs text-[var(--text)] whitespace-pre-wrap">
                {`Hi ${selectedDebt.counterparty_name}, gentle reminder regarding the pending amount of ${formatMoney(selectedDebt.remaining_balance || selectedDebt.amount, selectedDebt.currency || user?.currency || "INR")} recorded on TrustTracker. Please let me know once settled. Thanks!`}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <a
                href={`https://wa.me/${selectedDebt.counterparty_contact?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hi ${selectedDebt.counterparty_name}, gentle reminder regarding the pending amount of ${formatMoney(selectedDebt.remaining_balance || selectedDebt.amount, selectedDebt.currency || user?.currency || "INR")} recorded on TrustTracker. Please let me know once settled. Thanks!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2 bg-[var(--primary)] text-white rounded-md font-semibold transition"
              >
                Send via WhatsApp
              </a>
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Hi ${selectedDebt.counterparty_name}, gentle reminder regarding the pending amount of ${formatMoney(selectedDebt.remaining_balance || selectedDebt.amount, selectedDebt.currency || user?.currency || "INR")} recorded on TrustTracker. Please let me know once settled. Thanks!`
                  );
                  toast.success("Reminder message copied!");
                }}
              >
                Copy Text
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!debtToDelete}
        onClose={() => setDebtToDelete(null)}
        onConfirm={handleDeleteDebt}
        title="Delete Debt Record"
        message="Are you sure you want to delete this debt record? All payment history for this entry will be removed."
        confirmText="Delete Record"
      />
    </div>
  );
}
