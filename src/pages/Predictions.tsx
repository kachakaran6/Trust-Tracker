import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { PredictionResponse } from "../types";
import { formatMoney, formatCategory } from "../lib/format";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { usePageHeader } from "../contexts/PageHeaderContext";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card } from "../components/ui/Card";
import { Tabs } from "../components/ui/Tabs";
import { IconButton } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Badge } from "../components/ui/Badge";
import { Icons } from "../components/ui/icons";

export default function Predictions() {
  const { user } = useAuth();
  const { setPageHeader } = usePageHeader();
  const [range, setRange] = useState<"1" | "3" | "6" | "12">("3");
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPageHeader("Spending Forecast");
  }, [setPageHeader]);

  const formatCurrency = (val: number) => formatMoney(val, user?.currency);

  const loadForecast = async (r: number) => {
    try {
      setIsLoading(true);
      const res = await api.predictions.getForecast(r);
      setData(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load forecast data";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadForecast(parseInt(range, 10));
  }, [range]);

  const combinedChartData =
    data?.forecast?.map((f) => ({
      month: f.month,
      Actual: f.actual,
      Forecast: f.predicted,
    })) || [];

  const hasHistoricalData =
    data &&
    data.forecast &&
    data.forecast.some((f) => f.actual !== null && f.actual !== undefined && f.actual > 0);

  const horizonTabs = [
    { id: "1" as const, label: "1 Month" },
    { id: "3" as const, label: "3 Months" },
    { id: "6" as const, label: "6 Months" },
    { id: "12" as const, label: "12 Months" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spending Forecast"
        description="Linear regression projections based on historical transaction velocity and category pacing."
        action={
          <div className="flex items-center gap-2">
            <Tabs
              variant="segmented"
              tabs={horizonTabs}
              activeTab={range}
              onChange={(tabId) => setRange(tabId)}
            />
            <IconButton
              aria-label="Refresh forecast"
              variant="secondary"
              size="sm"
              icon={
                <Icons.Refresh
                  size={14}
                  className={isLoading ? "animate-spin" : ""}
                />
              }
              onClick={() => loadForecast(parseInt(range, 10))}
              disabled={isLoading}
            />
          </div>
        }
      />

      {!hasHistoricalData && !isLoading ? (
        <EmptyState
          icon={<Icons.Forecast size={24} />}
          title="Not enough data yet"
          description="Spending forecasts require at least 3 months of recorded activity to compute reliable linear trends."
        />
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard
              label="Monthly Average Spending"
              value={formatCurrency(data?.avgMonthlyExpense || 0)}
              helperText="Trailing historical run-rate"
            />

            <StatCard
              label="Spending Velocity"
              value={
                data?.monthlyTrendSlope
                  ? formatMoney(data.monthlyTrendSlope, user?.currency, { showSign: true }) + " / mo"
                  : "0.00 / mo"
              }
              helperText="Linear trajectory direction"
              variant={
                (data?.monthlyTrendSlope || 0) > 0
                  ? "danger"
                  : (data?.monthlyTrendSlope || 0) < 0
                  ? "success"
                  : "neutral"
              }
            />

            <StatCard
              label="Forecasting Model"
              value="Linear Regression"
              helperText="Paced against trailing cashflows"
              variant="neutral"
            />
          </div>

          {/* Main Forecast Chart */}
          <Card title="Historical vs Projected Spend Trajectory">
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={combinedChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
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
                    formatter={(value: unknown) => [formatCurrency(Number(value)), ""]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    name="Actual Spending"
                    dataKey="Actual"
                    stroke="#0284C7"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    name="Projected Forecast"
                    dataKey="Forecast"
                    stroke="#0284C7"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Category Forecast Breakdown */}
          <Card title="Category Spending Projections">
            {data?.categoryPredictions && data.categoryPredictions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.categoryPredictions.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-sm border border-[var(--border)] bg-[var(--surface-muted)] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs sm:text-sm text-[var(--text)] truncate">
                        {formatCategory(cat.name)}
                      </span>
                      <Badge
                        variant={cat.trend > 0 ? "warning" : "success"}
                        size="sm"
                      >
                        {cat.trend > 0 ? `+${cat.trend}%` : `${cat.trend}%`}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-baseline text-xs text-[var(--text-muted)]">
                      <span>Current Avg: {formatCurrency(cat.currentAverage)}</span>
                      <span className="font-semibold text-[var(--primary)] tabular-nums">
                        Est: {formatCurrency(cat.predicted)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center">
                Record transactions across distinct categories to populate category pacing projections.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
