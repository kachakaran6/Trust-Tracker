import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useCategories } from "../contexts/CategoriesContext";
import {
  User,
  Shield,
  Bell,
  HelpCircle,
  Edit2,
  Trash2,
  Save,
  Check,
} from "lucide-react";

function Settings() {
  const { user, logout, updateProfile } = useAuth();
  const { categories, addCategory, updateCategory, deleteCategory } =
    useCategories();

  // State for active tab
  const [activeTab, setActiveTab] = useState("profile");

  // State for profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    timezone: user?.timezone || "America/New_York",
    currency: user?.currency || "USD",
  });

  // State for new category
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    color: "#3B82F6",
    icon: "Tag",
  });

  // State for notifications settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    budgetAlerts: true,
    weeklyReports: true,
    savingsTips: true,
  });

  // State for success message
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Handle profile form submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      await updateProfile({
        name: profileData.name,
        currency: profileData.currency,
        timezone: profileData.timezone,
      });

      setIsEditingProfile(false);
      setShowSuccessMessage(true);

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle category form submission
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        // Update existing category
        await updateCategory(editingCategory, newCategory);
        setEditingCategory(null);
      } else {
        // Add new category
        await addCategory(newCategory);
      }

      // Reset form
      setNewCategory({
        name: "",
        type: "expense",
        color: "#3B82F6",
        icon: "Tag",
      });

      setShowCategoryForm(false);
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Failed to save category. Please try again.");
    }
  };

  // Handle edit category
  const handleEditCategory = (category: any) => {
    setNewCategory({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
    });
    setEditingCategory(category.id);
    setShowCategoryForm(true);
  };

  // Handle delete category
  const handleDeleteCategory = async (categoryId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this category? This action cannot be undone."
      )
    ) {
      try {
        await deleteCategory(categoryId);
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("Failed to delete category. Please try again.");
      }
    }
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewCategory((prev) => ({ ...prev, [name]: value }));
  };

  // Handle profile input changes
  const handleProfileInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle notification toggle
  const handleNotificationToggle = (
    setting: keyof typeof notificationSettings
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  // Format currency display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: user?.currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Profile Settings</h2>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="btn-outline flex items-center"
                >
                  <Edit2 size={16} className="mr-1" />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mb-4 bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg flex items-center animate-fade-in">
                <Check size={16} className="mr-2" />
                Profile updated successfully!
              </div>
            )}

            <div className="card p-6 mb-6">
              <form onSubmit={handleProfileSubmit}>
                <div className="flex flex-col md:flex-row items-start">
                  <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl mb-4 md:mb-0 md:mr-6">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="form-label">
                          Full Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          className="input-field"
                          value={profileData.name}
                          onChange={handleProfileInputChange}
                          disabled={!isEditingProfile}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="form-label">
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          className="input-field bg-gray-50"
                          value={user?.email}
                          disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Email cannot be changed
                        </p>
                      </div>
                      <div>
                        <label htmlFor="timezone" className="form-label">
                          Timezone
                        </label>
                        <select
                          id="timezone"
                          name="timezone"
                          className="select-field"
                          value={profileData.timezone}
                          onChange={handleProfileInputChange}
                          disabled={!isEditingProfile}
                        >
                          <option value="America/New_York">
                            Eastern Time (ET)
                          </option>
                          <option value="America/Chicago">
                            Central Time (CT)
                          </option>
                          <option value="America/Denver">
                            Mountain Time (MT)
                          </option>
                          <option value="America/Los_Angeles">
                            Pacific Time (PT)
                          </option>
                          <option value="Europe/London">London (GMT)</option>
                          <option value="Europe/Paris">Paris (CET)</option>
                          <option value="Asia/Tokyo">Tokyo (JST)</option>
                          <option value="Asia/Shanghai">Shanghai (CST)</option>
                          <option value="Australia/Sydney">
                            Sydney (AEST)
                          </option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="currency" className="form-label">
                          Default Currency
                        </label>
                        <select
                          id="currency"
                          name="currency"
                          className="select-field"
                          value={profileData.currency}
                          onChange={handleProfileInputChange}
                          disabled={!isEditingProfile}
                        >
                          <option value="USD">US Dollar ($)</option>
                          <option value="EUR">Euro (€)</option>
                          <option value="GBP">British Pound (£)</option>
                          <option value="JPY">Japanese Yen (¥)</option>
                          <option value="CAD">Canadian Dollar (C$)</option>
                          <option value="AUD">Australian Dollar (A$)</option>
                          <option value="CHF">Swiss Franc (CHF)</option>
                          <option value="CNY">Chinese Yuan (¥)</option>
                          <option value="INR">Indian Rupee (₹)</option>
                          <option value="KRW">South Korean Won (₩)</option>
                          <option value="BRL">Brazilian Real (R$)</option>
                          <option value="MXN">Mexican Peso ($)</option>
                        </select>
                      </div>
                    </div>

                    {isEditingProfile && (
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileData({
                              name: user?.name || "",
                              timezone: user?.timezone || "America/New_York",
                              currency: user?.currency || "USD",
                            });
                          }}
                          className="btn-outline"
                          disabled={isSavingProfile}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary flex items-center"
                          disabled={isSavingProfile}
                        >
                          {isSavingProfile ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={16} className="mr-1" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Currency Preview */}
            <div className="card p-6 mb-6">
              <h3 className="font-semibold mb-3">Currency Preview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Sample Amount</p>
                  <p className="font-semibold text-lg">
                    {formatCurrency(1234.56)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Large Amount</p>
                  <p className="font-semibold text-lg">
                    {formatCurrency(123456)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Small Amount</p>
                  <p className="font-semibold text-lg">
                    {formatCurrency(12.34)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Zero Amount</p>
                  <p className="font-semibold text-lg">{formatCurrency(0)}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-danger-600 mb-4">
                Danger Zone
              </h3>
              <div className="border border-danger-200 rounded-lg p-4 bg-danger-50">
                <h4 className="font-medium text-danger-800 mb-2">
                  Delete Account
                </h4>
                <p className="text-sm text-danger-700 mb-4">
                  Once you delete your account, there is no going back. This
                  action cannot be undone and will permanently delete all your
                  financial data.
                </p>
                <button
                  className="btn-danger"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you absolutely sure you want to delete your account? This action cannot be undone."
                      )
                    ) {
                      console.log("Account deletion requested");
                    }
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        );

      case "categories":
        return (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Category Management</h2>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setNewCategory({
                    name: "",
                    type: "expense",
                    color: "#3B82F6",
                    icon: "Tag",
                  });
                  setShowCategoryForm(true);
                }}
                className="btn-primary"
              >
                Add Category
              </button>
            </div>

            {/* Category form modal */}
            {showCategoryForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full p-6 animate-slide-up">
                  <h2 className="text-xl font-semibold mb-4">
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </h2>

                  <form onSubmit={handleCategorySubmit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="form-label">
                          Category Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          className="input-field"
                          placeholder="e.g., Groceries, Salary"
                          value={newCategory.name}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div>
                        <label className="form-label">Category Type</label>
                        <div className="grid grid-cols-2 gap-4">
                          <label
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                              newCategory.type === "expense"
                                ? "border-primary-500 bg-primary-50 text-primary-700"
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="type"
                              value="expense"
                              checked={newCategory.type === "expense"}
                              onChange={handleInputChange}
                              className="sr-only"
                            />
                            <span className="font-medium">💸 Expense</span>
                          </label>

                          <label
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                              newCategory.type === "income"
                                ? "border-success-500 bg-success-50 text-success-700"
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="type"
                              value="income"
                              checked={newCategory.type === "income"}
                              onChange={handleInputChange}
                              className="sr-only"
                            />
                            <span className="font-medium">💰 Income</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="color" className="form-label">
                          Category Color
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            id="color"
                            name="color"
                            type="color"
                            className="h-12 w-12 rounded-lg border border-gray-300 p-1 cursor-pointer"
                            value={newCategory.color}
                            onChange={handleInputChange}
                          />
                          <div className="flex-1">
                            <input
                              type="text"
                              className="input-field"
                              value={newCategory.color}
                              onChange={handleInputChange}
                              name="color"
                              placeholder="#3B82F6"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6 space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCategoryForm(false);
                          setEditingCategory(null);
                        }}
                        className="btn-outline"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        {editingCategory ? "Update Category" : "Add Category"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Categories list */}
            <div className="space-y-6">
              {/* Income Categories */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Income Categories (
                  {categories.filter((cat) => cat.type === "income").length})
                </h3>
                <div className="grid gap-3">
                  {categories
                    .filter((cat) => cat.type === "income")
                    .map((category) => (
                      <div
                        key={category.id}
                        className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white font-bold"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">
                              {category.name}
                            </span>
                            <p className="text-sm text-gray-500">
                              Income category
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            onClick={() => handleEditCategory(category)}
                            title="Edit category"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="p-2 text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                            onClick={() => handleDeleteCategory(category.id)}
                            title="Delete category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {categories.filter((cat) => cat.type === "income").length ===
                    0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No income categories yet.</p>
                      <button
                        onClick={() => {
                          setNewCategory((prev) => ({
                            ...prev,
                            type: "income",
                          }));
                          setShowCategoryForm(true);
                        }}
                        className="btn-outline mt-2"
                      >
                        Add Income Category
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Expense Categories */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Expense Categories (
                  {categories.filter((cat) => cat.type === "expense").length})
                </h3>
                <div className="grid gap-3">
                  {categories
                    .filter((cat) => cat.type === "expense")
                    .map((category) => (
                      <div
                        key={category.id}
                        className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white font-bold"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">
                              {category.name}
                            </span>
                            <p className="text-sm text-gray-500">
                              Expense category
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            onClick={() => handleEditCategory(category)}
                            title="Edit category"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="p-2 text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                            onClick={() => handleDeleteCategory(category.id)}
                            title="Delete category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {categories.filter((cat) => cat.type === "expense").length ===
                    0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No expense categories yet.</p>
                      <button
                        onClick={() => {
                          setNewCategory((prev) => ({
                            ...prev,
                            type: "expense",
                          }));
                          setShowCategoryForm(true);
                        }}
                        className="btn-outline mt-2"
                      >
                        Add Expense Category
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">
              Notification Preferences
            </h2>

            <div className="card p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      Email Notifications
                    </h3>
                    <p className="text-sm text-gray-500">
                      Receive important alerts and updates via email
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      type="button"
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        notificationSettings.emailNotifications
                          ? "bg-primary-600"
                          : "bg-gray-200"
                      }`}
                      onClick={() =>
                        handleNotificationToggle("emailNotifications")
                      }
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notificationSettings.emailNotifications
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Budget Alerts</h3>
                    <p className="text-sm text-gray-500">
                      Get notified when you're approaching or exceeding budget
                      limits
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      type="button"
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        notificationSettings.budgetAlerts
                          ? "bg-primary-600"
                          : "bg-gray-200"
                      }`}
                      onClick={() => handleNotificationToggle("budgetAlerts")}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notificationSettings.budgetAlerts
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      Weekly Reports
                    </h3>
                    <p className="text-sm text-gray-500">
                      Receive a summary of your financial activity each week
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      type="button"
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        notificationSettings.weeklyReports
                          ? "bg-primary-600"
                          : "bg-gray-200"
                      }`}
                      onClick={() => handleNotificationToggle("weeklyReports")}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notificationSettings.weeklyReports
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      Savings Tips & Insights
                    </h3>
                    <p className="text-sm text-gray-500">
                      Get personalized recommendations for saving money and
                      improving your finances
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      type="button"
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        notificationSettings.savingsTips
                          ? "bg-primary-600"
                          : "bg-gray-200"
                      }`}
                      onClick={() => handleNotificationToggle("savingsTips")}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notificationSettings.savingsTips
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  className="btn-primary"
                  onClick={() => {
                    console.log(
                      "Saving notification preferences:",
                      notificationSettings
                    );
                    alert("Notification preferences saved!");
                  }}
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        );

      case "help":
        return (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">Help & Support</h2>

            <div className="card p-6 mb-6">
              <h3 className="font-medium mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <details className="group">
                  <summary className="flex items-center justify-between w-full text-left font-medium py-2 cursor-pointer focus:outline-none">
                    <span>How does the AI prediction feature work?</span>
                    <span className="ml-6 h-7 flex items-center group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <div className="mt-2 text-sm text-gray-600 pl-4 border-l-2 border-primary-100">
                    <p>
                      Our AI-powered prediction feature analyzes your historical
                      spending patterns using machine learning algorithms to
                      forecast future expenses. The system considers factors
                      like seasonal trends, recurring payments, and spending
                      habits to provide increasingly accurate predictions as it
                      learns from your financial behavior over time.
                    </p>
                  </div>
                </details>

                <details className="group border-t border-gray-200 pt-4">
                  <summary className="flex items-center justify-between w-full text-left font-medium py-2 cursor-pointer focus:outline-none">
                    <span>Is my financial data secure and private?</span>
                    <span className="ml-6 h-7 flex items-center group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <div className="mt-2 text-sm text-gray-600 pl-4 border-l-2 border-primary-100">
                    <p>
                      Yes, your financial data is protected with bank-level
                      security. We use end-to-end encryption, secure cloud
                      storage, and never share your personal financial
                      information with third parties. All data is stored in
                      compliance with financial privacy regulations.
                    </p>
                  </div>
                </details>

                <details className="group border-t border-gray-200 pt-4">
                  <summary className="flex items-center justify-between w-full text-left font-medium py-2 cursor-pointer focus:outline-none">
                    <span>How do I export my financial data?</span>
                    <span className="ml-6 h-7 flex items-center group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <div className="mt-2 text-sm text-gray-600 pl-4 border-l-2 border-primary-100">
                    <p>
                      You can export your data from the Settings page. We
                      support CSV and PDF formats for transactions, budgets, and
                      reports. This feature is useful for tax preparation or
                      switching to another financial management tool.
                    </p>
                  </div>
                </details>

                <details className="group border-t border-gray-200 pt-4">
                  <summary className="flex items-center justify-between w-full text-left font-medium py-2 cursor-pointer focus:outline-none">
                    <span>
                      Can I connect my bank account for automatic transaction
                      import?
                    </span>
                    <span className="ml-6 h-7 flex items-center group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <div className="mt-2 text-sm text-gray-600 pl-4 border-l-2 border-primary-100">
                    <p>
                      Bank account integration is coming soon! Currently, you
                      can manually add transactions or import them via CSV.
                      We're working on secure bank connections to automatically
                      sync your transactions while maintaining the highest
                      security standards.
                    </p>
                  </div>
                </details>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-medium mb-3">Contact Support</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Need help with something not covered in the FAQs? Our support
                  team is ready to assist you.
                </p>
                <div className="space-y-2">
                  <a
                    href="mailto:support@finsight.com"
                    className="btn-primary inline-block w-full text-center"
                  >
                    Email Support
                  </a>
                  <p className="text-xs text-gray-500 text-center">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-medium mb-3">Resources</h3>
                <div className="space-y-3">
                  <a
                    href="#"
                    className="block text-sm text-primary-600 hover:text-primary-700"
                  >
                    📚 User Guide & Tutorials
                  </a>
                  <a
                    href="#"
                    className="block text-sm text-primary-600 hover:text-primary-700"
                  >
                    🎥 Video Walkthroughs
                  </a>
                  <a
                    href="#"
                    className="block text-sm text-primary-600 hover:text-primary-700"
                  >
                    💡 Financial Tips & Best Practices
                  </a>
                  <a
                    href="#"
                    className="block text-sm text-primary-600 hover:text-primary-700"
                  >
                    🔄 What's New & Updates
                  </a>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500">
          Manage your account and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar navigation */}
        <div className="w-full lg:w-64 card p-4">
          <nav>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === "profile"
                      ? "bg-primary-50 text-primary-700 border border-primary-200"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <User size={18} className="mr-3" />
                  Profile Settings
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("categories")}
                  className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === "categories"
                      ? "bg-primary-50 text-primary-700 border border-primary-200"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Shield size={18} className="mr-3" />
                  Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === "notifications"
                      ? "bg-primary-50 text-primary-700 border border-primary-200"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Bell size={18} className="mr-3" />
                  Notifications
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("help")}
                  className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === "help"
                      ? "bg-primary-50 text-primary-700 border border-primary-200"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <HelpCircle size={18} className="mr-3" />
                  Help & Support
                </button>
              </li>
              <li className="pt-4 border-t border-gray-200 mt-4">
                <button
                  onClick={logout}
                  className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg text-danger-600 hover:bg-danger-50 transition-colors duration-200"
                >
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Content area */}
        <div className="flex-1">{renderTabContent()}</div>
      </div>
    </div>
  );
}

export default Settings;
