import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Subscription, SubscriptionSummary } from "../types";
import { CURRENCIES } from "../utils/currency";
import { formatMoney, formatDate } from "../lib/format";
import { usePageHeader } from "../contexts/PageHeaderContext";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Tabs } from "../components/ui/Tabs";
import { Badge } from "../components/ui/Badge";
import { Button, IconButton } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Input";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Icons } from "../components/ui/icons";
import { format } from "date-fns";
import { toast } from "sonner";

const POPULAR_PRESETS = [
  { name: "Netflix", category: "Entertainment", cost: 15.99 },
  { name: "Spotify", category: "Entertainment", cost: 10.99 },
  { name: "ChatGPT Plus", category: "Productivity", cost: 20.0 },
  { name: "Amazon Prime", category: "Shopping", cost: 14.99 },
  { name: "YouTube Premium", category: "Entertainment", cost: 13.99 },
  { name: "GitHub Copilot", category: "Developer", cost: 10.0 },
  { name: "iCloud+ Storage", category: "Cloud & Backup", cost: 2.99 },
  { name: "Gym Membership", category: "Health & Fitness", cost: 40.0 },
];

export default function Subscriptions() {
  const { user } = useAuth();
  const { setPageHeader } = usePageHeader();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageHeader("Subscriptions");
  }, [setPageHeader]);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [subToDelete, setSubToDelete] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Entertainment");
  const [cost, setCost] = useState("");
  const [currency, setCurrency] = useState(user?.currency || "INR");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [nextBillingDate, setNextBillingDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [status, setStatus] = useState("active");
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load subscriptions";
      toast.error(message);
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
    setCurrency(user?.currency || "INR");
  };

  const openAddModal = () => {
    setEditingSub(null);
    setName("");
    setCategory("Entertainment");
    setCost("");
    setCurrency(user?.currency || "INR");
    setBillingCycle("monthly");
    setNextBillingDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentMethod("Credit Card");
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
    setCurrency(sub.currency || user?.currency || "INR");
    setBillingCycle(sub.billing_cycle);
    setNextBillingDate(sub.next_billing_date);
    setPaymentMethod(sub.payment_method);
    setStatus(sub.status);
    setIsTrial(sub.is_trial);
    setTrialEndsAt(sub.trial_ends_at || "");
    setNotes(sub.notes || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cost) return;

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        category,
        cost: parseFloat(cost),
        currency,
        billing_cycle: billingCycle,
        next_billing_date: nextBillingDate,
        payment_method: paymentMethod,
        status,
        is_trial: isTrial,
        trial_ends_at: isTrial && trialEndsAt ? trialEndsAt : undefined,
        notes: notes.trim() || undefined,
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save subscription";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenew = async (id: string, subName: string) => {
    try {
      await api.subscriptions.renew(id);
      toast.success(`Renewed ${subName} for next billing cycle.`);
      loadSubscriptions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to renew subscription";
      toast.error(message);
    }
  };

  const handleToggleStatus = async (sub: Subscription) => {
    const newStatus = sub.status === "active" ? "paused" : "active";
    try {
      await api.subscriptions.update(sub.id, { status: newStatus });
      toast.success(`Subscription marked as ${newStatus}`);
      loadSubscriptions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!subToDelete) return;
    try {
      await api.subscriptions.delete(subToDelete);
      toast.success("Subscription deleted.");
      setSubToDelete(null);
      loadSubscriptions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete subscription";
      toast.error(message);
    }
  };

  const filteredSubs = subscriptions.filter((sub) => {
    if (filterStatus !== "all" && sub.status !== filterStatus) return false;
    if (filterCategory !== "all" && sub.category !== filterCategory) return false;
    return true;
  });

  const categoriesList = Array.from(new Set(subscriptions.map((s) => s.category)));

  const statusTabs = [
    { id: "all", label: `All (${subscriptions.length})` },
    { id: "active", label: "Active Only" },
    { id: "paused", label: "Paused" },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Subscriptions"
        description="Track recurring digital memberships, SaaS tools, and utilities to avoid unwanted renewals."
        action={
          <Button
            variant="primary"
            icon={<Icons.Add size={16} />}
            onClick={openAddModal}
          >
            Add Subscription
          </Button>
        }
      />

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Monthly Burn Rate"
            value={formatMoney(summary.totalMonthlyBurn, user?.currency)}
            helperText="Normalized recurring cost / mo"
          />

          <StatCard
            label="Annualized Cost"
            value={formatMoney(summary.totalAnnualBurn, user?.currency)}
            helperText="Total yearly subscription cost"
          />

          <StatCard
            label="Renewing in 7 Days"
            value={summary.renewingIn7DaysCount.toString()}
            variant={summary.renewingIn7DaysCount > 0 ? "warning" : "default"}
            helperText="Upcoming renewal charges"
          />

          <StatCard
            label="Active Subscriptions"
            value={summary.activeCount.toString()}
            helperText={`${summary.pausedCount} currently paused`}
          />
        </div>
      )}

      {/* Filters and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <Tabs
          tabs={statusTabs}
          activeTab={filterStatus}
          onChange={setFilterStatus}
          variant="underline"
        />

        {categoriesList.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Category:</span>
            <select
              aria-label="Filter category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-md text-xs text-[var(--text)]"
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
        </div>
      ) : filteredSubs.length === 0 ? (
        <EmptyState
          icon={<Icons.Subscriptions size={24} />}
          title="No subscriptions found"
          description="Keep tabs on your recurring bills, digital subscriptions, and trial periods so you never get surprised by auto-debit."
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<Icons.Add size={16} />}
              onClick={openAddModal}
            >
              Add First Subscription
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubs.map((sub) => {
            const sCurr = sub.currency || user?.currency || "INR";
            const daysLeft = sub.days_until_renewal !== undefined ? sub.days_until_renewal : 0;
            const isDueSoon = sub.is_renewing_soon;

            return (
              <Card
                key={sub.id}
                className={`p-5 flex flex-col justify-between space-y-4 ${
                  sub.status === "paused" ? "opacity-60" : ""
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-md bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] font-semibold text-sm">
                      {sub.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {sub.is_trial && (
                        <Badge variant="info">
                          Trial
                        </Badge>
                      )}
                      <Badge
                        variant={
                          sub.status === "active"
                            ? isDueSoon
                              ? "warning"
                              : "success"
                            : "neutral"
                        }
                      >
                        {sub.status === "active"
                          ? isDueSoon
                            ? `Renews in ${daysLeft}d`
                            : "Active"
                          : "Paused"}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-[var(--text)]">{sub.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {sub.category} • {sub.payment_method}
                  </p>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-xl font-semibold text-[var(--text)] tabular-nums">
                      {formatMoney(sub.cost, sCurr)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">/ {sub.billing_cycle}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>Next Charge</span>
                    <span className="font-medium text-[var(--text)]">
                      {formatDate(sub.next_billing_date)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <IconButton
                        variant="ghost"
                        size="sm"
                        ariaLabel="Renew for next cycle"
                        icon={<Icons.Repeat size={14} />}
                        onClick={() => handleRenew(sub.id, sub.name)}
                      />
                      <IconButton
                        variant="ghost"
                        size="sm"
                        ariaLabel={sub.status === "active" ? "Pause subscription" : "Resume subscription"}
                        icon={sub.status === "active" ? <Icons.Close size={14} /> : <Icons.Check size={14} />}
                        onClick={() => handleToggleStatus(sub)}
                      />
                      <IconButton
                        variant="ghost"
                        size="sm"
                        ariaLabel="Edit subscription"
                        icon={<Icons.Edit size={14} />}
                        onClick={() => openEditModal(sub)}
                      />
                    </div>
                    <IconButton
                      variant="danger"
                      size="sm"
                      ariaLabel="Delete subscription"
                      icon={<Icons.Delete size={14} />}
                      onClick={() => setSubToDelete(sub.id)}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Add/Edit Subscription */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSub ? "Edit Subscription" : "Add New Subscription"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingSub && (
            <div>
              <span className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1.5">
                Quick Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2.5 py-1 bg-[var(--surface-muted)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text)] rounded-md text-xs font-medium transition cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Service / Subscription Name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Spotify Premium, Netflix, iCloud"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { label: "Entertainment", value: "Entertainment" },
                { label: "Productivity", value: "Productivity" },
                { label: "Developer Tools", value: "Developer" },
                { label: "Cloud & Storage", value: "Cloud & Backup" },
                { label: "Health & Fitness", value: "Health & Fitness" },
                { label: "Shopping", value: "Shopping" },
                { label: "News & Media", value: "News & Media" },
                { label: "Other", value: "Other" },
              ]}
            />

            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { label: "Credit Card", value: "Credit Card" },
                { label: "Debit Card", value: "Debit Card" },
                { label: "UPI AutoPay", value: "UPI AutoPay" },
                { label: "PayPal", value: "PayPal" },
                { label: "Net Banking", value: "Net Banking" },
                { label: "Other", value: "Other" },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Cost"
              type="number"
              step="0.01"
              required
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
            />

            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={CURRENCIES.map((c) => ({
                label: `${c.code} (${c.symbol})`,
                value: c.code,
              }))}
            />

            <Select
              label="Billing Cycle"
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
              options={[
                { label: "Monthly", value: "monthly" },
                { label: "Yearly", value: "yearly" },
                { label: "Weekly", value: "weekly" },
                { label: "Quarterly", value: "quarterly" },
              ]}
            />
          </div>

          <Input
            label="Next Billing Date"
            type="date"
            required
            value={nextBillingDate}
            onChange={(e) => setNextBillingDate(e.target.value)}
          />

          <div className="space-y-2 pt-1 border-t border-[var(--border)]">
            <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer">
              <input
                type="checkbox"
                checked={isTrial}
                onChange={(e) => setIsTrial(e.target.checked)}
                className="rounded-xs text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span>This is a free trial period</span>
            </label>

            {isTrial && (
              <Input
                label="Trial Expiration Date"
                type="date"
                value={trialEndsAt}
                onChange={(e) => setTrialEndsAt(e.target.value)}
              />
            )}
          </div>

          <Textarea
            label="Notes (Optional)"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Account email, cancellation link, notes..."
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : editingSub ? "Update Subscription" : "Add Subscription"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!subToDelete}
        onClose={() => setSubToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Subscription"
        message="Are you sure you want to delete this subscription from tracking?"
        confirmText="Delete Subscription"
      />
    </div>
  );
}
