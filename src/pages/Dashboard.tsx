import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTransactions } from "../contexts/TransactionsContext";
import { useBudget } from "../contexts/BudgetContext";
import { useCategories } from "../contexts/CategoriesContext";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { formatMoney, formatDate, formatCategory } from "../lib/format";
import { format, subMonths } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { GroupSplitRequest } from "../types";
import StepByStepTransaction from "../components/transactions/StepByStepTransaction";
import FloatingAddButton from "../components/transactions/FloatingAddButton";
import { usePageHeader } from "../contexts/PageHeaderContext";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Icons } from "../components/ui/icons";
import { ProgressBar } from "../components/ui/ProgressBar";

interface LoansSummary {
  monthlyEmiBurden: number;
}
interface SubsSummary {
  totalMonthlyBurn: number;
}
interface DebtsSummary {
  netBalance: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { setPageHeader } = usePageHeader();
  const { getRecentTransactions, getMonthlySummary } = useTransactions();
  const { getBudgetSummary } = useBudget();
  const { getCategoryById } = useCategories();

  useEffect(() => {
    setPageHeader("Dashboard");
  }, [setPageHeader]);

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const currentMonth = format(new Date(), "yyyy-MM");
  const recentTransactions = getRecentTransactions(5);
  const currentMonthSummary = getMonthlySummary(new Date());
  const budgetSummary = getBudgetSummary(currentMonth);

  const trendData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const summary = getMonthlySummary(month);
    return {
      name: format(month, "MMM"),
      income: summary.totalIncome,
      expenses: summary.totalExpense,
    };
  });

  const categoryData = Object.entries(currentMonthSummary.categories)
    .filter(([, data]) => data.total > 0)
    .map(([categoryId, data]) => {
      const category = getCategoryById(categoryId);
      return {
        name: formatCategory(category?.name),
        value: data.total,
        color: category?.color || "#0284C7",
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const [loansSummary, setLoansSummary] = useState<LoansSummary | null>(null);
  const [subsSummary, setSubsSummary] = useState<SubsSummary | null>(null);
  const [debtsSummary, setDebtsSummary] = useState<DebtsSummary | null>(null);
  const [splitRequests, setSplitRequests] = useState<GroupSplitRequest[]>([]);

  useEffect(() => {
    api.loans.list().then((res) => setLoansSummary(res.summary)).catch(() => {});
    api.subscriptions.list().then((res) => setSubsSummary(res.summary)).catch(() => {});
    api.debts.list().then((res) => setDebtsSummary(res.summary)).catch(() => {});
    api.groups.getMySplitRequests().then((res) => setSplitRequests(res || [])).catch(() => {});
  }, []);

  const pendingIncomingSplits = splitRequests.filter(
    (r) => r.is_incoming && (r.status === "pending" || r.status === "accepted")
  );

  const formatCurrency = (val: number) => formatMoney(val, user?.currency);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Overview"
        description="Monitor your cashflow, budgets, shared settlements, and monthly commitments."
        action={
          <Button
            variant="primary"
            icon={<Icons.Add size={16} />}
            onClick={() => setShowQuickAdd(true)}
          >
            Quick Add
          </Button>
        }
      />

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Income"
          value={formatCurrency(currentMonthSummary.totalIncome)}
          helperText="This month"
          variant="success"
        />

        <StatCard
          label="Total Expenses"
          value={formatCurrency(currentMonthSummary.totalExpense)}
          helperText="This month"
          variant="danger"
        />

        <StatCard
          label="Net Balance"
          value={formatMoney(currentMonthSummary.balance, user?.currency, { showSign: true })}
          helperText="Current month cashflow"
          variant={currentMonthSummary.balance >= 0 ? "success" : "danger"}
        />

        <Card padding="sm" className="flex flex-col justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-[var(--text-muted)]">
              Budget Pace
            </p>
            <p className="text-xl sm:text-2xl font-semibold tracking-tight mt-1 text-[var(--text)] tabular-nums">
              {Math.round(budgetSummary.percentage)}%
            </p>
          </div>
          <div className="mt-2">
            <ProgressBar value={budgetSummary.percentage} max={100} />
          </div>
        </Card>
      </div>

      {/* Pending Split Action Banner */}
      {pendingIncomingSplits.length > 0 && (
        <Card className="border-[var(--warning)]/40 bg-[var(--warning-subtle)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Icons.Warning className="text-[var(--warning)]" size={18} />
              <h3 className="text-sm font-semibold text-[var(--text)]">
                {pendingIncomingSplits.length} Pending Split Request{pendingIncomingSplits.length > 1 ? "s" : ""}
              </h3>
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              Direct ledger auto-deduction active upon settlement
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingIncomingSplits.slice(0, 3).map((req) => (
              <div
                key={req.id}
                className="bg-[var(--surface)] p-3.5 rounded-sm border border-[var(--border)] shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text)] truncate">
                      {req.from_name || "Group Member"}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {req.expense_description || "Group Expense"} · {req.group_name}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--danger)] shrink-0 tabular-nums">
                    {formatMoney(req.amount, req.group_currency || user?.currency)}
                  </p>
                </div>
                <Link
                  to={`/group/${req.group_id}`}
                  className="mt-2 w-full py-1.5 px-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-sm text-xs font-medium text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Review & Settle</span>
                  <Icons.ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Hub Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          to="/group"
          className="p-4 bg-[var(--surface)] hover:bg-[var(--surface-muted)] border border-[var(--border)] rounded-md shadow-xs transition-colors flex items-center justify-between group"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[var(--text)] truncate">Groups & Splits</span>
              {pendingIncomingSplits.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[var(--warning)] text-white shrink-0">
                  {pendingIncomingSplits.length}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
              Shared bill ledger
            </p>
          </div>
          <Icons.ChevronRight className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" size={16} />
        </Link>

        <Link
          to="/loans"
          className="p-4 bg-[var(--surface)] hover:bg-[var(--surface-muted)] border border-[var(--border)] rounded-md shadow-xs transition-colors flex items-center justify-between group"
        >
          <div className="min-w-0">
            <span className="text-xs font-semibold text-[var(--text)] truncate">Loans & EMIs</span>
            <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5 tabular-nums">
              {loansSummary ? `${formatCurrency(loansSummary.monthlyEmiBurden)} / mo` : "Track schedules"}
            </p>
          </div>
          <Icons.ChevronRight className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" size={16} />
        </Link>

        <Link
          to="/subscriptions"
          className="p-4 bg-[var(--surface)] hover:bg-[var(--surface-muted)] border border-[var(--border)] rounded-md shadow-xs transition-colors flex items-center justify-between group"
        >
          <div className="min-w-0">
            <span className="text-xs font-semibold text-[var(--text)] truncate">Subscriptions</span>
            <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5 tabular-nums">
              {subsSummary ? `${formatCurrency(subsSummary.totalMonthlyBurn)} / mo` : "Track recurring"}
            </p>
          </div>
          <Icons.ChevronRight className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" size={16} />
        </Link>

        <Link
          to="/debts"
          className="p-4 bg-[var(--surface)] hover:bg-[var(--surface-muted)] border border-[var(--border)] rounded-md shadow-xs transition-colors flex items-center justify-between group"
        >
          <div className="min-w-0">
            <span className="text-xs font-semibold text-[var(--text)] truncate">Debts & Lenders</span>
            <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5 tabular-nums">
              {debtsSummary
                ? formatMoney(debtsSummary.netBalance, user?.currency, { showSign: true })
                : "Personal ledger"}
            </p>
          </div>
          <Icons.ChevronRight className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" size={16} />
        </Link>
      </div>

      {/* Spending Trend Chart */}
      <Card title="Cashflow Trajectory (Last 6 Months)">
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => formatCurrency(value).replace(/\.\d+/, "")}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  borderRadius: "8px",
                  color: "var(--text)",
                }}
                formatter={(value: any) => [formatCurrency(Number(value)), ""]}
              />
              <Line
                type="monotone"
                name="Income"
                dataKey="income"
                stroke="#059669"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                name="Expenses"
                dataKey="expenses"
                stroke="#DC2626"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two Columns: Category Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top Spending Categories">
          {categoryData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-[var(--text-muted)]">
              No category spending recorded for this period
            </div>
          ) : (
            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      color: "var(--text)",
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card
          title="Recent Transactions"
          action={
            <Link
              to="/transactions"
              className="text-xs font-medium text-[var(--primary)] hover:underline"
            >
              View all
            </Link>
          }
        >
          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              <p>No recent activity recorded.</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => setShowQuickAdd(true)}
              >
                Add Transaction
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recentTransactions.map((tx) => {
                const category = getCategoryById(tx.category_id || "");
                const isIncome = tx.type === "income";
                return (
                  <div
                    key={tx.id}
                    className="py-2.5 flex items-center justify-between text-xs sm:text-sm gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text)] truncate">
                        {tx.description || formatCategory(category?.name)}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">
                        {formatCategory(category?.name)} · {formatDate(tx.date)}
                      </p>
                    </div>
                    <span
                      className={`font-semibold tabular-nums shrink-0 ${
                        isIncome ? "text-[var(--success)]" : "text-[var(--danger)]"
                      }`}
                    >
                      {formatMoney(tx.amount, user?.currency, { showSign: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <StepByStepTransaction
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
      />

      {/* Mobile Floating Add Button */}
      <FloatingAddButton onClick={() => setShowQuickAdd(true)} />
    </div>
  );
}
