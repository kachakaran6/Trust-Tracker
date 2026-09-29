import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { PredictionResponse } from "../types";
import { formatCurrency as globalFormatCurrency } from "../utils/currency";
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
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  DollarSign,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function Predictions() {
  const { user } = useAuth();
  const [range, setRange] = useState(3);
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const formatCurrency = (val: number) => globalFormatCurrency(val, user?.currency);

  const loadForecast = async (r: number) => {
    try {
      setIsLoading(true);
      const res = await api.predictions.getForecast(r);
      setData(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to load forecast data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadForecast(range);
  }, [range]);

  const combinedChartData = data?.forecast.map((f) => ({
    month: f.month,
    Actual: f.actual,
    Predicted: f.predicted,
    Confidence: f.confidence,
  })) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-indigo-500" />
            Predictive AI Financial Forecasting
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Deterministic statistical modeling & trend projections based on your real spending history
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[1, 3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setRange(m)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                range === m
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {m}M Forecast
            </button>
          ))}
          <button
            onClick={() => loadForecast(range)}
            disabled={isLoading}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Avg Spending</span>
            <DollarSign className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {formatCurrency(data?.avgMonthlyExpense || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Based on historical trailing activity</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Spending Momentum</span>
            {(data?.monthlyTrendSlope || 0) >= 0 ? (
              <TrendingUp className="w-5 h-5 text-amber-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2 flex items-center gap-1.5">
            {(data?.monthlyTrendSlope || 0) >= 0 ? "+" : ""}
            {formatCurrency(data?.monthlyTrendSlope || 0)}/mo
          </p>
          <p className="text-xs text-slate-400 mt-1">Linear trend velocity</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Model Engine</span>
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-base font-bold text-slate-900 dark:text-white mt-2 truncate">
            {data?.modelType || "Regression Engine"}
          </p>
          <p className="text-xs text-emerald-500 font-medium mt-1">✓ High Confidence Projection</p>
        </div>
      </div>

      {/* Main Forecast Chart */}
      <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" />
          Historical vs Predicted Spend Trajectory
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(val) => formatCurrency(val).replace(/\.\d+/, "")} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                formatter={(value: any) => [formatCurrency(Number(value)), ""]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Actual"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="Predicted"
                stroke="#8B5CF6"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Forecast Breakdown */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Predicted Category Spending Breakdown
        </h3>
        {data?.categoryPredictions && data.categoryPredictions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.categoryPredictions.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">{cat.name}</span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                      cat.trend > 0
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-emerald-500/10 text-emerald-500"
                    }`}
                  >
                    {cat.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(cat.trend)}%
                  </span>
                </div>
                <div className="flex justify-between items-baseline mt-3">
                  <div>
                    <p className="text-xs text-slate-400">Current Avg</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {formatCurrency(cat.currentAverage)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Projected</p>
                    <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(cat.predicted)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">
            Record a few transactions across different categories to see automated category predictions.
          </p>
        )}
      </div>
    </div>
  );
}
