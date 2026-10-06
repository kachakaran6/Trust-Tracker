import { useState, useEffect } from "react";
import { useTransactions } from "../contexts/TransactionsContext";
import { useCategories } from "../contexts/CategoriesContext";
import { useAuth } from "../contexts/AuthContext";
import { formatMoney, formatCategory } from "../lib/format";
import { format, subMonths, addMonths, startOfMonth } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { usePageHeader } from "../contexts/PageHeaderContext";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card } from "../components/ui/Card";
import { IconButton } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Icons } from "../components/ui/icons";

export default function Analytics() {
  const { user } = useAuth();
  const { setPageHeader } = usePageHeader();
  const { getTransactionsByMonth, getMonthlySummary } = useTransactions();
  const { getCategoryById } = useCategories();

  useEffect(() => {
    setPageHeader("Analytics");
  }, [setPageHeader]);

  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthlyTransactions = getTransactionsByMonth(selectedMonth);
  const monthlySummary = getMonthlySummary(selectedMonth);

  const goToPreviousMonth = () => {
    setSelectedMonth((prev) => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    if (nextMonth <= new Date()) {
      setSelectedMonth(nextMonth);
    }
  };

  const generateCategoryData = () => {
    return Object.entries(monthlySummary.categories)
      .filter(([, data]) => data.total > 0)
      .map(([categoryId, data]) => {
        const category = getCategoryById(categoryId);
        return {
          name: formatCategory(category?.name),
          value: data.total,
          color: category?.color || "#0284C7",
          type: category?.type || "expense",
        };
      });
  };

  const generateDailyData = () => {
    const dailySpending = new Map<string, number>();

    monthlyTransactions.forEach((transaction) => {
      if (transaction.type === "expense") {
        const dateStr = transaction.date || transaction.created_at;
        const day = dateStr.substring(8, 10);
        const currentTotal = dailySpending.get(day) || 0;
        dailySpending.set(day, currentTotal + transaction.amount);
      }
    });

    return Array.from(dailySpending.entries())
      .map(([day, amount]) => ({ day, amount }))
      .sort((a, b) => Number(a.day) - Number(b.day));
  };

  const generateYearlyTrend = () => {
    const months = [];
    const currentM = startOfMonth(new Date());

    for (let i = 0; i < 6; i++) {
      const month = subMonths(currentM, i);
      const summary = getMonthlySummary(month);

      months.unshift({
        name: format(month, "MMM"),
        income: summary.totalIncome,
        expenses: summary.totalExpense,
        balance: summary.balance,
      });
    }

    return months;
  };

  const categoryData = generateCategoryData();
  const expenseData = categoryData.filter((item) => item.type === "expense");
  const incomeData = categoryData.filter((item) => item.type === "income");
  const dailyData = generateDailyData();
  const yearlyTrendData = generateYearlyTrend();

  const CATEGORICAL_PALETTE = [
    "#0284C7",
    "#059669",
    "#D97706",
    "#DC2626",
    "#38BDF8",
    "#475569",
    "#64748B",
    "#0369A1",
  ];

  const formatCurrency = (val: number) => formatMoney(val, user?.currency);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visual Analytics"
        description="Detailed breakdown of your spending habits, daily pace, and categorical trends."
        action={
          <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-sm p-1 shadow-xs">
            <IconButton
              aria-label="Previous month"
              variant="ghost"
              size="sm"
              icon={<Icons.ChevronLeft size={16} />}
              onClick={goToPreviousMonth}
            />
            <span className="text-xs sm:text-sm font-semibold text-[var(--text)] px-2 min-w-[110px] text-center">
              {format(selectedMonth, "MMMM yyyy")}
            </span>
            <IconButton
              aria-label="Next month"
              variant="ghost"
              size="sm"
              icon={<Icons.ChevronRight size={16} />}
              onClick={goToNextMonth}
              disabled={addMonths(selectedMonth, 1) > new Date()}
            />
          </div>
        }
      />

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Monthly Income"
          value={formatCurrency(monthlySummary.totalIncome)}
          helperText={`Recorded for ${format(selectedMonth, "MMMM yyyy")}`}
          variant="success"
        />

        <StatCard
          label="Monthly Expenses"
          value={formatCurrency(monthlySummary.totalExpense)}
          helperText={`Recorded for ${format(selectedMonth, "MMMM yyyy")}`}
          variant="danger"
        />

        <StatCard
          label="Monthly Net Cashflow"
          value={formatMoney(monthlySummary.balance, user?.currency, { showSign: true })}
          helperText="Income minus expenses"
          variant={monthlySummary.balance >= 0 ? "success" : "danger"}
        />
      </div>

      {/* Categories Grid (Expense vs Income) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <Card title="Expenses by Category">
          {expenseData.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<Icons.Analytics size={22} />}
                title="No expense data"
                description={`No expenses recorded for ${format(selectedMonth, "MMMM yyyy")}.`}
              />
            </div>
          ) : (
            <div className="h-72 w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      color: "var(--text)",
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {expenseData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          item.color || CATEGORICAL_PALETTE[idx % CATEGORICAL_PALETTE.length],
                      }}
                    />
                    <span className="font-medium text-[var(--text)]">{item.name}</span>
                    <span>({formatCurrency(item.value)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Income by Category */}
        <Card title="Income by Category">
          {incomeData.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<Icons.Analytics size={22} />}
                title="No income data"
                description={`No income streams recorded for ${format(selectedMonth, "MMMM yyyy")}.`}
              />
            </div>
          ) : (
            <div className="h-72 w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {incomeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      color: "var(--text)",
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {incomeData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          item.color || CATEGORICAL_PALETTE[idx % CATEGORICAL_PALETTE.length],
                      }}
                    />
                    <span className="font-medium text-[var(--text)]">{item.name}</span>
                    <span>({formatCurrency(item.value)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Daily Spending Bar Chart */}
      <Card title={`Daily Spending Breakdown (${format(selectedMonth, "MMMM yyyy")})`}>
        {dailyData.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<Icons.Analytics size={22} />}
              title="No daily spending"
              description="No expense transactions logged in this calendar month."
            />
          </div>
        ) : (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => formatCurrency(val).replace(/\.\d+/, "")}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    color: "var(--text)",
                  }}
                  formatter={(value) => [formatCurrency(Number(value)), "Spent"]}
                  labelFormatter={(lbl) => `Day ${lbl}`}
                />
                <Bar dataKey="amount" fill="#0284C7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* 6-Month Cashflow Trajectory */}
      <Card title="Trailing 6-Month Cashflow Performance">
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yearlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={12}
                tickLine={false}
                tickFormatter={(val) => formatCurrency(val).replace(/\.\d+/, "")}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  borderRadius: "8px",
                  color: "var(--text)",
                }}
                formatter={(val) => [formatCurrency(Number(val)), ""]}
              />
              <Line
                type="monotone"
                name="Income"
                dataKey="income"
                stroke="#059669"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                name="Expenses"
                dataKey="expenses"
                stroke="#DC2626"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                name="Net Balance"
                dataKey="balance"
                stroke="#0284C7"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
