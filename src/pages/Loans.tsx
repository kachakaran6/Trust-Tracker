import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Loan, LoanSummary, AmortizationScheduleItem, LoanPayment } from "../types";
import { CURRENCIES, formatCurrency, getCurrencySymbol } from "../utils/currency";
import { Dropdown } from "../components/ui/Dropdown";
import { Badge } from "../components/ui/Badge";
import {
  Landmark,
  Plus,
  Calendar,
  Percent,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Building,
  UserCheck,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Loans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter Tabs: all, borrowed, lent, closed
  const [activeTab, setActiveTab] = useState<"all" | "borrowed" | "lent" | "closed">("all");

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

  // Add Loan Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<"borrowed" | "lent">("borrowed");
  const [counterparty, setCounterparty] = useState("");
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("8.5");
  const [tenureMonths, setTenureMonths] = useState("12");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [emiDay, setEmiDay] = useState("5");
  const [currency, setCurrency] = useState(user?.currency || "USD");
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
    } catch (err: any) {
      toast.error(err.message || "Failed to load loans.");
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
    } catch (err: any) {
      toast.error(err.message || "Failed to load loan schedule");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Calculate live EMI for add modal
  const calculateLiveEMI = (pStr: string, rStr: string, tStr: string) => {
    const p = parseFloat(pStr) || 0;
    const r = parseFloat(rStr) || 0;
    const t = parseInt(tStr, 10) || 0;
    if (p <= 0 || t <= 0) return 0;
    if (r <= 0) return Math.round((p / t) * 100) / 100;
    const monthlyRate = r / 12 / 100;
    const factor = Math.pow(1 + monthlyRate, t);
    return Math.round(((p * monthlyRate * factor) / (factor - 1)) * 100) / 100;
  };

  const calculatedLiveEmi = calculateLiveEMI(principal, interestRate, tenureMonths);

  // Simulator EMI calculation
  const simMonthlyRate = calcRate > 0 ? calcRate / 12 / 100 : 0;
  const simFactor = Math.pow(1 + simMonthlyRate, calcMonths);
  const simEMI = calcRate > 0 && calcMonths > 0
    ? Math.round(((calcPrincipal * simMonthlyRate * simFactor) / (simFactor - 1)) * 100) / 100
    : Math.round((calcPrincipal / (calcMonths || 1)) * 100) / 100;
  const simTotalPayable = simEMI * calcMonths;
  const simTotalInterest = Math.max(0, simTotalPayable - calcPrincipal);

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !counterparty || !principal || !tenureMonths || !startDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.loans.create({
        name: name.trim(),
        type,
        counterparty: counterparty.trim(),
        principal_amount: parseFloat(principal),
        interest_rate: parseFloat(interestRate) || 0,
        tenure_months: parseInt(tenureMonths, 10),
        start_date: startDate,
        emi_day: parseInt(emiDay, 10) || 1,
        currency,
        notes: notes.trim(),
      });

      toast.success("Loan created successfully!");
      setShowAddModal(false);
      setName("");
      setCounterparty("");
      setPrincipal("");
      setNotes("");
      loadLoans();
    } catch (err: any) {
      toast.error(err.message || "Failed to create loan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayEMI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForPayment || !payAmount) return;

    try {
      setIsPaying(true);
      await api.loans.pay(selectedLoanForPayment.id, {
        amount: parseFloat(payAmount),
        payment_date: payDate,
        notes: payNotes.trim(),
        record_in_transactions: recordInTx,
      });

      toast.success("EMI payment recorded successfully!");
      setShowPayModal(false);
      setSelectedLoanForPayment(null);
      setPayAmount("");
      setPayNotes("");
      loadLoans();
      if (expandedLoanId) loadLoanDetail(expandedLoanId);
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setIsPaying(false);
    }
  };

  const handleDeleteLoan = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this loan and its payment schedule?")) return;
    try {
      await api.loans.delete(id);
      toast.success("Loan deleted.");
      if (expandedLoanId === id) {
        setExpandedLoanId(null);
        setLoanDetail(null);
      }
      loadLoans();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete loan");
    }
  };

  const currencyOptions = CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.flag || ""} ${c.code} (${c.symbol}) - ${c.name}`,
    badge: c.symbol,
  }));

  const filteredLoans = loans.filter((l) => {
    if (activeTab === "all") return true;
    if (activeTab === "closed") return l.status === "closed";
    return l.type === activeTab && l.status === "active";
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Landmark className="w-7 h-7 text-sky-500" />
            Loan & EMI Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track bank loans, personal loans, monthly EMIs, and full amortization schedules
          </p>
        </div>

        <button
          onClick={() => {
            setCurrency(user?.currency || "USD");
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-md shadow-primary-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Loan / EMI
        </button>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Borrowed Balance</span>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {formatCurrency(summary.totalBorrowedRemaining, user?.currency)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Principal: {formatCurrency(summary.totalBorrowedPrincipal, user?.currency)}
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Monthly EMI Burden</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {formatCurrency(summary.monthlyEmiBurden, user?.currency)} / mo
            </p>
            <p className="text-xs text-slate-400 mt-1">Total monthly liability</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Lent to Others</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(summary.totalLentRemaining, user?.currency)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Receivable: {formatCurrency(summary.monthlyLentReceivable, user?.currency)} / mo
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Active Portfolios</span>
              <Landmark className="w-4 h-4 text-sky-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {summary.activeLoansCount}
            </p>
            <p className="text-xs text-slate-400 mt-1">Active loan contracts</p>
          </div>
        </div>
      )}

      {/* Interactive EMI Simulator Accordion Widget */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm text-slate-900 dark:text-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-sky-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Smart EMI Calculator & Simulator</h3>
          </div>
          <Badge variant="primary" size="sm">
            Real-time Estimator
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Controls */}
          <div className="space-y-3 lg:col-span-2">
            <div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Loan Principal Amount</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(calcPrincipal, user?.currency)}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="2000000"
                step="5000"
                value={calcPrincipal}
                onChange={(e) => setCalcPrincipal(parseFloat(e.target.value))}
                className="w-full accent-primary-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Interest Rate (% per annum)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{calcRate}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="0.25"
                  value={calcRate}
                  onChange={(e) => setCalcRate(parseFloat(e.target.value))}
                  className="w-full accent-primary-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Tenure (Months)</span>
                  <span className="font-bold text-slate-900 dark:text-white">
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
                  className="w-full accent-primary-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-sky-50/60 dark:bg-slate-900/60 border border-sky-100 dark:border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Estimated Monthly EMI</span>
              <p className="text-2xl font-extrabold text-primary-600 dark:text-sky-400 mt-0.5">
                {formatCurrency(simEMI, user?.currency)}
                <span className="text-xs text-slate-400 font-normal"> / month</span>
              </p>
            </div>

            <div className="pt-2 border-t border-sky-200/50 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Interest:</span>
                <span className="font-semibold text-rose-500">{formatCurrency(simTotalInterest, user?.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Amount:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(simTotalPayable, user?.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          All Loans ({loans.length})
        </button>
        <button
          onClick={() => setActiveTab("borrowed")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "borrowed"
              ? "bg-primary-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Borrowed (Liabilities)
        </button>
        <button
          onClick={() => setActiveTab("lent")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "lent"
              ? "bg-primary-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Lent (Receivables)
        </button>
        <button
          onClick={() => setActiveTab("closed")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "closed"
              ? "bg-primary-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Closed / Paid Off
        </button>
      </div>

      {/* Loans List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center mx-auto mb-4">
            <Landmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Loans in this Category</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Add a personal loan, home loan, car loan, or money lent to a friend to track amortization schedules and upcoming EMIs.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow-sm cursor-pointer"
          >
            Add Your First Loan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan) => {
            const isExpanded = expandedLoanId === loan.id;
            const lCurr = loan.currency || user?.currency || "USD";

            return (
              <div
                key={loan.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm space-y-4 transition"
              >
                {/* Loan Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${
                        loan.type === "borrowed"
                          ? "bg-rose-500/10 text-rose-500"
                          : "bg-emerald-500/10 text-emerald-500"
                      }`}
                    >
                      {loan.type === "borrowed" ? <Building className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{loan.name}</h3>
                        <Badge
                          variant={loan.status === "closed" ? "success" : loan.type === "borrowed" ? "danger" : "info"}
                          size="sm"
                        >
                          {loan.status === "closed"
                            ? "Paid Off"
                            : loan.type === "borrowed"
                            ? "Liability"
                            : "Receivable"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Lender/Party: {loan.counterparty}</span>
                        <span>•</span>
                        <span>{loan.interest_rate}% p.a.</span>
                        <span>•</span>
                        <span>{loan.tenure_months} months</span>
                        <span>•</span>
                        <span>EMI due on {loan.emi_day || 1}th</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Next EMI */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Monthly EMI</span>
                      <p className="text-xl font-extrabold text-primary-600 dark:text-sky-400">
                        {formatCurrency(loan.monthly_emi, lCurr)}
                      </p>
                    </div>

                    {loan.status === "active" && (
                      <button
                        onClick={() => {
                          setSelectedLoanForPayment(loan);
                          setPayAmount(loan.monthly_emi.toString());
                          setShowPayModal(true);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                      >
                        Pay EMI
                      </button>
                    )}

                    <button
                      onClick={() => loadLoanDetail(loan.id)}
                      className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
                      title="View Amortization Schedule"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={() => handleDeleteLoan(loan.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition cursor-pointer"
                      title="Delete Loan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Repayment Stats */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">
                      Paid: {formatCurrency(loan.total_paid || 0, lCurr)} ({loan.paid_installments || 0}/
                      {loan.tenure_months} EMIs)
                    </span>
                    <span className="text-slate-900 dark:text-white">
                      Remaining: {formatCurrency(loan.remaining_balance || 0, lCurr)} (
                      {loan.progress_percent || 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${loan.progress_percent || 0}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Amortization Schedule */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-3 overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-sky-500" />
                          Amortization Schedule & Payment Log
                        </h4>
                        {loadingDetail && <span className="text-xs text-slate-400">Loading schedule...</span>}
                      </div>

                      {loanDetail && (
                        <div className="overflow-x-auto max-h-72 border border-slate-200 dark:border-slate-700 rounded-2xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-400 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                              <tr>
                                <th className="p-3">#</th>
                                <th className="p-3">Due Date</th>
                                <th className="p-3">EMI Amount</th>
                                <th className="p-3">Principal</th>
                                <th className="p-3">Interest</th>
                                <th className="p-3">Balance</th>
                                <th className="p-3 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                              {loanDetail.schedule.map((item) => (
                                <tr
                                  key={item.paymentNumber}
                                  className={item.isPaid ? "bg-emerald-500/5" : ""}
                                >
                                  <td className="p-3 font-mono font-bold">{item.paymentNumber}</td>
                                  <td className="p-3">{item.dueDate}</td>
                                  <td className="p-3 font-semibold">{formatCurrency(item.emiAmount, lCurr)}</td>
                                  <td className="p-3">{formatCurrency(item.principalComponent, lCurr)}</td>
                                  <td className="p-3 text-rose-500">{formatCurrency(item.interestComponent, lCurr)}</td>
                                  <td className="p-3 font-mono">{formatCurrency(item.remainingBalance, lCurr)}</td>
                                  <td className="p-3 text-right">
                                    {item.isPaid ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold">
                                        <Check className="w-3 h-3" /> Paid on {item.paidDate}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded text-[10px]">
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Loan */}
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
                  <Landmark className="w-5 h-5 text-sky-500" />
                  Add New Loan / EMI Contract
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateLoan} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Loan Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType("borrowed")}
                      className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        type === "borrowed"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <Building className="w-4 h-4" />
                      Borrowed (Liability / Bank)
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("lent")}
                      className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        type === "lent"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      Lent (Asset / Given out)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Loan Title</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. HDFC Home Loan, Car Loan"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                      {type === "borrowed" ? "Lender Bank / Entity" : "Borrower Person / Entity"}
                    </label>
                    <input
                      type="text"
                      required
                      value={counterparty}
                      onChange={(e) => setCounterparty(e.target.value)}
                      placeholder="e.g. HDFC Bank, Sarah Connor"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                      Principal Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={principal}
                      onChange={(e) => setPrincipal(e.target.value)}
                      placeholder="e.g. 500000"
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

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                      Interest (% p.a.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder="8.5"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Tenure (Mos)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(e.target.value)}
                      placeholder="12"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">EMI Day of Mo</label>
                    <input
                      type="number"
                      min="1"
                      max="28"
                      value={emiDay}
                      onChange={(e) => setEmiDay(e.target.value)}
                      placeholder="5"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                  />
                </div>

                {calculatedLiveEmi > 0 && (
                  <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-500/30 rounded-2xl flex items-center justify-between text-xs">
                    <span className="text-sky-900 dark:text-sky-200 font-medium">Calculated Monthly EMI:</span>
                    <span className="text-base font-extrabold text-primary-600 dark:text-sky-400">
                      {formatCurrency(calculatedLiveEmi, currency)} / mo
                    </span>
                  </div>
                )}

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
                    {isSubmitting ? "Creating..." : "Save Loan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Pay EMI */}
      <AnimatePresence>
        {showPayModal && selectedLoanForPayment && (
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
                  Record EMI Payment
                </h3>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">{selectedLoanForPayment.name}</p>
                <p className="text-slate-400">
                  Standard EMI: {formatCurrency(selectedLoanForPayment.monthly_emi, selectedLoanForPayment.currency)}
                </p>
              </div>

              <form onSubmit={handlePayEMI} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Payment Amount ({getCurrencySymbol(selectedLoanForPayment.currency)})
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
                    placeholder="e.g. Paid via Auto-debit / NetBanking"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recordInTx"
                    checked={recordInTx}
                    onChange={(e) => setRecordInTx(e.target.checked)}
                    className="rounded text-primary-600"
                  />
                  <label htmlFor="recordInTx" className="text-xs text-slate-600 dark:text-slate-300">
                    Also record an expense entry in general transactions
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
                    {isPaying ? "Recording..." : "Confirm Payment"}
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
