import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Subscription, SubscriptionSummary } from "../types";
import { CURRENCIES, formatCurrency, getCurrencySymbol } from "../utils/currency";
import { Dropdown } from "../components/ui/Dropdown";
import { Badge } from "../components/ui/Badge";
import {
  Sparkles,
  Plus,
  Calendar,
  CreditCard,
  Trash2,
  Edit2,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Film,
  Music,
  Tv,
  Code,
  Cloud,
  Zap,
  Tag,
  Dumbbell,
  BookOpen,
  DollarSign,
  Layers,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const POPULAR_PRESETS = [
  { name: "Netflix", category: "Entertainment", cost: 15.99, icon: "Film", color: "#E50914" },
  { name: "Spotify", category: "Entertainment", cost: 10.99, icon: "Music", color: "#1DB954" },
  { name: "ChatGPT Plus", category: "Productivity", cost: 20.00, icon: "Zap", color: "#10A37F" },
  { name: "Amazon Prime", category: "Shopping", cost: 14.99, icon: "Tag", color: "#FF9900" },
  { name: "YouTube Premium", category: "Entertainment", cost: 13.99, icon: "Tv", color: "#FF0000" },
  { name: "GitHub Copilot", category: "Developer", cost: 10.00, icon: "Code", color: "#238636" },
  { name: "iCloud+ Storage", category: "Cloud & Backup", cost: 2.99, icon: "Cloud", color: "#007AFF" },
  { name: "Gym Membership", category: "Health & Fitness", cost: 40.00, icon: "Dumbbell", color: "#8B5CF6" },
];

export default function Subscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paused">("all");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Entertainment");
  const [cost, setCost] = useState("");
  const [currency, setCurrency] = useState(user?.currency || "USD");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [nextBillingDate, setNextBillingDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [icon, setIcon] = useState("Film");
  const [color, setColor] = useState("#6366F1");
  const [status, setStatus] = useState("active");
  const [reminderDays, setReminderDays] = useState(3);
  const [isTrial, setIsTrial] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.subscriptions.list();
      setSubscriptions(res.subscriptions);
      setSummary(res.summary);
    } catch (err: any) {
      toast.error(err.message || "Failed to load subscriptions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const applyPreset = (preset: typeof POPULAR_PRESETS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setCost(preset.cost.toString());
    setIcon(preset.icon);
    setColor(preset.color);
    setCurrency(user?.currency || "USD");
  };

  const openAddModal = () => {
    setEditingSub(null);
    setName("");
    setCategory("Entertainment");
    setCost("");
    setCurrency(user?.currency || "USD");
    setBillingCycle("monthly");
    setNextBillingDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentMethod("Credit Card");
    setIcon("Film");
    setColor("#6366F1");
    setStatus("active");
    setIsTrial(false);
    setTrialEndsAt("");
    setNotes("");
    setShowModal(true);
  };

  const openEditModal = (sub: Subscription) => {
    setEditingSub(sub);
    setName(sub.name);
    setCategory(sub.category);
    setCost(sub.cost.toString());
    setCurrency(sub.currency);
    setBillingCycle(sub.billing_cycle);
    setNextBillingDate(sub.next_billing_date);
    setPaymentMethod(sub.payment_method);
    setIcon(sub.icon);
    setColor(sub.color);
    setStatus(sub.status);
    setReminderDays(sub.reminder_days);
    setIsTrial(sub.is_trial);
    setTrialEndsAt(sub.trial_ends_at || "");
    setNotes(sub.notes || "");
    setShowModal(true);
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cost || !nextBillingDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        category: category.trim(),
        cost: parseFloat(cost),
        currency,
        billing_cycle: billingCycle,
        next_billing_date: nextBillingDate,
        payment_method: paymentMethod,
        icon,
        color,
        status,
        reminder_days: reminderDays,
        is_trial: isTrial,
        trial_ends_at: isTrial && trialEndsAt ? trialEndsAt : null,
        notes: notes.trim(),
      };

      if (editingSub) {
        await api.subscriptions.update(editingSub.id, payload);
        toast.success("Subscription updated!");
      } else {
        await api.subscriptions.create(payload);
        toast.success("Subscription added!");
      }

      setShowModal(false);
      loadSubscriptions();
    } catch (err: any) {
      toast.error(err.message || "Failed to save subscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenew = async (id: string, name: string) => {
    try {
      await api.subscriptions.renew(id, true);
      toast.success(`Renewed "${name}" for next cycle! Recorded in transactions.`);
      loadSubscriptions();
    } catch (err: any) {
      toast.error(err.message || "Failed to renew subscription");
    }
  };

  const handleToggleStatus = async (sub: Subscription) => {
    const newStatus = sub.status === "active" ? "paused" : "active";
    try {
      await api.subscriptions.update(sub.id, { status: newStatus });
      toast.success(`Subscription marked as ${newStatus}`);
      loadSubscriptions();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subscription?")) return;
    try {
      await api.subscriptions.delete(id);
      toast.success("Subscription deleted.");
      loadSubscriptions();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete subscription");
    }
  };

  const currencyOptions = CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.flag || ""} ${c.code} (${c.symbol}) - ${c.name}`,
    badge: c.symbol,
  }));

  const filteredSubs = subscriptions.filter((sub) => {
    if (filterStatus !== "all" && sub.status !== filterStatus) return false;
    if (filterCategory !== "all" && sub.category !== filterCategory) return false;
    return true;
  });

  const categoriesList = Array.from(new Set(subscriptions.map((s) => s.category)));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-7 h-7 text-sky-500" />
            Recurring Subscriptions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track streaming, software, fitness, and recurring services with renewal alerts and burn rate analytics
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-md shadow-primary-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Burn Rate</span>
            <p className="text-2xl font-extrabold text-primary-600 dark:text-sky-400 mt-1">
              {formatCurrency(summary.totalMonthlyBurn, user?.currency)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Normalized recurring cost / mo</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Annualized Burn Rate</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {formatCurrency(summary.totalAnnualBurn, user?.currency)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Total yearly subscription cost</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Renewing in 7 Days</span>
            <p className={`text-2xl font-extrabold mt-1 ${summary.renewingIn7DaysCount > 0 ? "text-amber-500" : "text-emerald-500"}`}>
              {summary.renewingIn7DaysCount}
            </p>
            <p className="text-xs text-slate-400 mt-1">Upcoming renewal charges</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Subscriptions</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {summary.activeCount}
            </p>
            <p className="text-xs text-slate-400 mt-1">{summary.pausedCount} currently paused</p>
          </div>
        </div>
      )}

      {/* Filters and Category Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === "all"
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            All Statuses
          </button>
          <button
            onClick={() => setFilterStatus("active")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === "active"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            Active Only
          </button>
          <button
            onClick={() => setFilterStatus("paused")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === "paused"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            Paused
          </button>
        </div>

        {categoriesList.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-xs"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Subscriptions Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : filteredSubs.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Subscriptions Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Keep tabs on your recurring bills, digital subscriptions, and trial periods so you never get surprised by an auto-debit!
          </p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow-sm cursor-pointer"
          >
            Add Your First Subscription
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubs.map((sub) => {
            const sCurr = sub.currency || user?.currency || "USD";
            const daysLeft = sub.days_until_renewal !== undefined ? sub.days_until_renewal : 0;
            const isDueSoon = sub.is_renewing_soon;

            return (
              <motion.div
                key={sub.id}
                whileHover={{ y: -3 }}
                className={`bg-white dark:bg-slate-800 border rounded-3xl p-6 shadow-sm flex flex-col justify-between transition ${
                  isDueSoon
                    ? "border-amber-500/50 shadow-amber-500/5"
                    : sub.status === "paused"
                    ? "border-slate-200 dark:border-slate-700 opacity-70"
                    : "border-slate-200 dark:border-slate-700/60"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm"
                      style={{ backgroundColor: sub.color || "#0284c7" }}
                    >
                      {sub.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {sub.is_trial && (
                        <Badge variant="purple" size="sm">
                          Free Trial
                        </Badge>
                      )}
                      <Badge
                        variant={sub.status === "active" ? (isDueSoon ? "warning" : "success") : "neutral"}
                        size="sm"
                      >
                        {sub.status === "active"
                          ? isDueSoon
                            ? `Renews in ${daysLeft}d`
                            : "Active"
                          : "Paused"}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{sub.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{sub.category} • {sub.payment_method}</p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(sub.cost, sCurr)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/ {sub.billing_cycle}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Next Charge
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {format(new Date(sub.next_billing_date), "MMM d, yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRenew(sub.id, sub.name)}
                        className="p-2 text-slate-400 hover:text-emerald-500 rounded-lg transition cursor-pointer"
                        title="Quick Renew for Next Cycle"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(sub)}
                        className="p-2 text-slate-400 hover:text-amber-500 rounded-lg transition cursor-pointer"
                        title={sub.status === "active" ? "Pause Subscription" : "Resume Subscription"}
                      >
                        {sub.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(sub)}
                        className="p-2 text-slate-400 hover:text-primary-600 rounded-lg transition cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal: Add/Edit Subscription */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-sky-500" />
                  {editingSub ? "Edit Subscription" : "Add Subscription"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Presets Bar */}
              {!editingSub && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Quick Preset Autofill
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {POPULAR_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => applyPreset(p)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveSubscription} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Service Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Netflix, Spotify, AWS"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Category</label>
                    <input
                      type="text"
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Entertainment, Cloud, Fitness"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="14.99"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-bold"
                    />
                  </div>

                  <div>
                    <Dropdown
                      label="Currency"
                      options={currencyOptions}
                      value={currency}
                      onChange={setCurrency}
                      searchable
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Billing Cycle</label>
                    <select
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Next Billing Date</label>
                    <input
                      type="date"
                      required
                      value={nextBillingDate}
                      onChange={(e) => setNextBillingDate(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Google Pay / UPI">Google Pay / UPI</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Direct Bank Debit">Direct Bank Debit</option>
                      <option value="Apple Pay">Apple Pay</option>
                    </select>
                  </div>
                </div>

                {/* Free trial toggle */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="trialToggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Is this currently a Free Trial?
                    </label>
                    <input
                      type="checkbox"
                      id="trialToggle"
                      checked={isTrial}
                      onChange={(e) => setIsTrial(e.target.checked)}
                      className="rounded text-primary-600 cursor-pointer"
                    />
                  </div>
                  {isTrial && (
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Trial Expiration Date</label>
                      <input
                        type="date"
                        value={trialEndsAt}
                        onChange={(e) => setTrialEndsAt(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : editingSub ? "Update Subscription" : "Save Subscription"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
