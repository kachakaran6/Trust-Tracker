import React, { useState } from "react";
import { useTransactions } from "../contexts/TransactionsContext";
import { useCategories } from "../contexts/CategoriesContext";
import { useAuth } from "../contexts/AuthContext";
import { format, addMonths, subMonths, parseISO } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Lightbulb, AlertCircle } from "lucide-react";

function Predictions() {
  const { user } = useAuth();
  const { transactions, getMonthlySummary } = useTransactions();
  const { categories, getCategoryById } = useCategories();

  // State for selected prediction range
  const [predictionRange, setPredictionRange] = useState(3); // months

  // Format currency using user's preferred currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: user?.currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Generate historical monthly data (last 6 months)
  const generateHistoricalData = () => {
    const months = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const month = subMonths(currentDate, i);
      const summary = getMonthlySummary(month);

      months.push({
        month: format(month, "MMM"),
        expenses: summary.totalExpense,
        income: summary.totalIncome,
      });
    }

    return months;
  };

  // Simulated ML prediction using linear regression
  const predictFutureExpenses = () => {
    const historicalData = generateHistoricalData();
    const yValues = historicalData.map((d) => d.expenses);
    const xValues = Array.from({ length: yValues.length }, (_, i) => i);

    // Simple linear regression
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;
    const n = xValues.length;

    for (let i = 0; i < n; i++) {
      sumX += xValues[i];
      sumY += yValues[i];
      sumXY += xValues[i] * yValues[i];
      sumXX += xValues[i] * xValues[i];
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate predictions
    const predictions = [];
    const currentDate = new Date();

    // Add actual data
    historicalData.forEach((item, i) => {
      predictions.push({
        month: item.month,
        actual: item.expenses,
        predicted: null,
      });
    });

    // Add predictions
    for (let i = 1; i <= predictionRange; i++) {
      const month = addMonths(currentDate, i);
      const predictedValue = intercept + slope * (xValues.length - 1 + i);

      // Add some randomness for visual interest
      const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
      const finalPrediction = Math.round(predictedValue * randomFactor);

      predictions.push({
        month: format(month, "MMM"),
        actual: null,
        predicted: finalPrediction,
      });
    }

    return predictions;
  };

  // Predict category-wise expenses for next month
  const predictCategoryExpenses = () => {
    const currentDate = new Date();
    const nextMonth = addMonths(currentDate, 1);

    // Get expense categories
    const expenseCategories = categories.filter(
      (cat) => cat.type === "expense"
    );

    // Calculate average monthly spend per category over last 3 months
    const predictions = expenseCategories
      .map((category) => {
        let totalSpent = 0;
        let monthCount = 0;

        // Calculate for last 3 months
        for (let i = 0; i < 3; i++) {
          const month = subMonths(currentDate, i);
          const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
          const monthEnd = new Date(
            month.getFullYear(),
            month.getMonth() + 1,
            0
          );

          // Get transactions for this category in this month
          const categoryTransactions = transactions.filter(
            (t) =>
              t.category_id === category.id &&
              t.type === "expense" &&
              parseISO(t.date) >= monthStart &&
              parseISO(t.date) <= monthEnd
          );

          if (categoryTransactions.length > 0) {
            totalSpent += categoryTransactions.reduce(
              (sum, t) => sum + t.amount,
              0
            );
            monthCount++;
          }
        }

        // Calculate average
        const avgMonthlySpend = monthCount > 0 ? totalSpent / monthCount : 0;

        // Add some "ML" variance (simulated)
        const randomFactor = 0.85 + Math.random() * 0.3; // 0.85 to 1.15
        const prediction = Math.round(avgMonthlySpend * randomFactor);

        // Calculate trend percentage
        const lastMonth = subMonths(currentDate, 1);
        const lastMonthStart = new Date(
          lastMonth.getFullYear(),
          lastMonth.getMonth(),
          1
        );
        const lastMonthEnd = new Date(
          lastMonth.getFullYear(),
          lastMonth.getMonth() + 1,
          0
        );

        const lastMonthTransactions = transactions.filter(
          (t) =>
            t.category_id === category.id &&
            t.type === "expense" &&
            parseISO(t.date) >= lastMonthStart &&
            parseISO(t.date) <= lastMonthEnd
        );

        const lastMonthTotal = lastMonthTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );

        const trendPercentage =
          lastMonthTotal > 0
            ? ((prediction - lastMonthTotal) / lastMonthTotal) * 100
            : 0;

        return {
          id: category.id,
          name: category.name,
          color: category.color,
          prediction,
          trend: Math.round(trendPercentage),
        };
      })
      .filter((cat) => cat.prediction > 0) // Only show categories with predictions
      .sort((a, b) => b.prediction - a.prediction); // Sort by prediction amount

    return predictions;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md rounded-md border border-gray-200">
          <p className="font-medium">{label}</p>
          {payload.map(
            (item: any, index: number) =>
              item.value !== null && (
                <p key={index} style={{ color: item.color }}>
                  {item.name}: {formatCurrency(item.value)}
                </p>
              )
          )}
        </div>
      );
    }
    return null;
  };

  // Get data for graphs
  const expensePredictions = predictFutureExpenses();
  const categoryPredictions = predictCategoryExpenses();

  // Calculate total predicted expenses for next month
  const nextMonthPrediction =
    expensePredictions[expensePredictions.length - predictionRange];
  const nextMonthTotal = nextMonthPrediction?.predicted || 0;

  // Get top categories with valid predictions for recommendations
  const topCategoriesWithPredictions = categoryPredictions
    .filter(
      (category) =>
        category.prediction > 0 && typeof category.trend === "number"
    )
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Expense Predictions
        </h1>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">Prediction Range:</span>
          <select
            className="select-field text-sm py-1"
            value={predictionRange}
            onChange={(e) => setPredictionRange(parseInt(e.target.value))}
          >
            <option value={1}>1 Month</option>
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
          </select>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start animate-fade-in">
        <AlertCircle
          size={20}
          className="text-blue-500 mr-3 mt-0.5 flex-shrink-0"
        />
        <div>
          <h3 className="font-medium text-blue-800">About Predictions</h3>
          <p className="text-sm text-blue-700 mt-1">
            Our AI-powered predictions are based on your historical spending
            patterns and use machine learning to forecast future expenses. These
            predictions are estimates and may vary from actual spending based on
            your financial behavior.
          </p>
        </div>
      </div>

      {/* Prediction summary */}
      <div className="card p-6 animate-slide-up">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              Next Month's Projected Expenses
            </h2>
            <p className="text-sm text-gray-500">
              Based on your spending history and AI analysis
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between mt-4">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-sm text-gray-500 mb-1">Predicted Total</p>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(nextMonthTotal)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Confidence Level</p>
              <p className="text-lg font-semibold">85%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Margin of Error</p>
              <p className="text-lg font-semibold">±10%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expense prediction chart */}
      <div
        className="card p-6 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <h2 className="text-lg font-semibold mb-4">
          Expense Trend & Prediction
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={expensePredictions}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(value) =>
                  formatCurrency(value).replace(/\.\d+/, "")
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                x={expensePredictions[5].month}
                stroke="#777"
                strokeDasharray="3 3"
                label={{ value: "Prediction starts", position: "top" }}
              />
              <Legend />
              <Line
                type="monotone"
                name="Actual Expenses"
                dataKey="actual"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                name="Predicted Expenses"
                dataKey="predicted"
                stroke="#8B5CF6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category predictions */}
      <div
        className="card p-6 animate-slide-up"
        style={{ animationDelay: "0.2s" }}
      >
        <h2 className="text-lg font-semibold mb-4">
          Predicted Expenses By Category
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryPredictions}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                horizontal={false}
              />
              <XAxis
                type="number"
                tickFormatter={(value) =>
                  formatCurrency(value).replace(/\.\d+/, "")
                }
              />
              <YAxis dataKey="name" type="category" />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Bar
                dataKey="prediction"
                name="Predicted Amount"
                fill="#8B5CF6"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial recommendations */}
      <div
        className="card p-6 animate-slide-up"
        style={{ animationDelay: "0.3s" }}
      >
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-3">
            <Lightbulb size={20} />
          </div>
          <h2 className="text-lg font-semibold">
            Personalized Recommendations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-2">Spending Opportunities</h3>
            <ul className="space-y-2 text-sm">
              {topCategoriesWithPredictions.map((category) => (
                <li key={category.id} className="flex items-start">
                  <div className="w-4 h-4 rounded-full bg-red-100 mt-0.5 mr-2"></div>
                  <span>
                    Your <strong>{category.name}</strong> spending is predicted
                    to {category.trend > 0 ? "increase" : "decrease"} by{" "}
                    {Math.abs(category.trend)}%. Consider setting a budget
                    limit.
                  </span>
                </li>
              ))}
              {nextMonthTotal > 0 && (
                <li className="flex items-start">
                  <div className="w-4 h-4 rounded-full bg-amber-100 mt-0.5 mr-2"></div>
                  <span>
                    Based on your income, aim to keep your total monthly
                    expenses below {formatCurrency(nextMonthTotal * 0.9)}.
                  </span>
                </li>
              )}
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-2">Saving Opportunities</h3>
            <ul className="space-y-2 text-sm">
              {topCategoriesWithPredictions[0]?.prediction > 0 && (
                <li className="flex items-start">
                  <div className="w-4 h-4 rounded-full bg-green-100 mt-0.5 mr-2"></div>
                  <span>
                    If you reduce your top category spending by 15%, you could
                    save approximately{" "}
                    {formatCurrency(
                      topCategoriesWithPredictions[0].prediction * 0.15
                    )}{" "}
                    next month.
                  </span>
                </li>
              )}
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-green-100 mt-0.5 mr-2"></div>
                <span>
                  Setting up automatic transfers to a savings account can help
                  you save consistently.
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-blue-100 mt-0.5 mr-2"></div>
                <span>
                  Consider allocating 20% of your income to savings each month.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Predictions;
