/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { format } from "date-fns";
// import {
//   TrendingUp,
//   TrendingDown,
//   DollarSign,
//   Calendar,
//   User,
//   BarChart3,
// } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  date: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense";
}

interface TransactionsPDFReportProps {
  transactions: Transaction[];
  categories: Category[];
  user: any;
  dateRange?: {
    start: string;
    end: string;
  };
}

const TransactionsPDFReport: React.FC<TransactionsPDFReportProps> = ({
  transactions,
  categories,
  user,
  dateRange,
}) => {
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Unknown Category";
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.icon : "💰";
  };

  // Calculate statistics
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const netBalance = totalIncome - totalExpenses;

  // Group transactions by category
  const expensesByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      const categoryName = getCategoryName(t.category_id);
      acc[categoryName] =
        (acc[categoryName] || 0) + parseFloat(t.amount.toString());
      return acc;
    }, {} as Record<string, number>);

  const incomeByCategory = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => {
      const categoryName = getCategoryName(t.category_id);
      acc[categoryName] =
        (acc[categoryName] || 0) + parseFloat(t.amount.toString());
      return acc;
    }, {} as Record<string, number>);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const reportDate = format(new Date(), "MMMM dd, yyyy, hh:mm:ss a");
  const reportPeriod = dateRange
    ? `${format(
        new Date(dateRange.start),
        "MMM dd, yyyy, hh:mm:ss a"
      )} - ${format(new Date(dateRange.end), "MMM dd, yyyy, hh:mm:ss a")}`
    : "All Time";

  return (
    <div
      className="bg-sky p-4 min-h-screen"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* Header */}
      <div className="border-b-2 border-primary-600 pb-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-600 mb-2">
              Fintica
            </h1>
            <h2 className="text-xl font-semibold text-neutral-800">
              Financial Report
            </h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-500">Generated on</p>
            <p className="text-lg font-semibold text-neutral-800">
              {reportDate}
            </p>
          </div>
        </div>
      </div>

      {/* User Info & Report Period */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="p-4 rounded-lg">
          <div className="flex items-center mb-2">
            {/* <User className="text-primary-600 mr-2" size={20} /> */}

            <h3 className="font-semibold text-neutral-800 leading-none">
              <span className="block">Account Holder</span>
            </h3>
          </div>
          <p className="text-neutral-700">{user?.full_name || "User"}</p>
          <p className="text-sm text-neutral-500">{user?.email}</p>
        </div>
        <div className="bg-neutral-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            {/* <Calendar className="text-primary-600 mr-2" size={20} /> */}
            <h3 className="font-semibold text-neutral-800">Report Period</h3>
          </div>
          <p className="text-neutral-700">{reportPeriod}</p>
          <p className="text-sm text-neutral-500">
            {transactions.length} transactions
          </p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          {/* <BarChart3 className="text-primary-600 mr-2" size={24} /> */}
          <h3 className="text-xl font-bold text-neutral-800">
            Financial Summary
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-success-50 border border-success-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-success-700">
                  Total Income
                </p>
                <p className="text-2xl font-bold text-success-800">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              {/* <TrendingUp className="text-success-600" size={32} /> */}
            </div>
          </div>
          <div className="bg-danger-50 border border-danger-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-danger-700">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-danger-800">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              {/* <TrendingDown className="text-danger-600" size={32} /> */}
            </div>
          </div>
          <div
            className={`${
              netBalance >= 0
                ? "bg-primary-50 border-primary-200"
                : "bg-danger-50 border-danger-200"
            } border p-4 rounded-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    netBalance >= 0 ? "text-primary-700" : "text-danger-700"
                  }`}
                >
                  Net Balance
                </p>
                <p
                  className={`text-2xl font-bold ${
                    netBalance >= 0 ? "text-primary-800" : "text-danger-800"
                  }`}
                >
                  {formatCurrency(netBalance)}
                </p>
              </div>
              {/* <DollarSign
                className={
                  netBalance >= 0 ? "text-primary-600" : "text-danger-600"
                }
                size={32}
              /> */}
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Income by Category */}
        <div>
          <h3 className="text-lg font-bold text-neutral-800 mb-4">
            Income by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(incomeByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 bg-success-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-2">💰</span>
                    <span className="font-medium text-neutral-800">
                      {category}
                    </span>
                  </div>
                  <span className="font-bold text-success-700">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            {Object.keys(incomeByCategory).length === 0 && (
              <p className="text-neutral-500 italic">No income transactions</p>
            )}
          </div>
        </div>

        {/* Expenses by Category */}
        <div>
          <h3 className="text-lg font-bold text-neutral-800 mb-4">
            Expenses by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(expensesByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 bg-danger-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-2">💸</span>
                    <span className="font-medium text-neutral-800">
                      {category}
                    </span>
                  </div>
                  <span className="font-bold text-danger-700">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            {Object.keys(expensesByCategory).length === 0 && (
              <p className="text-neutral-500 italic">No expense transactions</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div
        style={{ pageBreakBefore: "always", breakBefore: "page" }}
        className="mb-8 break-before-page print:break-before-page"
      >
        <h3 className="text-lg font-bold text-neutral-800 mb-4">
          Transactions
        </h3>

        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-neutral-600 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-right px-4 py-3">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200 bg-white">
              {transactions
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((transaction, index) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-neutral-700 whitespace-nowrap">
                      {format(new Date(transaction.date), "MMM dd, yyyy")}
                    </td>

                    <td className="px-4 py-3 font-medium text-neutral-800">
                      {transaction.description}
                    </td>

                    <td className="px-4 py-3 text-neutral-600">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(transaction.category_id)}
                        {getCategoryName(transaction.category_id)}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
                    ${
                      transaction.type === "income"
                        ? " text-green-700"
                        : " text-red-700"
                    }`}
                      >
                        {transaction.type === "income"
                          ? "↗ Income"
                          : "↘ Expense"}
                      </span>
                    </td>

                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        transaction.type === "income"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(
                        parseFloat(transaction.amount.toString())
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {transactions.length > 0 && (
          <p className="text-sm text-neutral-500 mt-2 text-center">
            Showing {transactions.length} transaction
            {transactions.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-200 pt-6 mt-8 bottom-0">
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <p>Generated by Fintica - Smart Personal Finance Manager</p>
          <p>
            Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
          </p>
        </div>
        <div className="mt-2 text-xs text-neutral-400">
          <p>
            This report contains confidential financial information. Please
            handle with care.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPDFReport;
