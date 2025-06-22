/* eslint-disable no-case-declarations */
import { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { useTransactions } from "../contexts/TransactionsContext";
import { useCategories } from "../contexts/CategoriesContext";
import { useAuth } from "../contexts/AuthContext";
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
  Trash2,
  Plus,
} from "lucide-react";
import StepByStepTransaction from "../components/transactions/StepByStepTransaction";
import FloatingAddButton from "../components/transactions/FloatingAddButton";

type SortField = "date" | "amount" | "category";
type SortOrder = "asc" | "desc";

function Transactions() {
  const { user } = useAuth();
  const { transactions, deleteTransaction } = useTransactions();
  const { categories, getCategoryById } = useCategories();

  // State for transaction modal
  const [showAddModal, setShowAddModal] = useState(false);

  // State for filters and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

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

  // excel shhet
  const exportToExcel = () => {
    // Format main transaction data
    const cleanedData = filteredTransactions.map((txn) => ({
      Date: txn.created_at,
      Description: txn.description,
      Category: getCategoryName(txn.category_id),
      Type: txn.type,
      Amount: txn.amount,
    }));

    // Calculate totals
    const totalIncome = filteredTransactions
      .filter((txn) => txn.type === "income")
      .reduce((sum, txn) => sum + txn.amount, 0);

    const totalExpense = filteredTransactions
      .filter((txn) => txn.type === "expense")
      .reduce((sum, txn) => sum + txn.amount, 0);

    const netBalance = totalIncome - totalExpense;

    // Optional: add budget logic here if you have it
    const budget = 0; // Replace with real value if available

    // Append an empty row and totals row
    cleanedData.push(
      {}, // Empty row
      {
        Description: "Total Income",
        Amount: totalIncome,
      },
      {
        Description: "Total Expense",
        Amount: totalExpense,
      },
      {
        Description: "Net Balance",
        Amount: netBalance,
      },
      {
        Description: "Remaining Budget",
        Amount: budget - totalExpense,
      }
    );

    // Create and save workbook
    const worksheet = XLSX.utils.json_to_sheet(cleanedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "transactions_with_totals.xlsx");
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
          <p className="text-gray-600 mt-1">
            {sortedTransactions.length} transaction
            {sortedTransactions.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Add Transaction
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 animate-fade-in">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <ArrowUp size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Income</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(
                  filteredTransactions
                    .filter((t) => t.type === "income")
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div
          className="card p-4 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <ArrowDown size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-lg font-semibold text-red-600">
                {formatCurrency(
                  filteredTransactions
                    .filter((t) => t.type === "expense")
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div
          className="card p-4 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <CreditCard size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Net Balance</p>
              <p
                className={`text-lg font-semibold ${
                  filteredTransactions
                    .filter((t) => t.type === "income")
                    .reduce((sum, t) => sum + t.amount, 0) -
                    filteredTransactions
                      .filter((t) => t.type === "expense")
                      .reduce((sum, t) => sum + t.amount, 0) >=
                  0
                    ? "text-green-600"
                    : "text-red-600"
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
      <div className="card p-4 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search transactions..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag size={18} className="text-gray-400" />
            </div>
            <select
              className="select-field pl-10 appearance-none"
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
              <ArrowDown size={16} className="text-gray-400" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={18} className="text-gray-400" />
            </div>
            <select
              className="select-field pl-10 appearance-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ArrowDown size={16} className="text-gray-400" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={18} className="text-gray-400" />
            </div>
            <select
              className="select-field pl-10 appearance-none"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="">All Time</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="last-3-months">Last 3 Months</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ArrowDown size={16} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Export to excell button */}

      <button
        onClick={exportToExcel}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-2 text-white shadow-md transition hover:bg-green-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M19 20H5V4h7V2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9h-2v9z" />
          <path d="M17 13l-5-5-5 5h3v4h4v-4h3z" />
        </svg>
        Export to Excel
      </button>

      {/* Transactions List */}
      <div className="card overflow-hidden animate-slide-up">
        {sortedTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <CreditCard size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No transactions found
            </h3>
            <p className="text-gray-500 mb-6">
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
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                    className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTransactions.map((transaction) => {
                  const category = getCategoryById(
                    transaction.category_id || ""
                  );
                  return (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white font-bold"
                            style={{
                              backgroundColor: category?.color || "#6B7280",
                            }}
                          >
                            {transaction.description.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.description}
                            </div>
                            <div
                              className={`text-xs ${
                                transaction.type === "income"
                                  ? "text-green-600"
                                  : "text-red-600"
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(
                          parseISO(transaction.created_at),
                          "MMM d, yyyy,h:mm a"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span
                          className={`text-sm font-semibold ${
                            transaction.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() =>
                              handleDeleteTransaction(transaction.id)
                            }
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 size={16} />
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
