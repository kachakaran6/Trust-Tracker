import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  PlusCircle,
  MinusCircle,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Download,
  Share2,
  Calendar,
  PieChart as PieChartIcon
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { toast, Toaster } from "react-hot-toast";

interface Transaction {
  amount: number;
  type: "income" | "expense";
  category_name?: string;
  category_id?: string;
  description: string;
  date: string;
}

export default function SessionAnalytics() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const { data: session, error } = await supabase
          .from("temporary_analytics")
          .select("data, expires_at")
          .eq("id", id)
          .single();

        if (error) throw new Error("Session expired or does not exist");

        // Convert session_data (it can be an array or an object with an array)
        let transactions: Transaction[] = [];
        if (Array.isArray(session.data)) {
          transactions = session.data;
        } else if (session.data.transactions) {
          transactions = session.data.transactions;
        } else if (session.data.data) {
          transactions = session.data.data;
        }

        setData(transactions);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchSession();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Session Expired
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The data session was either not found or has expired (sessions last 30 minutes).
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Back Home
          </Link>
        </div>
      </div>
    );
  }

  // Analytics Processing
  const totalIncome = data
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = data
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpense;

  // Category Breakdown
  const categoryData = data.reduce((acc: any, t) => {
    if (t.type === 'expense') {
      const cat = t.category_name || "Misc";
      acc[cat] = (acc[cat] || 0) + Number(t.amount);
    }
    return acc;
  }, {});

  const pieChartData = Object.keys(categoryData).map(name => ({
    name,
    value: categoryData[name]
  })).sort((a, b) => b.value - a.value);

  // Daily Trends (Bar Chart)
  const dailyData = data.reduce((acc: any, t) => {
    const day = format(parseISO(t.date), 'MMM dd');
    if (!acc[day]) acc[day] = { name: day, income: 0, expense: 0 };
    if (t.type === 'income') acc[day].income += Number(t.amount);
    else acc[day].expense += Number(t.amount);
    return acc;
  }, {});

  const barChartData = Object.values(dailyData).slice(-7); // Last 7 unique days

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trust_tracker_session_${id?.slice(0, 8)}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <Toaster />
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-semibold mb-1">
              <TrendingUp className="w-5 h-5" /> TEMPORARY ANALYSIS
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              Insight Report
            </h1>
            <p className="text-sm text-amber-600 font-medium">⚠️ Valid for 30 minutes from creation</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm hover:bg-gray-50 transition"
            >
              <Share2 className="w-4 h-4 cursor-pointer" /> Share
            </button>
            <button
              onClick={downloadJSON}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm font-medium">TOTAL REVENUE</span>
              <PlusCircle className="text-green-500 w-5 h-5 opacity-80" />
            </div>
            <div className="text-3xl font-bold text-green-600">₹ {totalIncome.toLocaleString()}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm font-medium">TOTAL SPENDING</span>
              <MinusCircle className="text-red-500 w-5 h-5 opacity-80" />
            </div>
            <div className="text-3xl font-bold text-red-600">₹ {totalExpense.toLocaleString()}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm font-medium">NET SAVINGS</span>
              <Calendar className="text-blue-500 w-5 h-5 opacity-80" />
            </div>
            <div className={`text-3xl font-bold ${netBalance >= 0 ? "text-blue-600" : "text-amber-600"}`}>
              ₹ {netBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Spending Behavior (Pie Chart) */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-6">
              <PieChartIcon className="w-5 h-5 text-indigo-500" /> Spending Distribution
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Cashflow (Bar Chart) */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-green-500" /> Recent Cashflow (7 Days)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Legend verticalAlign="top" align="right" height={36} />
                  <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Recent Activity Table */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border dark:border-gray-800 overflow-hidden">
          <div className="p-6 border-b dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Sample Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {data.slice(0, 10).map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition">
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {format(parseISO(t.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{t.description}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${t.type === 'income' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                        {t.type.toUpperCase()}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'income' ? "text-green-600" : "text-red-600"
                      }`}>
                      ₹ {Number(t.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.length > 10 && (
            <div className="p-4 text-center bg-gray-50 dark:bg-gray-800/20 text-xs text-gray-500">
              Showing top 10 of {data.length} records. Download report to see all.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
