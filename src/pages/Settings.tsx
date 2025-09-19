/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useCategories } from "../contexts/CategoriesContext";
import {
  User,
  Shield,
  Edit2,
  Trash2,
  Save,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
// import { toast } from "react-hot-toast";

function Settings() {
  const { user, updateProfile } = useAuth();
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

  const [newPassword, setNewPassword] = useState("");
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);
  const [passwordUpdateError, setPasswordUpdateError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordChange = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setPasswordUpdateSuccess(false);
    setPasswordUpdateError("");

    if (newPassword.length < 6) {
      setPasswordUpdateError("Password must be at least 6 characters long.");
      return;
    }

    setIsPasswordUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsPasswordUpdating(false);

    if (error) {
      setPasswordUpdateError(error.message);
    } else {
      setPasswordUpdateSuccess(true);
      setNewPassword("");
    }
  };

  // // State for notifications settings
  // const [notificationSettings, setNotificationSettings] = useState({
  //   emailNotifications: true,
  //   budgetAlerts: true,
  //   weeklyReports: true,
  //   savingsTips: true,
  // });

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

  // // Handle notification toggle
  // const handleNotificationToggle = (
  //   setting: keyof typeof notificationSettings
  // ) => {
  //   setNotificationSettings((prev) => ({
  //     ...prev,
  //     [setting]: !prev[setting],
  //   }));
  // };

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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Profile Settings
              </h2>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="btn-outline flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition duration-200"
                >
                  <Edit2 size={16} className="mr-1" />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mb-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg flex items-center animate-fade-in">
                <Check size={16} className="mr-2" />
                Profile updated successfully!
              </div>
            )}

            <div className="card p-6 mb-6 shadow-lg rounded-lg bg-white dark:bg-gray-800">
              <form onSubmit={handleProfileSubmit}>
                <div className="flex flex-col md:flex-row items-start">
                  <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-3xl mb-4 md:mb-0 md:mr-6">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="form-label text-gray-700 dark:text-gray-200"
                        >
                          Full Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          className="input-field border border-gray-300 dark:border-gray-600 rounded-md p-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={profileData.name}
                          onChange={handleProfileInputChange}
                          disabled={!isEditingProfile}
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="form-label text-gray-700 dark:text-gray-200"
                        >
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          className="input-field bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 w-full text-gray-900 dark:text-gray-100"
                          value={user?.email}
                          disabled
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Email cannot be changed
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="timezone"
                          className="form-label text-gray-700 dark:text-gray-200"
                        >
                          Timezone
                        </label>
                        <select
                          id="timezone"
                          name="timezone"
                          className="select-field border border-gray-300 dark:border-gray-600 rounded-md p-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <label
                          htmlFor="currency"
                          className="form-label text-gray-700 dark:text-gray-200"
                        >
                          Default Currency
                        </label>
                        <select
                          id="currency"
                          name="currency"
                          className="select-field border border-gray-300 dark:border-gray-600 rounded-md p-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <div className="mt-6 flex justify-end space-x-4">
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
                          className="btn-outline text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition duration-200"
                          disabled={isSavingProfile}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary flex items-center bg-blue-600 dark:bg-blue-700 text-white rounded-md px-4 py-2 hover:bg-blue-700 dark:hover:bg-blue-800 transition duration-200"
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

            {/* Update Password */}
            <div className="card p-6 mb-6 shadow-lg rounded-lg bg-white dark:bg-gray-800">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4">
                Change Password
              </h3>

              <form onSubmit={handlePasswordChange}>
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    New Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-500 dark:text-gray-300"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {passwordUpdateError && (
                  <p className="text-red-600 dark:text-red-400 text-sm mb-2">
                    {passwordUpdateError}
                  </p>
                )}
                {passwordUpdateSuccess && (
                  <p className="text-green-600 dark:text-green-400 text-sm mb-2">
                    Password updated successfully!
                  </p>
                )}

                <button
                  type="submit"
                  className={`w-full py-2 px-4 rounded-md text-white font-medium transition ${
                    isPasswordUpdating
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800"
                  }`}
                  disabled={isPasswordUpdating}
                >
                  {isPasswordUpdating ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>

            {/* Currency Preview */}
            <div className="card p-6 mb-6 shadow-lg rounded-lg bg-white dark:bg-gray-800">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4">
                Currency Preview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Sample Amount
                  </p>
                  <p className="font-semibold text-lg">
                    {formatCurrency(1234.56)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Large Amount
                  </p>
                  <p className="font-semibold text-lg">
                    {formatCurrency(123456)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Small Amount
                  </p>
                  <p className="font-semibold text-lg">
                    {formatCurrency(12.34)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Zero Amount
                  </p>
                  <p className="font-semibold text-lg">{formatCurrency(0)}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "categories":
        return (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Category Management
              </h2>
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
                className="btn-primary px-4 py-2 rounded-md shadow hover:bg-primary-700 dark:hover:bg-primary-600 transition"
              >
                Add Category
              </button>
            </div>

            {/* Category form modal */}
            {showCategoryForm && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-lg animate-slide-up">
                  <h2 className="text-2xl font-semibold mb-5 text-gray-900 dark:text-gray-100">
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </h2>

                  <form onSubmit={handleCategorySubmit}>
                    <div className="space-y-5">
                      <div>
                        <label
                          htmlFor="name"
                          className="form-label font-medium text-gray-700 dark:text-gray-200"
                        >
                          Category Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          className="input-field mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="e.g., Groceries, Salary"
                          value={newCategory.name}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div>
                        <label className="form-label font-medium text-gray-700 dark:text-gray-200 mb-2 block">
                          Category Type
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <label
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                              newCategory.type === "expense"
                                ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                                : "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                            <span className="font-semibold text-lg">
                              💸 Expense
                            </span>
                          </label>

                          <label
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                              newCategory.type === "income"
                                ? "border-success-500 bg-success-50 text-success-700 dark:bg-success-900 dark:text-success-300"
                                : "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                            <span className="font-semibold text-lg">
                              💰 Income
                            </span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="color"
                          className="form-label font-medium text-gray-700 dark:text-gray-200 mb-2 block"
                        >
                          Category Color
                        </label>
                        <div className="flex items-center space-x-4">
                          <input
                            id="color"
                            name="color"
                            type="color"
                            className="h-12 w-12 rounded-md border border-gray-300 dark:border-gray-600 p-1 cursor-pointer"
                            value={newCategory.color}
                            onChange={handleInputChange}
                          />
                          <input
                            type="text"
                            className="input-field flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            value={newCategory.color}
                            onChange={handleInputChange}
                            name="color"
                            placeholder="#3B82F6"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-8 space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCategoryForm(false);
                          setEditingCategory(null);
                        }}
                        className="btn-outline px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary px-5 py-2 rounded-md shadow hover:bg-primary-700 dark:hover:bg-primary-600 transition"
                      >
                        {editingCategory ? "Update Category" : "Add Category"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Categories list */}
            <div className="space-y-10">
              {/* Income Categories */}
              <section>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">
                  Income Categories (
                  {categories.filter((cat) => cat.type === "income").length})
                </h3>
                <div className="grid gap-4">
                  {categories
                    .filter((cat) => cat.type === "income")
                    .map((category) => (
                      <div
                        key={category.id}
                        className="card p-4 flex items-center justify-between rounded-lg shadow-sm hover:shadow-md dark:bg-gray-700 transition-shadow"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                              {category.name}
                            </span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Income category
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            className="p-2 text-gray-500 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900 rounded-md transition-colors"
                            onClick={() => handleEditCategory(category)}
                            title="Edit category"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            className="p-2 text-gray-500 dark:text-gray-300 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-100 dark:hover:bg-danger-900 rounded-md transition-colors"
                            onClick={() => handleDeleteCategory(category.id)}
                            title="Delete category"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {categories.filter((cat) => cat.type === "income").length ===
                    0 && (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                      <p>No income categories yet.</p>
                      <button
                        onClick={() => {
                          setNewCategory((prev) => ({
                            ...prev,
                            type: "income",
                          }));
                          setShowCategoryForm(true);
                        }}
                        className="btn-outline mt-4 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        Add Income Category
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Expense Categories */}
              <section>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">
                  Expense Categories (
                  {categories.filter((cat) => cat.type === "expense").length})
                </h3>
                <div className="grid gap-4">
                  {categories
                    .filter((cat) => cat.type === "expense")
                    .map((category) => (
                      <div
                        key={category.id}
                        className="card p-4 flex items-center justify-between rounded-lg shadow-sm hover:shadow-md dark:bg-gray-700 transition-shadow"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                              {category.name}
                            </span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Expense category
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            className="p-2 text-gray-500 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900 rounded-md transition-colors"
                            onClick={() => handleEditCategory(category)}
                            title="Edit category"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            className="p-2 text-gray-500 dark:text-gray-300 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-100 dark:hover:bg-danger-900 rounded-md transition-colors"
                            onClick={() => handleDeleteCategory(category.id)}
                            title="Delete category"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {categories.filter((cat) => cat.type === "expense").length ===
                    0 && (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                      <p>No expense categories yet.</p>
                      <button
                        onClick={() => {
                          setNewCategory((prev) => ({
                            ...prev,
                            type: "expense",
                          }));
                          setShowCategoryForm(true);
                        }}
                        className="btn-outline mt-4 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        Add Expense Category
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your account and preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "profile", label: "Profile", icon: User },
          { key: "categories", label: "Categories", icon: Shield },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === key
                ? "bg-primary-100 text-primary-700 dark:bg-primary-700 dark:text-primary-100"
                : "bg-white border text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}

        {/* <button
    onClick={logout}
    className="ml-auto text-sm text-red-600 dark:text-red-400 hover:underline"
  >
    Logout
  </button> */}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-gray-700">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default Settings;
