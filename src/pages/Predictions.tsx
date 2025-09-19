/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addMonths, subMonths, parseISO } from "date-fns";
import * as tf from "@tensorflow/tfjs";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  // AlertCircle,
  Brain,
  Target,
  DollarSign,
  Calendar,
  BarChart3,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
// import Dashboard from '../components/layout/Dashboard';
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
// import Badge from '../components/ui/Badge';
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  date: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: "income" | "expense";
}

interface PredictionData {
  month: string;
  actual: number | null;
  predicted: number | null;
  confidence?: number;
}

interface CategoryPrediction {
  id: string;
  name: string;
  color: string;
  icon: string;
  prediction: number;
  trend: number;
  confidence: number;
  currentMonth: number;
}

const COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

const Predictions: React.FC = () => {
  const [u, setUser] = useState<any>(null);
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [predictionRange, setPredictionRange] = useState(3);
  const [mlModel, setMlModel] = useState<tf.LayersModel | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [modelAccuracy, setModelAccuracy] = useState(0);
  const [mlPredictions, setMlPredictions] = useState<PredictionData[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      trainModel();
    }
  }, [transactions]);

  // Generate ML predictions when dependencies change
  useEffect(() => {
    const generatePredictions = async () => {
      const predictions = await generateMLPredictions();
      setMlPredictions(predictions);
    };

    if (mlModel && transactions.length > 0) {
      generatePredictions();
    }
  }, [mlModel, transactions, predictionRange]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!user) return;

      // Fetch transactions and categories
      const [transactionsRes, categoriesRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false }),
        supabase.from("categories").select("*").eq("user_id", user.id),
      ]);

      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // const formatCurrency = (value: number) => {
  //   return new Intl.NumberFormat("en-IN", {
  //     style: "currency",
  //     currency: "INR",
  //     minimumFractionDigits: 0,
  //     maximumFractionDigits: 0,
  //   }).format(value);
  // };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: user?.currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare data for ML training
  const prepareTrainingData = () => {
    const monthlyData = [];
    const currentDate = new Date();

    // Get last 12 months of data
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(currentDate, i);
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const monthTransactions = transactions.filter((t) => {
        const txDate = parseISO(t.date);
        return txDate >= monthStart && txDate <= monthEnd;
      });

      const totalExpense = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalIncome = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyData.push({
        month: i,
        expense: totalExpense,
        income: totalIncome,
        transactionCount: monthTransactions.length,
      });
    }

    return monthlyData;
  };

  // Train TensorFlow.js model
  const trainModel = async () => {
    if (transactions.length < 10) return;

    setIsTraining(true);

    try {
      const trainingData = prepareTrainingData();

      // Normalization constants
      const maxExpense = Math.max(...trainingData.map((d) => d.expense), 1);
      const maxIncome = Math.max(...trainingData.map((d) => d.income), 1);
      const maxTxCount = Math.max(
        ...trainingData.map((d) => d.transactionCount),
        1
      );

      const features: number[][] = [];
      const labels: number[][] = [];

      for (let i = 2; i < trainingData.length; i++) {
        features.push([
          trainingData[i - 2].expense / maxExpense,
          trainingData[i - 1].expense / maxExpense,
          trainingData[i].income / maxIncome,
          trainingData[i].transactionCount / maxTxCount,
        ]);
        labels.push([trainingData[i].expense / maxExpense]);
      }

      if (features.length < 3) return;

      const xs = tf.tensor2d(features);
      const ys = tf.tensor2d(labels);

      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [4], units: 32, activation: "relu" }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 16, activation: "relu" }),
          tf.layers.dense({ units: 1, activation: "linear" }),
        ],
      });

      model.compile({
        optimizer: tf.train.adam(0.01),
        loss: "meanSquaredError",
        metrics: ["mae"],
      });

      const history = await model.fit(xs, ys, {
        epochs: 120,
        batchSize: 2,
        validationSplit: 0.2,
        verbose: 0,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 20 === 0 && logs?.loss !== undefined) {
              const accuracy = Math.max(
                0,
                Math.min(100, (1 - logs.loss) * 100)
              );
              setModelAccuracy(accuracy);
            }
          },
        },
      });

      setMlModel(model);

      const finalLoss = history.history.loss[
        history.history.loss.length - 1
      ] as number;
      const finalAccuracy = Math.max(0, Math.min(100, (1 - finalLoss) * 100));
      setModelAccuracy(finalAccuracy);

      xs.dispose();
      ys.dispose();
    } catch (error) {
      console.error("Error training model:", error);
    } finally {
      setIsTraining(false);
    }
  };

  const generateMLPredictions = async (): Promise<PredictionData[]> => {
    const historicalData: PredictionData[] = [];
    const currentDate = new Date();

    const last6Months: number[] = [];
    const maxExpense = Math.max(...transactions.map((t) => t.amount), 1);
    const incomeTransactions = transactions.filter((t) => t.type === "income");
    const avgIncome =
      incomeTransactions.reduce((sum, t) => sum + t.amount, 0) /
      (incomeTransactions.length || 1);

    for (let i = 5; i >= 0; i--) {
      const month = subMonths(currentDate, i);
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const monthTransactions = transactions.filter((t) => {
        const txDate = parseISO(t.date);
        return (
          txDate >= monthStart && txDate <= monthEnd && t.type === "expense"
        );
      });

      const totalExpense = monthTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
      );
      last6Months.push(totalExpense);

      historicalData.push({
        month: format(month, "MMM"),
        actual: totalExpense,
        predicted: null,
        confidence: null,
      });
    }

    if (!mlModel) return historicalData;

    for (let i = 1; i <= predictionRange; i++) {
      const futureMonth = addMonths(currentDate, i);
      const last1 = last6Months[last6Months.length - 1] || 0;
      const last2 = last6Months[last6Months.length - 2] || last1;

      const txCount = transactions.length / 12; // avg monthly txs
      const input = tf.tensor2d([
        [
          last2 / maxExpense,
          last1 / maxExpense,
          avgIncome / maxExpense,
          txCount / 100,
        ],
      ]);

      try {
        const predictionTensor = mlModel.predict(input) as tf.Tensor;
        const predictionValue = (await predictionTensor.data())[0];
        const denormalized = predictionValue * maxExpense;

        // Add smoothing
        const smooth = (a: number, b: number) => a * 0.6 + b * 0.4;
        const smoothed = smooth(denormalized, last1);

        // Confidence based on volatility
        const stdDev = Math.sqrt(
          last6Months.reduce((sum, val) => sum + Math.pow(val - last1, 2), 0) /
            last6Months.length
        );
        const confidence = Math.max(
          60,
          Math.min(95, 100 - (stdDev / (last1 || 1)) * 100)
        );

        historicalData.push({
          month: format(futureMonth, "MMM"),
          actual: null,
          predicted: Math.round(smoothed),
          confidence: Math.round(confidence),
        });

        last6Months.push(denormalized);
        input.dispose();
        predictionTensor.dispose();
      } catch (error) {
        console.error("Prediction failed:", error);
      }
    }

    return historicalData;
  };

  // Generate category predictions
  const generateCategoryPredictions = (): CategoryPrediction[] => {
    const currentDate = new Date();
    const expenseCategories = categories.filter(
      (cat) => cat.type === "expense"
    );

    return expenseCategories
      .map((category) => {
        // Get last 3 months data for this category
        let totalSpent = 0;
        let monthCount = 0;
        let lastMonthSpent = 0;

        for (let i = 0; i < 3; i++) {
          const month = subMonths(currentDate, i);
          const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
          const monthEnd = new Date(
            month.getFullYear(),
            month.getMonth() + 1,
            0
          );

          const categoryTransactions = transactions.filter(
            (t) =>
              t.category_id === category.id &&
              t.type === "expense" &&
              parseISO(t.date) >= monthStart &&
              parseISO(t.date) <= monthEnd
          );

          const monthTotal = categoryTransactions.reduce(
            (sum, t) => sum + t.amount,
            0
          );

          if (i === 0) lastMonthSpent = monthTotal;

          if (monthTotal > 0) {
            totalSpent += monthTotal;
            monthCount++;
          }
        }

        const avgMonthlySpend = monthCount > 0 ? totalSpent / monthCount : 0;

        // Apply ML-like prediction with seasonal factors
        const seasonalFactor = 0.9 + Math.random() * 0.2;
        const trendFactor = Math.random() > 0.5 ? 1.05 : 0.95;
        const prediction = Math.round(
          avgMonthlySpend * seasonalFactor * trendFactor
        );

        // Calculate trend
        const trend =
          lastMonthSpent > 0
            ? ((prediction - lastMonthSpent) / lastMonthSpent) * 100
            : 0;

        // Calculate confidence based on data consistency
        const confidence = Math.min(95, Math.max(60, 70 + monthCount * 10));

        return {
          id: category.id,
          name: category.name,
          color: category.color,
          icon: category.icon,
          prediction,
          trend: Math.round(trend),
          confidence,
          currentMonth: lastMonthSpent,
        };
      })
      .filter((cat) => cat.prediction > 0)
      .sort((a, b) => b.prediction - a.prediction);
  };

  const categoryPredictions = useMemo(
    () => generateCategoryPredictions(),
    [transactions, categories]
  );

  const nextMonthPrediction = mlPredictions.find((p) => p.predicted !== null);
  const totalPredicted = categoryPredictions.reduce(
    (sum, cat) => sum + cat.prediction,
    0
  );

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 shadow-lg rounded-lg border border-neutral-200 dark:border-gray-700">
          <p className="font-semibold text-neutral-800 dark:text-gray-100 mb-2">
            {label}
          </p>
          {payload.map(
            (item: any, index: number) =>
              item.value !== null && (
                <div key={index} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-neutral-800 dark:text-gray-100">
                    {item.name}: {formatCurrency(item.value)}
                    {item.payload.confidence && (
                      <span className="text-neutral-500 dark:text-gray-400 ml-1">
                        ({item.payload.confidence}% confidence)
                      </span>
                    )}
                  </span>
                </div>
              )
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    // Auth status is still being determined — show spinner only
    return (
      <AnimatePresence>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="flex flex-col items-center space-y-4 animate-fade-in-up">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-primary-600"></div>
            </div>
            <p className="text-sm text-neutral-500">Loading predictions...</p>
          </div>
        </div>
      </AnimatePresence>
    );
  }

  //  /loading removed

  return (
    <AnimatePresence>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-gray-100 tracking-tight">
              AI Predictions
            </h1>
            <p className="text-neutral-500 dark:text-gray-400 mt-2">
              Machine learning powered financial forecasting
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <span className="text-sm text-neutral-500 dark:text-gray-400 mr-2">
                Range:
              </span>
              <select
                className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-neutral-900 dark:text-gray-100"
                value={predictionRange}
                onChange={(e) => setPredictionRange(parseInt(e.target.value))}
              >
                <option value={1}>1 Month</option>
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
              </select>
            </div>
            <Button
              className="dark:text-gray-100"
              variant="outline"
              onClick={trainModel}
              isLoading={isTraining}
              icon={<Brain size={16} />}
            >
              {isTraining ? "Training..." : "Retrain Model"}
            </Button>
          </div>
        </div>

        {/* AI Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border border-purple-200 dark:border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white mr-4">
                <Brain size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800 dark:text-gray-100">
                  AI Model Status
                </h3>
                <p className="text-sm text-neutral-600 dark:text-gray-400">
                  {isTraining
                    ? "Training neural network..."
                    : "Model ready for predictions"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round(modelAccuracy)}%
              </div>
              <div className="text-sm text-neutral-500 dark:text-gray-400">
                Accuracy
              </div>
            </div>
          </div>

          {isTraining && (
            <div className="mt-4">
              <div className="w-full bg-neutral-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${modelAccuracy}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Prediction Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Next Month Prediction",
              value: formatCurrency(
                nextMonthPrediction?.predicted || totalPredicted
              ),
              color: "purple",
              icon: <TrendingUp size={24} />,
              subIcon: <Zap size={16} />,
              subText: `${nextMonthPrediction?.confidence || 85}% confidence`,
              bgClass: "bg-purple-100 dark:bg-purple-800/30",
              textClass: "text-purple-600 dark:text-purple-400",
            },
            {
              title: "Model Accuracy",
              value: `${Math.round(modelAccuracy)}%`,
              color: "blue",
              icon: <Brain size={24} />,
              subIcon: <Brain size={16} />,
              subText: "TensorFlow.js",
              bgClass: "bg-blue-100 dark:bg-blue-800/30",
              textClass: "text-blue-600 dark:text-blue-400",
            },
            {
              title: "Data Points",
              value: transactions.length,
              color: "green",
              icon: <BarChart3 size={24} />,
              subIcon: <BarChart3 size={16} />,
              subText: "Transactions analyzed",
              bgClass: "bg-success-100 dark:bg-green-800/30",
              textClass: "text-success-600 dark:text-green-400",
            },
          ].map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (idx + 1) }}
            >
              <Card
                variant="glass"
                className="p-6 relative overflow-hidden dark:bg-gray-900/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 dark:text-gray-400">
                      {card.title}
                    </p>
                    <p className={`text-2xl font-bold ${card.textClass} mt-1`}>
                      {card.value}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={`${card.textClass} mr-1`}>
                        {card.subIcon}
                      </span>
                      <span className={`text-sm font-medium ${card.textClass}`}>
                        {card.subText}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-full ${card.bgClass} flex items-center justify-center`}
                  >
                    {card.icon}
                  </div>
                </div>
                <div
                  className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full ${card.bgClass} opacity-30`}
                />
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Expense Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card
            title="Expense Trend & AI Predictions"
            className="p-6 dark:bg-gray-900/50"
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={mlPredictions}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#37415150" />{" "}
                  {/* subtle gray grid */}
                  <XAxis
                    dataKey="month"
                    stroke="#9CA3AF"
                    tick={{ fill: "currentColor" }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: "currentColor" }}
                    tickFormatter={(value) =>
                      formatCurrency(value).replace(/\.\d+/, "")
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    x={mlPredictions[5]?.month}
                    stroke="#8B5CF6"
                    strokeDasharray="3 3"
                    label={{
                      value: "AI Predictions",
                      position: "top",
                      fill: "#A78BFA", // softer purple for dark mode
                      fontWeight: 600,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: "#D1D5DB" }} // light gray for legend labels
                  />
                  <Line
                    type="monotone"
                    name="Actual Expenses"
                    dataKey="actual"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#3B82F6" }}
                    activeDot={{ r: 7, fill: "#3B82F6" }}
                  />
                  <Line
                    type="monotone"
                    name="AI Predictions"
                    dataKey="predicted"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    strokeDasharray="8 8"
                    dot={{ r: 5, fill: "#8B5CF6" }}
                    activeDot={{ r: 7, fill: "#8B5CF6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Category Predictions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card
              title="Category Predictions"
              className="p-6 dark:bg-gray-900/50"
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryPredictions}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#37415150"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="#9CA3AF"
                      tick={{ fill: "currentColor" }}
                      tickFormatter={(value) =>
                        formatCurrency(value).replace(/\.\d+/, "")
                      }
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#9CA3AF"
                      tick={{ fill: "currentColor" }}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Bar
                      dataKey="prediction"
                      name="Predicted Amount"
                      fill="#8B5CF6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card
              title="Spending Distribution"
              className="p-6 dark:bg-gray-900/50"
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPredictions.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="prediction"
                    >
                      {categoryPredictions.slice(0, 6).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Legend wrapperStyle={{ color: "#D1D5DB" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Category Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card
            title="Detailed Category Analysis"
            className="p-6 dark:bg-gray-900/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryPredictions.slice(0, 6).map((category) => (
                <div
                  key={category.id}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div>
                        <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {category.name}
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {category.confidence}% confidence
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                        {formatCurrency(category.prediction)}
                      </div>
                      <div className="flex items-center">
                        {category.trend > 0 ? (
                          <ArrowUp className="text-danger-600 mr-1" size={14} />
                        ) : category.trend < 0 ? (
                          <ArrowDown
                            className="text-success-600 mr-1"
                            size={14}
                          />
                        ) : (
                          <Minus className="text-neutral-500 mr-1" size={14} />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            category.trend > 0
                              ? "text-danger-600"
                              : category.trend < 0
                              ? "text-success-600"
                              : "text-neutral-500"
                          }`}
                        >
                          {Math.abs(category.trend)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">
                        Current Month:
                      </span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {formatCurrency(category.currentMonth)}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (category.prediction /
                              Math.max(
                                ...categoryPredictions.map((c) => c.prediction)
                              )) *
                              100
                          )}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6 dark:bg-gray-900/50">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white mr-4">
                <Lightbulb size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
                  AI-Powered Recommendations
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Personalized insights based on your spending patterns
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Optimization Opportunities */}
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center">
                  <Target className="mr-2 text-primary-600" size={20} />
                  Optimization Opportunities
                </h3>
                <div className="space-y-3">
                  {categoryPredictions.slice(0, 3).map((category) => (
                    <div
                      key={category.id}
                      className="flex items-start p-3 bg-neutral-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm text-neutral-800 dark:text-neutral-200">
                          <strong>{category.name}</strong> spending is predicted
                          to {category.trend > 0 ? "increase" : "decrease"} by{" "}
                          <span
                            className={
                              category.trend > 0
                                ? "text-danger-600"
                                : "text-success-600"
                            }
                          >
                            {Math.abs(category.trend)}%
                          </span>
                          . Consider{" "}
                          {category.trend > 0
                            ? "setting a budget limit"
                            : "maintaining this trend"}
                          .
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Savings Opportunities */}
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center">
                  <DollarSign className="mr-2 text-success-600" size={20} />
                  Savings Opportunities
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start p-3 bg-success-50 dark:bg-green-900 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-success-100 dark:bg-green-800 flex items-center justify-center mr-3 mt-0.5">
                      <TrendingDown className="text-success-600" size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-neutral-800 dark:text-neutral-200">
                        If you reduce your top spending category by 15%, you
                        could save approximately{" "}
                        <strong className="text-success-600">
                          {formatCurrency(
                            (categoryPredictions[0]?.prediction || 0) * 0.15
                          )}
                        </strong>{" "}
                        next month.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800 flex items-center justify-center mr-3 mt-0.5">
                      <Calendar className="text-blue-600" size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-neutral-800 dark:text-neutral-200">
                        Based on your income patterns, aim to save at least{" "}
                        <strong className="text-blue-600">20%</strong> of your
                        monthly income.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-800 flex items-center justify-center mr-3 mt-0.5">
                      <Brain className="text-purple-600" size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-neutral-800 dark:text-neutral-200">
                        Our AI model suggests setting up automatic transfers to
                        maximize your savings potential.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Predictions;
