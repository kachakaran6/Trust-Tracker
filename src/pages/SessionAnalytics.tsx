import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { formatMoney, formatDate, formatCategory } from "../lib/format";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Icons } from "../components/ui/icons";

interface Transaction {
  amount: number;
  type: "income" | "expense";
  category_name?: string;
  category_id?: string;
  description: string;
  date: string;
}

export default function SessionAnalytics() {
  const { user } = useAuth();
  const formatCurrency = (val: number) => formatMoney(val, user?.currency);
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      if (!id) return;
      try {
        const session = await api.analytics.getSession(id);
        const sData = session.sessionData;
        let transactions: Transaction[] = [];
        if (Array.isArray(sData)) {
          transactions = sData;
        } else if (sData && sData.transactions) {
          transactions = sData.transactions;
        } else if (sData && sData.data) {
          transactions = sData.data;
        }

        const sanitized = transactions
          .filter((t) => t && (t.amount || t.description))
          .map((t) => ({
            ...t,
            type: (t.type === "income" ? "income" : "expense") as "income" | "expense",
            amount: Number(t.amount) || 0,
            date: t.date || new Date().toISOString(),
          }));

        setData(sanitized);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load session";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchSession();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] px-4">
        <EmptyState
          icon={<Icons.Alert size={28} className="text-[var(--danger)]" />}
          title="Session Expired or Not Found"
          description="This temporary analytics snapshot was either not found or has expired (sessions last 30 minutes)."
          action={
            <Link to="/dashboard">
              <Button variant="primary" icon={<Icons.Back size={16} />}>
                Back to Dashboard
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const totalIncome = data
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = data
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpense;

  const categoryMap: Record<string, number> = {};
  data.forEach((t) => {
    if (t.type === "expense") {
      const cat = formatCategory(t.category_name || "Uncategorized");
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(t.amount);
    }
  });

  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  const PALETTE = ["#0284C7", "#059669", "#D97706", "#DC2626", "#475569"];

  const handleDownload = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const a = document.createElement("a");
    a.href = jsonString;
    a.download = `trusttracker_session_${id?.slice(0, 8)}.json`;
    a.click();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Session URL copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Shared Session Analytics"
          description="Ephemeral read-only analytics snapshot (valid for 30 minutes from creation)."
          secondaryActions={
            <Button
              variant="secondary"
              icon={<Icons.Download size={16} />}
              onClick={handleDownload}
            >
              Export JSON
            </Button>
          }
          action={
            <Button
              variant="primary"
              icon={<Icons.Share size={16} />}
              onClick={handleShare}
            >
              Share Link
            </Button>
          }
        />

        {/* Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Income"
            value={formatCurrency(totalIncome)}
            variant="success"
          />
          <StatCard
            label="Total Expenses"
            value={formatCurrency(totalExpense)}
            variant="danger"
          />
          <StatCard
            label="Net Balance"
            value={formatMoney(netBalance, user?.currency, { showSign: true })}
            variant={netBalance >= 0 ? "success" : "danger"}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Spending Distribution">
            {categoryData.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-12 text-center">
                No expense categories found in this session.
              </p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PALETTE[index % PALETTE.length]}
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
                      formatter={(val) => [formatCurrency(Number(val)), ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card title="Session Transaction Records">
            <div className="max-h-64 overflow-y-auto divide-y divide-[var(--border)]">
              {data.map((t, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <p className="font-medium text-[var(--text)]">{t.description || "Expense"}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {formatCategory(t.category_name)} · {formatDate(t.date)}
                    </p>
                  </div>
                  <span
                    className={`font-semibold tabular-nums ${
                      t.type === "income" ? "text-[var(--success)]" : "text-[var(--danger)]"
                    }`}
                  >
                    {formatMoney(t.amount, user?.currency, { showSign: true })}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
