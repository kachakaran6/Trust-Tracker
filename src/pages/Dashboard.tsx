/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useTransactions } from "../contexts/TransactionsContext";
import { useBudget } from "../contexts/BudgetContext";
import { useCategories } from "../contexts/CategoriesContext";
import { useAuth } from "../contexts/AuthContext";
import { format, parseISO, subMonths } from "date-fns";
import CountUp from "react-countup";
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
  // Legend,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Plus,
} from "lucide-react";
import StepByStepTransaction from "../components/transactions/StepByStepTransaction";
import FloatingAddButton from "../components/transactions/FloatingAddButton";

function Dashboard() {
  const { user } = useAuth();
  const { getRecentTransactions, getMonthlySummary } = useTransactions();
  const { getBudgetSummary } = useBudget();
  const { getCategoryById } = useCategories();

  // State for quick add modal
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Get current month in YYYY-MM format
  const currentMonth = format(new Date(), "yyyy-MM");

  // Get recent transactions
  const recentTransactions = getRecentTransactions(5);

  // Get monthly summary
  const currentMonthSummary = getMonthlySummary(new Date());

  // Get budget summary
  const budgetSummary = getBudgetSummary(currentMonth);

  // Generate data for the spending trend chart (last 6 months)
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const summary = getMonthlySummary(month);
    return {
      name: format(month, "MMM"),
      income: summary.totalIncome,
      expenses: summary.totalExpense,
    };
  });

  // Generate data for the category breakdown chart
  const categoryData = Object.entries(currentMonthSummary.categories)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([_, data]) => data.total > 0)
    .map(([categoryId, data]) => {
      const category = getCategoryById(categoryId);
      return {
        name: category?.name || "Unknown Category",
        value: data.total,
        color: category?.color || "#6B7280",
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 categories

  // Category colors for pie chart
  const CATEGORY_COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  // Format currency using user's preferred currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: user?.currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md rounded-md border border-gray-200">
          <p className="font-medium">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.color }}>
              {item.name}: {formatCurrency(item.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {format(new Date(), "MMMM d, yyyy")}
          </p>
        </div>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="btn-primary flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Quick Add
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 animate-fade-in">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Income</p>
              <p className="text-2xl font-bold">
                <CountUp
                  end={currentMonthSummary.totalIncome}
                  duration={1.25}
                  formattingFn={(val) => formatCurrency(val)}
                  separator=","
                  decimals={2}
                />
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">This month</p>
        </div>

        <div
          className="card p-6 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Expenses</p>
              <p className="text-2xl font-bold">
                <CountUp
                  end={currentMonthSummary.totalExpense}
                  duration={1.25}
                  formattingFn={(val) => formatCurrency(val)}
                  separator=","
                  decimals={2}
                />
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">This month</p>
        </div>

        <div
          className="card p-6 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Balance</p>
              <p className="text-2xl font-bold">
                <CountUp
                  end={currentMonthSummary.balance}
                  duration={1.25}
                  formattingFn={(val) => formatCurrency(val)}
                  separator=","
                  decimals={2}
                />
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Wallet size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Net balance</p>
        </div>

        <div
          className="card p-6 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Budget Spent</p>
              <p className="text-2xl font-bold">
                {Math.round(budgetSummary.percentage)}%
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                budgetSummary.percentage > 90
                  ? "bg-danger-500"
                  : budgetSummary.percentage > 75
                  ? "bg-warning-500"
                  : "bg-success-500"
              }`}
              style={{ width: `${Math.min(budgetSummary.percentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Spending trend chart */}
      <div className="card p-6 animate-slide-up">
        <h2 className="text-lg font-semibold mb-4">
          Income vs. Expenses Trend
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 5, right: 20, bottom: 20, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value) =>
                  formatCurrency(value).replace(/\.\d+/, "")
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-column layout for pie chart and recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div
          className="card p-6 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <h2 className="text-lg font-semibold mb-4">
            Top Spending Categories
          </h2>
          {categoryData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No spending data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.color ||
                          CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div
          className="card overflow-hidden animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <DollarSign size={24} className="text-gray-400" />
                </div>
                <p className="mb-3">No recent transactions</p>
                <button
                  onClick={() => setShowQuickAdd(true)}
                  className="btn-primary text-sm"
                >
                  Add Your First Transaction
                </button>
              </div>
            ) : (
              recentTransactions.map((transaction) => {
                const category = getCategoryById(transaction.category_id || "");
                return (
                  <div
                    key={transaction.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3"
                        style={{
                          backgroundColor: category?.color || "#6B7280",
                        }}
                      >
                        {transaction.description.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                          {category?.name || "Unknown"} •{" "}
                          {format(parseISO(transaction.date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div
                        className={`font-medium ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-4 border-t border-gray-100 text-center">
            <a
              href="/transactions"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All Transactions
            </a>
          </div>
        </div>
      </div>

      {/* Financial Insights */}
      <div
        className="card p-6 animate-slide-up"
        style={{ animationDelay: "0.3s" }}
      >
        <h2 className="text-lg font-semibold mb-4">Financial Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-start mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2">
                <TrendingUp size={16} />
              </div>
              <h3 className="font-medium">Spending Prediction</h3>
            </div>
            <p className="text-sm text-gray-600">
              Based on your historical data, we predict your expenses will
              likely be {formatCurrency(3240)} next month.
            </p>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <div className="flex items-start mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-2">
                <AlertTriangle size={16} />
              </div>
              <h3 className="font-medium">Budget Alert</h3>
            </div>
            <p className="text-sm text-gray-600">
              You're approaching your Entertainment budget limit. Consider
              reducing spending in this category.
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-Step Transaction Modal */}
      <StepByStepTransaction
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
      />

      {/* Floating Add Button */}
      <FloatingAddButton onClick={() => setShowQuickAdd(true)} />
    </div>
  );
}

export default Dashboard;
