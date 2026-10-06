import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Loan, LoanSummary, AmortizationScheduleItem, LoanPayment } from "../types";
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

export default function Loans() {
  const { user } = useAuth();
  const { setPageHeader } = usePageHeader();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageHeader("Loans & EMIs");
  }, [setPageHeader]);

  // Filter Tabs: all, borrowed, lent, closed
  const [activeTab, setActiveTab] = useState<string>("all");

  // Expanded schedule IDs
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [loanDetail, setLoanDetail] = useState<{
    loan: Loan;
    schedule: AmortizationScheduleItem[];
    payments: LoanPayment[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null);

  // Add Loan Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<"borrowed" | "lent">("borrowed");
  const [counterparty, setCounterparty] = useState("");
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("8.5");
  const [tenureMonths, setTenureMonths] = useState("12");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [emiDay, setEmiDay] = useState("5");
  const [currency, setCurrency] = useState(user?.currency || "INR");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pay Modal Form State
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [payNotes, setPayNotes] = useState("");
  const [recordInTx, setRecordInTx] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  // Interactive Simulator Calculator State
  const [calcPrincipal, setCalcPrincipal] = useState(50000);
  const [calcRate, setCalcRate] = useState(9.5);
  const [calcMonths, setCalcMonths] = useState(24);

  const loadLoans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.loans.list();
      setLoans(res.loans);
      setSummary(res.summary);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load loans";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  const loadLoanDetail = async (loanId: string) => {
    if (expandedLoanId === loanId) {
      setExpandedLoanId(null);
      setLoanDetail(null);
      return;
    }

    try {
      setLoadingDetail(true);
      setExpandedLoanId(loanId);
      const res = await api.loans.get(loanId);
      setLoanDetail(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load loan schedule";
      toast.error(message);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Calculate live simulator values
  const simMonthlyRate = calcRate / 12 / 100;
  const simEMI =
    simMonthlyRate > 0
      ? (calcPrincipal *
          simMonthlyRate *
          Math.pow(1 + simMonthlyRate, calcMonths)) /
        (Math.pow(1 + simMonthlyRate, calcMonths) - 1)
      : calcPrincipal / calcMonths;
  const simTotalPayable = simEMI * calcMonths;
  const simTotalInterest = simTotalPayable - calcPrincipal;

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !principal) return;

    try {
      setIsSubmitting(true);
      await api.loans.create({
        name: name.trim(),
        type,
        counterparty: counterparty.trim() || undefined,
        principal_amount: parseFloat(principal),
        interest_rate: parseFloat(interestRate) || 0,
        tenure_months: parseInt(tenureMonths, 10),
        start_date: startDate,
        emi_day: parseInt(emiDay, 10) || 5,
        currency,
        notes: notes.trim() || undefined,
      });

      toast.success("Loan contract created with amortization schedule!");
      setShowAddModal(false);
      setName("");
      setCounterparty("");
      setPrincipal("");
      setNotes("");
      loadLoans();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create loan";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPayModal = (loan: Loan) => {
    setSelectedLoanForPayment(loan);
    setPayAmount(loan.monthly_emi ? loan.monthly_emi.toString() : "");
    setPayDate(format(new Date(), "yyyy-MM-dd"));
    setPayNotes("");
    setShowPayModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForPayment || !payAmount) return;

    try {
      setIsPaying(true);
      await api.loans.recordPayment(selectedLoanForPayment.id, {
        amount: parseFloat(payAmount),
        payment_date: payDate,
        notes: payNotes.trim() || undefined,
        record_in_transactions: recordInTx,
      });

      toast.success("Payment recorded and ledger updated!");
      setShowPayModal(false);
      setSelectedLoanForPayment(null);
      setPayAmount("");
      setPayNotes("");
      loadLoans();
      if (expandedLoanId) loadLoanDetail(expandedLoanId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record payment";
      toast.error(message);
    } finally {
      setIsPaying(false);
    }
  };

  const handleDeleteLoan = async () => {
    if (!loanToDelete) return;
    try {
      await api.loans.delete(loanToDelete);
      toast.success("Loan deleted.");
      if (expandedLoanId === loanToDelete) {
        setExpandedLoanId(null);
        setLoanDetail(null);
      }
      setLoanToDelete(null);
      loadLoans();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete loan";
      toast.error(message);
    }
  };

  const filteredLoans = loans.filter((l) => {
    if (activeTab === "all") return true;
    if (activeTab === "closed") return l.status === "closed";
    return l.type === activeTab && l.status === "active";
  });

  const tabOptions = [
    { id: "all", label: `All Loans (${loans.length})` },
    { id: "borrowed", label: "Borrowed (Liabilities)" },
    { id: "lent", label: "Lent (Receivables)" },
    { id: "closed", label: "Closed / Paid Off" },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Loans & EMIs"
        description="Track loans, calculate EMIs, generate amortization schedules, and monitor debt payoff."
        action={
          <Button
            variant="primary"
            icon={<Icons.Add size={16} />}
            onClick={() => {
              setCurrency(user?.currency || "INR");
              setShowAddModal(true);
            }}
          >
            Add Loan / EMI
          </Button>
        }
      />

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Borrowed Balance"
            value={formatMoney(summary.totalBorrowedRemaining, user?.currency)}
            variant="danger"
            helperText={`Principal: ${formatMoney(summary.totalBorrowedPrincipal, user?.currency)}`}
          />

          <StatCard
            label="Monthly EMI Burden"
            value={`${formatMoney(summary.monthlyEmiBurden, user?.currency)} / mo`}
            variant="warning"
            helperText="Total monthly liability"
          />

          <StatCard
            label="Lent to Others"
            value={formatMoney(summary.totalLentRemaining, user?.currency)}
            variant="success"
            helperText={`Receivable: ${formatMoney(summary.monthlyLentReceivable, user?.currency)} / mo`}
          />

          <StatCard
            label="Active Portfolios"
            value={summary.activeLoansCount.toString()}
            helperText="Active loan contracts"
          />
        </div>
      )}

      {/* Interactive EMI Calculator Card */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <Icons.Loans size={18} />
            <h3 className="text-base font-semibold text-[var(--text)]">EMI Calculator & Simulator</h3>
          </div>
          <Badge variant="info">Real-time Estimator</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
          {/* Controls */}
          <div className="space-y-3 lg:col-span-2">
            <div>
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                <span>Principal Amount</span>
                <span className="font-semibold text-[var(--text)] tabular-nums">
                  {formatMoney(calcPrincipal, user?.currency)}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="2000000"
                step="5000"
                value={calcPrincipal}
                onChange={(e) => setCalcPrincipal(parseFloat(e.target.value))}
                className="w-full accent-[var(--primary)] h-2 bg-[var(--surface-muted)] rounded-md cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                  <span>Interest Rate (% per annum)</span>
                  <span className="font-semibold text-[var(--text)] tabular-nums">{calcRate}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="0.25"
                  value={calcRate}
                  onChange={(e) => setCalcRate(parseFloat(e.target.value))}
                  className="w-full accent-[var(--primary)] h-2 bg-[var(--surface-muted)] rounded-md cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                  <span>Tenure (Months)</span>
                  <span className="font-semibold text-[var(--text)] tabular-nums">
                    {calcMonths} mos ({(calcMonths / 12).toFixed(1)} yrs)
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="360"
                  step="3"
                  value={calcMonths}
                  onChange={(e) => setCalcMonths(parseInt(e.target.value, 10))}
                  className="w-full accent-[var(--primary)] h-2 bg-[var(--surface-muted)] rounded-md cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-[var(--surface-muted)] border border-[var(--border)] rounded-md p-4 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs text-[var(--text-muted)] uppercase font-medium">Estimated Monthly EMI</span>
              <p className="text-2xl font-bold text-[var(--primary)] tabular-nums mt-0.5">
                {formatMoney(simEMI, user?.currency)}
                <span className="text-xs text-[var(--text-muted)] font-normal"> / mo</span>
              </p>
            </div>

            <div className="pt-2 border-t border-[var(--border)] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Total Interest:</span>
                <span className="font-semibold text-[var(--danger)] tabular-nums">{formatMoney(simTotalInterest, user?.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Total Amount:</span>
                <span className="font-semibold text-[var(--text)] tabular-nums">{formatMoney(simTotalPayable, user?.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Filter Tabs */}
      <Tabs
        tabs={tabOptions}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />

      {/* Loans List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
        </div>
      ) : filteredLoans.length === 0 ? (
        <EmptyState
          icon={<Icons.Loans size={24} />}
          title="No loans found"
          description="Track home loans, car EMIs, personal debts, or money lent to friends."
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
              Add First Loan
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan) => {
            const isBorrowed = loan.type === "borrowed";
            const progress =
              loan.principal_amount > 0
                ? Math.min(
                    100,
                    Math.round(
                      ((loan.principal_amount - loan.remaining_principal) /
                        loan.principal_amount) *
                        100
                    )
                  )
                : 0;

            const isExpanded = expandedLoanId === loan.id;

            return (
              <Card key={loan.id} className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-md bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] shrink-0">
                      <Icons.Loans size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-base text-[var(--text)]">{loan.name}</h4>
                        <Badge variant={isBorrowed ? "danger" : "success"}>
                          {isBorrowed ? "Borrowed" : "Lent"}
                        </Badge>
                        {loan.status === "closed" && <Badge variant="neutral">Paid Off</Badge>}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {loan.counterparty ? `${isBorrowed ? "From" : "To"} ${loan.counterparty} • ` : ""}
                        {loan.interest_rate}% p.a. • {loan.tenure_months} months • EMI on day {loan.emi_day}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {loan.status === "active" && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Icons.Check size={14} />}
                        onClick={() => handleOpenPayModal(loan)}
                      >
                        Record Payment
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => loadLoanDetail(loan.id)}
                    >
                      {isExpanded ? "Hide Schedule" : "Schedule"}
                    </Button>
                    <IconButton
                      variant="danger"
                      size="sm"
                      ariaLabel="Delete loan"
                      icon={<Icons.Delete size={14} />}
                      onClick={() => setLoanToDelete(loan.id)}
                    />
                  </div>
                </div>

                {/* Progress & Financials */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[var(--border)] text-xs">
                  <div>
                    <span className="text-[var(--text-muted)]">Remaining Principal</span>
                    <p className="font-semibold text-[var(--text)] text-sm tabular-nums mt-0.5">
                      {formatMoney(loan.remaining_principal, loan.currency)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Monthly EMI</span>
                    <p className="font-semibold text-[var(--text)] text-sm tabular-nums mt-0.5">
                      {formatMoney(loan.monthly_emi, loan.currency)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Original Principal</span>
                    <p className="font-semibold text-[var(--text)] text-sm tabular-nums mt-0.5">
                      {formatMoney(loan.principal_amount, loan.currency)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Payoff Progress</span>
                    <p className="font-semibold text-[var(--text)] text-sm tabular-nums mt-0.5">
                      {progress}%
                    </p>
                  </div>
                </div>

                <div>
                  <ProgressBar value={progress} max={100} showLabel={false} />
                </div>

                {/* Expanded Amortization & Payment Ledger */}
                {isExpanded && (
                  <div className="pt-4 border-t border-[var(--border)] space-y-4">
                    {loadingDetail ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)] mx-auto" />
                      </div>
                    ) : loanDetail ? (
                      <div className="space-y-4">
                        {/* Schedule Table */}
                        <div>
                          <h5 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                            Amortization Schedule (First 12 Months)
                          </h5>
                          <div className="overflow-x-auto border border-[var(--border)] rounded-md">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)] border-b border-[var(--border)]">
                                <tr>
                                  <th className="p-2.5 font-medium">#</th>
                                  <th className="p-2.5 font-medium">Due Date</th>
                                  <th className="p-2.5 font-medium">EMI Amount</th>
                                  <th className="p-2.5 font-medium">Principal</th>
                                  <th className="p-2.5 font-medium">Interest</th>
                                  <th className="p-2.5 font-medium">Ending Balance</th>
                                  <th className="p-2.5 font-medium">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border)]">
                                {loanDetail.schedule.slice(0, 12).map((item) => (
                                  <tr key={item.month_number} className="hover:bg-[var(--surface-muted)]">
                                    <td className="p-2.5 font-mono">{item.month_number}</td>
                                    <td className="p-2.5">{formatDate(item.payment_date)}</td>
                                    <td className="p-2.5 font-semibold tabular-nums">{formatMoney(item.emi_amount, loan.currency)}</td>
                                    <td className="p-2.5 tabular-nums">{formatMoney(item.principal_component, loan.currency)}</td>
                                    <td className="p-2.5 tabular-nums">{formatMoney(item.interest_component, loan.currency)}</td>
                                    <td className="p-2.5 tabular-nums">{formatMoney(item.ending_balance, loan.currency)}</td>
                                    <td className="p-2.5">
                                      <Badge variant={item.status === "paid" ? "success" : "neutral"}>
                                        {item.status}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Recorded Payments */}
                        {loanDetail.payments && loanDetail.payments.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                              Recorded Payment History
                            </h5>
                            <div className="space-y-1.5">
                              {loanDetail.payments.map((pmt) => (
                                <div
                                  key={pmt.id}
                                  className="p-2.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-md flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <span className="font-semibold text-[var(--text)] tabular-nums">
                                      {formatMoney(pmt.amount, loan.currency)}
                                    </span>
                                    <span className="text-[var(--text-muted)] ml-2">
                                      on {formatDate(pmt.payment_date)}
                                    </span>
                                    {pmt.notes && (
                                      <span className="text-[var(--text-muted)] italic ml-2">
                                        "{pmt.notes}"
                                      </span>
                                    )}
                                  </div>
                                  <Badge variant="success">Paid</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Add Loan */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Loan / EMI Contract"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateLoan} className="space-y-4">
          <Input
            label="Loan Name / Title"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. HDFC Home Loan, Car Finance, MacBook EMI"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Contract Type"
              value={type}
              onChange={(e) => setType(e.target.value as "borrowed" | "lent")}
              options={[
                { label: "Borrowed (I owe money)", value: "borrowed" },
                { label: "Lent (Someone owes me)", value: "lent" },
              ]}
            />

            <Input
              label="Counterparty (Bank / Person)"
              type="text"
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              placeholder="e.g. HDFC Bank, Alex"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Principal Amount"
              type="number"
              step="0.01"
              required
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="0.00"
            />

            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={CURRENCIES.map((c) => ({
                label: `${c.code} (${c.symbol}) - ${c.name}`,
                value: c.code,
              }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Interest Rate (% p.a.)"
              type="number"
              step="0.01"
              required
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="8.5"
            />

            <Input
              label="Tenure (Months)"
              type="number"
              required
              value={tenureMonths}
              onChange={(e) => setTenureMonths(e.target.value)}
              placeholder="12"
            />

            <Input
              label="Monthly EMI Day"
              type="number"
              min="1"
              max="31"
              value={emiDay}
              onChange={(e) => setEmiDay(e.target.value)}
              placeholder="5"
            />
          </div>

          <Input
            label="Start Date"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Textarea
            label="Notes (Optional)"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Account number, loan agreement reference, etc."
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
              {isSubmitting ? "Creating..." : "Save Loan"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Pay EMI */}
      <Modal
        isOpen={showPayModal && !!selectedLoanForPayment}
        onClose={() => setShowPayModal(false)}
        title={`Record Payment for ${selectedLoanForPayment?.name || "Loan"}`}
        maxWidth="max-w-md"
      >
        {selectedLoanForPayment && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <Input
              label={`Payment Amount (${getCurrencySymbol(selectedLoanForPayment.currency)})`}
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
              placeholder="e.g. Month 4 EMI paid via auto-debit"
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
                {isPaying ? "Recording..." : "Confirm Payment"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!loanToDelete}
        onClose={() => setLoanToDelete(null)}
        onConfirm={handleDeleteLoan}
        title="Delete Loan"
        message="Are you sure you want to delete this loan? All amortization schedules and payment history will be permanently removed."
        confirmText="Delete Loan"
      />
    </div>
  );
}
