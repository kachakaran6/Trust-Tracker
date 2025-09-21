/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-case-declarations */
import { useState, useRef, useEffect } from "react";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
// import { supabase } from "../lib/supabase";
import { usePDF } from "react-to-pdf";
import TransactionsPDFReport from "../components/TransactionsPDFReport";
import {
  exportTransactionsToExcel,
  exportSimpleTransactionsToExcel,
} from "../utils/excelExport";
import Button from "../components/ui/Button";

pdfMake.vfs = pdfFonts.vfs;

import { useTransactions } from "../contexts/TransactionsContext";
import { useCategories } from "../contexts/CategoriesContext";
import { useAuth } from "../contexts/AuthContext";
import { Transaction } from "../lib/supabase";
// import { User } from "../lib/supabase";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import {
  Filter,
  Search,
  CreditCard,
  Calendar,
  Tag,
  ArrowDown,
  ArrowUp,
  Trash,
  // Plus,
  Pencil,
  FileText,
  Download,
} from "lucide-react";
import StepByStepTransaction from "../components/transactions/StepByStepTransaction";
import FloatingAddButton from "../components/transactions/FloatingAddButton";

type SortField = "date" | "amount" | "category";
type SortOrder = "asc" | "desc";

function Transactions() {
  const { user } = useAuth();
  const { transactions, deleteTransaction, updateTransaction } =
    useTransactions();
  const { categories, getCategoryById } = useCategories();

  // State for transaction modal
  const [showAddModal, setShowAddModal] = useState(false);

  //  Edit transaction modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [transactionToEdit, setTransactionToEdit] =
    useState<Transaction | null>(null);

  // State for filters and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("this-month"); //by default this-month datefilter is set
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Export
  // const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  const { toPDF, targetRef } = usePDF({
    filename: `financial-report-${format(new Date(), "yyyy-MM-dd")}.pdf`,
    page: {
      margin: 10,
      format: "A4",
    },
  });

  // Function to filter transactions
  const filterTransactions = () => {
    return transactions.filter((transaction) => {
      // Search term filter
      if (
        searchTerm &&
        !transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      if (categoryFilter && transaction.category_id !== categoryFilter) {
        return false;
      }

      // Type filter
      if (typeFilter && transaction.type !== typeFilter) {
        return false;
      }

      // Date filter
      if (dateFilter) {
        const date = parseISO(transaction.created_at);

        let filterStart, filterEnd;

        switch (dateFilter) {
          case "this-month":
            filterStart = startOfMonth(new Date());
            filterEnd = endOfMonth(new Date());
            break;
          case "last-month":
            filterStart = startOfMonth(subMonths(new Date(), 1));
            filterEnd = endOfMonth(subMonths(new Date(), 1));
            break;
          case "last-3-months":
            filterStart = startOfMonth(subMonths(new Date(), 2));
            filterEnd = endOfMonth(new Date());
            break;
          default:
            return true;
        }

        if (date < filterStart || date > filterEnd) {
          return false;
        }
      }

      return true;
    });
  };

  // Function to sort transactions
  const sortTransactions = (filteredTransactions: typeof transactions) => {
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "date":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "category":
          const categoryA = getCategoryById(a.category_id || "")?.name || "";
          const categoryB = getCategoryById(b.category_id || "")?.name || "";
          comparison = categoryA.localeCompare(categoryB);
          break;
        default:
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  // Get filtered and sorted transactions
  const filteredTransactions = filterTransactions();
  const sortedTransactions = sortTransactions(filteredTransactions);

  const filteredAndSortedTransactions = sortTransactions(filterTransactions());

  // Format currency using user's preferred currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: user?.currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Function to toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Function to get category name by ID
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Unknown";
    const category = getCategoryById(categoryId);
    return category ? category.name : "Unknown";
  };

  // Function to handle delete transaction
  const handleDeleteTransaction = async (transactionId: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(transactionId);
      } catch (error) {
        console.error("Error deleting transaction:", error);
        alert("Failed to delete transaction. Please try again.");
      }
    }
  };

  //  Function for edit
  const handleEditClick = (transaction: any) => {
    setTransactionToEdit(transaction);
    setShowEditModal(true);
  };

  // Add this with the others

  const handleSaveEdit = async (transactionToEdit: any) => {
    if (!transactionToEdit) return;

    try {
      await updateTransaction(transactionToEdit.id, {
        description: transactionToEdit.description,
        amount: transactionToEdit.amount,
        category_id: transactionToEdit.category_id,
        created_at: transactionToEdit.created_at,
        type: transactionToEdit.type,
      });

      setShowEditModal(false);
      setTransactionToEdit(null);
    } catch (err) {
      console.error("Failed to update transaction:", err);
      alert("Could not update transaction.");
    }
  };

  const handleExportPDF = () => {
    setShowPDFPreview(true);
    // Small delay to ensure the component is rendered before generating PDF
    setTimeout(() => {
      toPDF();
      setShowPDFPreview(false);
    }, 100);
    setShowMobileExport(false);
  };

  const handleExportExcel = () => {
    exportTransactionsToExcel({
      transactions: filteredAndSortedTransactions,
      categories,
      user,
      filename: `financial-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`,
    });
    setShowMobileExport(false);
  };

  const handleExportSimpleExcel = () => {
    exportSimpleTransactionsToExcel(
      filteredAndSortedTransactions,
      categories,
      `transactions-${format(new Date(), "yyyy-MM-dd")}.xlsx`
    );
    setShowMobileExport(false);
  };

  const [showMobileExport, setShowMobileExport] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMobileExport(false);
      }
    };

    if (showMobileExport) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMobileExport]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Transactions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {sortedTransactions.length} transaction
            {sortedTransactions.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Desktop export buttons */}
        <div className="hidden sm:flex gap-3">
          <Button
            variant="outline"
            icon={<FileText size={20} />}
            onClick={handleExportPDF}
            className="shadow-sm hover:shadow-md transition-all duration-200 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Export PDF
          </Button>

          <div className="relative group">
            <Button
              variant="outline"
              icon={<Download size={20} />}
              onClick={handleExportExcel}
              className="shadow-sm hover:shadow-md transition-all duration-200 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Export Excel
            </Button>

            {/* Dropdown for Excel options */}
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="p-2">
                <button
                  onClick={handleExportExcel}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-gray-200 hover:bg-neutral-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  📊 Detailed Report
                  <div className="text-xs text-neutral-500 dark:text-gray-400">
                    Multiple sheets with analysis
                  </div>
                </button>
                <button
                  onClick={handleExportSimpleExcel}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-gray-200 hover:bg-neutral-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  📋 Simple List
                  <div className="text-xs text-neutral-500 dark:text-gray-400">
                    Basic transaction list
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile export dropdown */}
        <div className="sm:hidden relative">
          <Button
            variant="outline"
            icon={<FileText size={20} />}
            onClick={() => setShowMobileExport(!showMobileExport)}
            className="shadow-sm hover:shadow-md transition-all duration-200 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            children={undefined}
          />

          {showMobileExport && (
            <div
              ref={dropdownRef}
              className="absolute right-4 top-[60px] w-52 bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-lg shadow-lg z-20"
            >
              <div className="p-1">
                <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-gray-200 hover:bg-neutral-100 dark:hover:bg-gray-700 rounded-md"
                >
                  📄 Export PDF
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-gray-200 hover:bg-neutral-100 dark:hover:bg-gray-700 rounded-md"
                >
                  📊 Export Excel (Detailed)
                </button>
                <button
                  onClick={handleExportSimpleExcel}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-gray-200 hover:bg-neutral-100 dark:hover:bg-gray-700 rounded-md"
                >
                  📋 Export Excel (Simple)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* </div> */}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Income */}
        <div className="card p-4 animate-fade-in bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
              <ArrowUp
                size={20}
                className="text-green-600 dark:text-green-400"
              />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Income
              </p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(
                  filteredTransactions
                    .filter((t) => t.type === "income")
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div
          className="card p-4 animate-fade-in bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mr-3">
              <ArrowDown size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Expenses
              </p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(
                  filteredTransactions
                    .filter((t) => t.type === "expense")
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Net Balance */}
        <div
          className="card p-4 animate-fade-in bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
              <CreditCard
                size={20}
                className="text-blue-600 dark:text-blue-400"
              />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Net Balance
              </p>
              <p
                className={`text-lg font-semibold ${
                  filteredTransactions
                    .filter((t) => t.type === "income")
                    .reduce((sum, t) => sum + t.amount, 0) -
                    filteredTransactions
                      .filter((t) => t.type === "expense")
                      .reduce((sum, t) => sum + t.amount, 0) >=
                  0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(
                  filteredTransactions
                    .filter((t) => t.type === "income")
                    .reduce((sum, t) => sum + t.amount, 0) -
                    filteredTransactions
                      .filter((t) => t.type === "expense")
                      .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-4 animate-fade-in bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400 dark:text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search transactions..."
              className="input-field pl-10 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag size={18} className="text-gray-400 dark:text-gray-400" />
            </div>
            <select
              className="select-field pl-10 appearance-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ArrowDown
                size={16}
                className="text-gray-400 dark:text-gray-400"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={18} className="text-gray-400 dark:text-gray-400" />
            </div>
            <select
              className="select-field pl-10 appearance-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ArrowDown
                size={16}
                className="text-gray-400 dark:text-gray-400"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar
                size={18}
                className="text-gray-400 dark:text-gray-400"
              />
            </div>
            <select
              className="select-field pl-10 appearance-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="">All Time</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="last-3-months">Last 3 Months</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ArrowDown
                size={16}
                className="text-gray-400 dark:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {showEditModal && transactionToEdit && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
              Edit Transaction
            </h2>

            <div className="space-y-5">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={transactionToEdit.description}
                  onChange={(e) =>
                    setTransactionToEdit({
                      ...transactionToEdit,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Grocery shopping"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={transactionToEdit.amount}
                  onChange={(e) =>
                    setTransactionToEdit({
                      ...transactionToEdit,
                      amount: parseFloat(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 150"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={transactionToEdit.category_id}
                  onChange={(e) =>
                    setTransactionToEdit({
                      ...transactionToEdit,
                      category_id: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={transactionToEdit.created_at.split("T")[0]}
                  onChange={(e) =>
                    setTransactionToEdit({
                      ...transactionToEdit,
                      created_at: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEdit(transactionToEdit)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="card overflow-hidden animate-slide-up bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        {sortedTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
              <CreditCard
                size={32}
                className="text-gray-400 dark:text-gray-300"
              />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No transactions found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || categoryFilter || typeFilter || dateFilter
                ? "Try adjusting your filters to see more transactions."
                : "Get started by adding your first transaction."}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Add Your First Transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => toggleSort("category")}
                  >
                    <div className="flex items-center">
                      Category
                      {sortField === "category" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => toggleSort("date")}
                  >
                    <div className="flex items-center">
                      Date & Time
                      {sortField === "date" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => toggleSort("amount")}
                  >
                    <div className="flex items-center justify-end">
                      Amount
                      {sortField === "amount" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedTransactions.map((transaction) => {
                  const category = getCategoryById(
                    transaction.category_id || ""
                  );
                  return (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white font-bold"
                            style={{
                              backgroundColor: category?.color || "#6B7280",
                            }}
                          >
                            {transaction.description
                              ? transaction.description.charAt(0).toUpperCase()
                              : transaction.category_id
                                  ?.charAt(0)
                                  .toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {transaction.description || "No Description..."}
                            </div>
                            <div
                              className={`text-xs ${
                                transaction.type === "income"
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {transaction.type === "income"
                                ? "Income"
                                : "Expense"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white"
                          style={{
                            backgroundColor: category?.color || "#6B7280",
                          }}
                        >
                          {getCategoryName(transaction.category_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(
                          parseISO(transaction.created_at),
                          "MMM d, yyyy,h:mm a"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span
                          className={`text-sm font-semibold ${
                            transaction.type === "income"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditClick(transaction)}
                            className="btn-sm btn-outline dark:text-gray-200 dark:hover:text-black dark:border-gray-400"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteTransaction(transaction.id)
                            }
                            className="btn-sm btn-danger"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPDFPreview && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div ref={targetRef}>
            <TransactionsPDFReport
              transactions={filteredAndSortedTransactions}
              categories={categories}
              user={user}
            />
          </div>
        </div>
      )}

      {/* Step-by-Step Transaction Modal */}
      <StepByStepTransaction
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Floating Add Button */}
      <FloatingAddButton onClick={() => setShowAddModal(true)} />
    </div>
  );
}

export default Transactions;
