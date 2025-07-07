import React, { useState } from "react";
import { useTransactions } from "../contexts/TransactionsContext";
import { useCategories } from "../contexts/CategoriesContext";
import { useAuth } from "../contexts/AuthContext";
import { format, parseISO, subMonths, addMonths, startOfMonth } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";

function Analytics() {
  const { user } = useAuth();
  const { getTransactionsByMonth, getMonthlySummary } = useTransactions();
  const { getCategoryById } = useCategories();

  // State for selected month
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Get transactions and summary for the selected month
  const monthlyTransactions = getTransactionsByMonth(selectedMonth);
  const monthlySummary = getMonthlySummary(selectedMonth);

  // Format currency using user's preferred currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: user?.currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Change month functions
  const goToPreviousMonth = () => {
    setSelectedMonth((prev) => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    if (nextMonth <= new Date()) {
      setSelectedMonth(nextMonth);
    }
  };

  // Generate data for category breakdown pie chart
  const generateCategoryData = () => {
    return Object.entries(monthlySummary.categories)
      .filter(([_, data]) => data.total > 0)
      .map(([categoryId, data]) => {
        const category = getCategoryById(categoryId);
        return {
          name: category?.name || "Unknown Category",
          value: data.total,
          color: category?.color || "#6B7280",
          type: category?.type || "expense", // default to "expense" if unknown
        };
      });
  };

  // Generate data for daily spending bar chart
  const generateDailyData = () => {
    const dailySpending = new Map();

    monthlyTransactions.forEach((transaction) => {
      if (transaction.type === "expense") {
        const day = transaction.date.substring(8, 10); // Extract day from YYYY-MM-DD
        const currentTotal = dailySpending.get(day) || 0;
        dailySpending.set(day, currentTotal + transaction.amount);
      }
    });

    // Convert to array and sort by day
    return Array.from(dailySpending.entries())
      .map(([day, amount]) => ({ day, amount }))
      .sort((a, b) => Number(a.day) - Number(b.day));
  };

  // Generate year-to-date monthly trends
  const generateYearlyTrend = () => {
    const months = [];
    let currentMonth = startOfMonth(new Date());

    // Get data for the last 6 months
    for (let i = 0; i < 6; i++) {
      const month = subMonths(currentMonth, i);
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

  // Prepare chart data
  const categoryData = generateCategoryData();
  const expenseData = categoryData.filter((item) => item.type === "expense");
  const incomeData = categoryData.filter((item) => item.type === "income");
  const dailyData = generateDailyData();
  const yearlyTrendData = generateYearlyTrend();

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

  // Category colors for pie chart
  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <button onClick={goToPreviousMonth} className="btn-outline p-1">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold">
          {format(selectedMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={goToNextMonth}
          className="btn-outline p-1"
          disabled={addMonths(selectedMonth, 1) > new Date()}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 animate-fade-in">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Income</p>
            <p className="text-2xl font-bold text-success-600">
              {formatCurrency(monthlySummary.totalIncome)}
            </p>
          </div>
        </div>

        <div
          className="card p-6 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Expenses</p>
            <p className="text-2xl font-bold text-danger-600">
              {formatCurrency(monthlySummary.totalExpense)}
            </p>
          </div>
        </div>

        <div
          className="card p-6 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Balance</p>
            <p
              className={`text-2xl font-bold ${
                monthlySummary.balance >= 0
                  ? "text-primary-600"
                  : "text-danger-600"
              }`}
            >
              {formatCurrency(monthlySummary.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Category breakdown pie chart */}
      <div className="card p-6 animate-slide-up">
        <h2 className="text-lg font-semibold mb-4">Expenses by Category</h2>
        {expenseData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <p>No spending data available for this month</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {/* Income category */}
      <div className="card p-6 animate-slide-up">
        <h2 className="text-lg font-semibold mb-4">Income by Category</h2>
        {incomeData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <p>No spending data available for this month</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Daily spending bar chart */}
      <div
        className="card p-6 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <h2 className="text-lg font-semibold mb-4">Daily Spending</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailyData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" />
              <YAxis
                tickFormatter={(value) =>
                  formatCurrency(value).replace(/\.\d+/, "")
                }
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                labelFormatter={(value) => `Day ${value}`}
              />
              <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly trends line chart */}
      <div
        className="card p-6 animate-slide-up"
        style={{ animationDelay: "0.2s" }}
      >
        <h2 className="text-lg font-semibold mb-4">Monthly Trends</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={yearlyTrendData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value) =>
                  formatCurrency(value).replace(/\.\d+/, "")
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
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
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key insights */}
      <div
        className="card p-6 animate-slide-up"
        style={{ animationDelay: "0.3s" }}
      >
        <h2 className="text-lg font-semibold mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium mb-2">Top Spending Categories</h3>
            <ul className="space-y-2">
              {categoryData.slice(0, 3).map((category, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span>{category.name}</span>
                  <span className="font-medium">
                    {formatCurrency(category.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="font-medium mb-2">Spending Trend</h3>
            <p className="text-sm">
              {monthlySummary.totalExpense >
              (yearlyTrendData[yearlyTrendData.length - 2]?.expenses || 0)
                ? `Your spending increased by ${formatCurrency(
                    monthlySummary.totalExpense -
                      (yearlyTrendData[yearlyTrendData.length - 2]?.expenses ||
                        0)
                  )} compared to last month.`
                : `Your spending decreased by ${formatCurrency(
                    (yearlyTrendData[yearlyTrendData.length - 2]?.expenses ||
                      0) - monthlySummary.totalExpense
                  )} compared to last month.`}
            </p>
            <div className="mt-2">
              <div className="text-xs text-gray-500 mb-1">
                vs. Previous Month
              </div>
              <div className="flex items-center">
                <div
                  className={`h-2 rounded-full ${
                    monthlySummary.totalExpense >
                    (yearlyTrendData[yearlyTrendData.length - 2]?.expenses || 0)
                      ? "bg-danger-500"
                      : "bg-success-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (Math.abs(
                        monthlySummary.totalExpense -
                          (yearlyTrendData[yearlyTrendData.length - 2]
                            ?.expenses || 0)
                      ) /
                        monthlySummary.totalExpense) *
                        100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
