import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { useCategories } from "../contexts/CategoriesContext";
import { CURRENCIES, detectUserCurrency } from "../utils/currency";
import { formatMoney } from "../lib/format";
import { usePageHeader } from "../contexts/PageHeaderContext";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Tabs } from "../components/ui/Tabs";
import { Badge } from "../components/ui/Badge";
import { Button, IconButton } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Icons } from "../components/ui/icons";
import { toast } from "sonner";

const TIMEZONE_OPTIONS = [
  { label: "Asia/Kolkata (IST, UTC+5:30)", value: "Asia/Kolkata" },
  { label: "Asia/Dubai (GST, UTC+4)", value: "Asia/Dubai" },
  { label: "Asia/Singapore (SGT, UTC+8)", value: "Asia/Singapore" },
  { label: "Asia/Tokyo (JST, UTC+9)", value: "Asia/Tokyo" },
  { label: "Europe/London (GMT/BST, UTC+0/+1)", value: "Europe/London" },
  { label: "Europe/Paris (CET/CEST, UTC+1/+2)", value: "Europe/Paris" },
  { label: "America/New_York (Eastern Time, UTC-5/-4)", value: "America/New_York" },
  { label: "America/Chicago (Central Time, UTC-6/-5)", value: "America/Chicago" },
  { label: "America/Denver (Mountain Time, UTC-7/-6)", value: "America/Denver" },
  { label: "America/Los_Angeles (Pacific Time, UTC-8/-7)", value: "America/Los_Angeles" },
  { label: "Australia/Sydney (AEST/AEDT, UTC+10/+11)", value: "Australia/Sydney" },
  { label: "UTC (Coordinated Universal Time)", value: "UTC" },
];

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { setPageHeader } = usePageHeader();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();

  useEffect(() => {
    setPageHeader("Settings");
  }, [setPageHeader]);

  const defaultUserTz =
    user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";

  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    timezone: defaultUserTz,
    currency: user?.currency || "INR",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    color: "#0284C7",
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        timezone: user.timezone || defaultUserTz,
        currency: user.currency || "INR",
      });
    }
  }, [user, defaultUserTz]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      await updateProfile({
        name: profileData.name.trim(),
        currency: profileData.currency,
        timezone: profileData.timezone,
      });
      toast.success("Profile preferences updated!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    try {
      setIsPasswordUpdating(true);
      await api.auth.updatePassword({ currentPassword, newPassword });
      setNewPassword("");
      setCurrentPassword("");
      toast.success("Password changed successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      toast.error(message);
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, {
          name: categoryForm.name.trim(),
          type: categoryForm.type,
          color: categoryForm.color,
          icon: "Tag",
        });
        toast.success("Category updated!");
      } else {
        await addCategory({
          name: categoryForm.name.trim(),
          type: categoryForm.type,
          color: categoryForm.color,
          icon: "Tag",
        });
        toast.success("Category added!");
      }

      setShowCategoryModal(false);
      setEditingCategoryId(null);
      setCategoryForm({ name: "", type: "expense", color: "#0284C7" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save category";
      toast.error(message);
    }
  };

  const openEditCategory = (cat: { id: string; name: string; type: "income" | "expense"; color?: string }) => {
    setEditingCategoryId(cat.id);
    setCategoryForm({
      name: cat.name,
      type: cat.type,
      color: cat.color || "#0284C7",
    });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async () => {
    if (!catToDelete) return;
    try {
      await deleteCategory(catToDelete);
      toast.success("Category deleted.");
      setCatToDelete(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete category";
      toast.error(message);
    }
  };

  const handleAutoDetectCurrency = () => {
    const detected = detectUserCurrency();
    setProfileData((prev) => ({ ...prev, currency: detected }));
    toast.success(`Detected currency: ${detected}`);
  };

  const tabs = [
    { id: "profile", label: "Profile & Preferences" },
    { id: "security", label: "Security" },
    { id: "categories", label: `Categories (${categories.length})` },
  ];

  const currencyOptions = CURRENCIES.map((c) => ({
    label: `${c.code} (${c.symbol}) - ${c.name}`,
    value: c.code,
  }));

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Settings"
        description="Manage your profile, preferred currency, regional timezone, password, and custom transaction categories."
      />

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />

      {/* Profile & Preferences Tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-[var(--text)] mb-4">
              Profile & Regional Preferences
            </h3>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Your Name"
                />

                <div>
                  <Input
                    label="Email Address"
                    type="email"
                    value={user?.email || ""}
                    disabled
                  />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Email address is managed via authentication and cannot be edited.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Select
                  label="Timezone"
                  value={profileData.timezone}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, timezone: e.target.value }))
                  }
                  options={TIMEZONE_OPTIONS}
                />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase text-[var(--text-muted)]">
                      Default Currency
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoDetectCurrency}
                      className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Icons.Filter size={12} /> Auto-Detect
                    </button>
                  </div>
                  <Select
                    value={profileData.currency}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, currency: e.target.value }))
                    }
                    options={currencyOptions}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSavingProfile}
                  icon={<Icons.Check size={16} />}
                >
                  {isSavingProfile ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Currency Sample Preview */}
          <Card className="p-6">
            <h4 className="text-sm font-semibold text-[var(--text)] mb-3">
              Currency Format Preview
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-[var(--surface-muted)] rounded-md border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Standard Amount</span>
                <p className="text-base font-semibold text-[var(--text)] tabular-nums mt-1">
                  {formatMoney(1234.5, profileData.currency)}
                </p>
              </div>
              <div className="p-3 bg-[var(--surface-muted)] rounded-md border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Large Amount</span>
                <p className="text-base font-semibold text-[var(--text)] tabular-nums mt-1">
                  {formatMoney(125000, profileData.currency)}
                </p>
              </div>
              <div className="p-3 bg-[var(--surface-muted)] rounded-md border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Fraction Amount</span>
                <p className="text-base font-semibold text-[var(--text)] tabular-nums mt-1">
                  {formatMoney(14.75, profileData.currency)}
                </p>
              </div>
              <div className="p-3 bg-[var(--surface-muted)] rounded-md border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Zero Amount</span>
                <p className="text-base font-semibold text-[var(--text)] tabular-nums mt-1">
                  {formatMoney(0, profileData.currency)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <Card className="p-6 max-w-lg">
          <h3 className="text-base font-semibold text-[var(--text)] mb-4">
            Change Account Password
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="relative">
              <Input
                label="New Password"
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 6 characters"
              />
              <button
                type="button"
                className="absolute right-3 top-7 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
              </button>
            </div>

            <Button
              variant="primary"
              type="submit"
              disabled={isPasswordUpdating}
            >
              {isPasswordUpdating ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Card>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-[var(--text)]">
                Transaction Categories
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Customize tags and colors used for income and expense classification.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Icons.Add size={16} />}
              onClick={() => {
                setEditingCategoryId(null);
                setCategoryForm({ name: "", type: "expense", color: "#0284C7" });
                setShowCategoryModal(true);
              }}
            >
              Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense Categories */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Expense Categories ({categories.filter((c) => c.type === "expense").length})
                </span>
                <Badge variant="danger">Expenses</Badge>
              </div>

              <div className="space-y-2">
                {categories
                  .filter((c) => c.type === "expense")
                  .map((cat) => (
                    <div
                      key={cat.id}
                      className="p-3 bg-[var(--surface-muted)] rounded-md border border-[var(--border)] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: cat.color || "#0284C7" }}
                        />
                        <span className="text-sm font-medium text-[var(--text)]">{cat.name}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <IconButton
                          variant="ghost"
                          size="sm"
                          ariaLabel="Edit category"
                          icon={<Icons.Edit size={14} />}
                          onClick={() => openEditCategory(cat)}
                        />
                        <IconButton
                          variant="danger"
                          size="sm"
                          ariaLabel="Delete category"
                          icon={<Icons.Delete size={14} />}
                          onClick={() => setCatToDelete(cat.id)}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Income Categories */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Income Categories ({categories.filter((c) => c.type === "income").length})
                </span>
                <Badge variant="success">Income</Badge>
              </div>

              <div className="space-y-2">
                {categories
                  .filter((c) => c.type === "income")
                  .map((cat) => (
                    <div
                      key={cat.id}
                      className="p-3 bg-[var(--surface-muted)] rounded-md border border-[var(--border)] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: cat.color || "#059669" }}
                        />
                        <span className="text-sm font-medium text-[var(--text)]">{cat.name}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <IconButton
                          variant="ghost"
                          size="sm"
                          ariaLabel="Edit category"
                          icon={<Icons.Edit size={14} />}
                          onClick={() => openEditCategory(cat)}
                        />
                        <IconButton
                          variant="danger"
                          size="sm"
                          ariaLabel="Delete category"
                          icon={<Icons.Delete size={14} />}
                          onClick={() => setCatToDelete(cat.id)}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modal: Category Form */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={editingCategoryId ? "Edit Category" : "Add New Category"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <Input
            label="Category Name"
            type="text"
            required
            value={categoryForm.name}
            onChange={(e) =>
              setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g. Groceries, Freelance, Fuel"
          />

          <Select
            label="Category Type"
            value={categoryForm.type}
            onChange={(e) =>
              setCategoryForm((prev) => ({
                ...prev,
                type: e.target.value as "income" | "expense",
              }))
            }
            options={[
              { label: "Expense", value: "expense" },
              { label: "Income", value: "income" },
            ]}
          />

          <div>
            <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">
              Category Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={categoryForm.color}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, color: e.target.value }))
                }
                className="w-10 h-10 rounded-md border border-[var(--border)] cursor-pointer p-0.5 bg-transparent"
              />
              <Input
                type="text"
                value={categoryForm.color}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, color: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowCategoryModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
            >
              {editingCategoryId ? "Save Changes" : "Add Category"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Category */}
      <ConfirmDialog
        isOpen={!!catToDelete}
        onClose={() => setCatToDelete(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message="Are you sure you want to delete this category? Any transactions currently tagged with it will remain intact but become Uncategorized."
        confirmText="Delete Category"
      />
    </div>
  );
}
