/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format } from "date-fns";

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

interface ExcelExportOptions {
  transactions: Transaction[];
  categories: Category[];
  user: any;
  filename?: string;
}

export const exportTransactionsToExcel = ({
  transactions,
  categories,
  user,
  filename,
}: ExcelExportOptions) => {
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Unknown Category";
  };

  const getCategoryType = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.type : "unknown";
  };

  // Calculate statistics
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const netBalance = totalIncome - totalExpenses;

  // Prepare transaction data
  const transactionData = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((transaction, index) => ({
      "S.No": index + 1,
      Date: format(new Date(transaction.date), "dd/MM/yyyy"),
      Description: transaction.description,
      Category: getCategoryName(transaction.category_id),
      Type:
        transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
      "Amount (₹)": parseFloat(transaction.amount.toString()),
      "Running Balance (₹)": transactions
        .slice(0, index + 1)
        .reduce((sum, t) => {
          return (
            sum +
            (t.type === "income"
              ? parseFloat(t.amount.toString())
              : -parseFloat(t.amount.toString()))
          );
        }, 0),
    }));

  // Group transactions by category for summary
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

  // Prepare summary data
  const summaryData = [
    { Metric: "Total Income", "Amount (₹)": totalIncome },
    { Metric: "Total Expenses", "Amount (₹)": totalExpenses },
    { Metric: "Net Balance", "Amount (₹)": netBalance },
    { Metric: "", "Amount (₹)": "" }, // Empty row
    { Metric: "Total Transactions", "Amount (₹)": transactions.length },
    {
      Metric: "Income Transactions",
      "Amount (₹)": transactions.filter((t) => t.type === "income").length,
    },
    {
      Metric: "Expense Transactions",
      "Amount (₹)": transactions.filter((t) => t.type === "expense").length,
    },
  ];

  // Prepare income category breakdown
  const incomeCategoryData = Object.entries(incomeByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      Category: category,
      "Amount (₹)": amount,
      Percentage:
        totalIncome > 0
          ? ((amount / totalIncome) * 100).toFixed(2) + "%"
          : "0%",
    }));

  // Prepare expense category breakdown
  const expenseCategoryData = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      Category: category,
      "Amount (₹)": amount,
      Percentage:
        totalExpenses > 0
          ? ((amount / totalExpenses) * 100).toFixed(2) + "%"
          : "0%",
    }));

  // Prepare monthly breakdown
  const monthlyData = transactions.reduce((acc, t) => {
    const monthKey = format(new Date(t.date), "MMM yyyy");
    if (!acc[monthKey]) {
      acc[monthKey] = { income: 0, expense: 0 };
    }
    if (t.type === "income") {
      acc[monthKey].income += parseFloat(t.amount.toString());
    } else {
      acc[monthKey].expense += parseFloat(t.amount.toString());
    }
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  const monthlyBreakdown = Object.entries(monthlyData)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([month, data]) => ({
      Month: month,
      "Income (₹)": data.income,
      "Expenses (₹)": data.expense,
      "Net (₹)": data.income - data.expense,
    }));

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Add Summary sheet
  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);

  // Style the summary sheet
  summaryWorksheet["!cols"] = [{ width: 20 }, { width: 15 }];

  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");

  // Add Transactions sheet
  const transactionsWorksheet = XLSX.utils.json_to_sheet(transactionData);

  // Style the transactions sheet
  transactionsWorksheet["!cols"] = [
    { width: 8 }, // S.No
    { width: 12 }, // Date
    { width: 30 }, // Description
    { width: 20 }, // Category
    { width: 10 }, // Type
    { width: 15 }, // Amount
    { width: 18 }, // Running Balance
  ];

  XLSX.utils.book_append_sheet(workbook, transactionsWorksheet, "Transactions");

  // Add Income Categories sheet
  if (incomeCategoryData.length > 0) {
    const incomeWorksheet = XLSX.utils.json_to_sheet(incomeCategoryData);
    incomeWorksheet["!cols"] = [{ width: 25 }, { width: 15 }, { width: 12 }];
    XLSX.utils.book_append_sheet(
      workbook,
      incomeWorksheet,
      "Income by Category"
    );
  }

  // Add Expense Categories sheet
  if (expenseCategoryData.length > 0) {
    const expenseWorksheet = XLSX.utils.json_to_sheet(expenseCategoryData);
    expenseWorksheet["!cols"] = [{ width: 25 }, { width: 15 }, { width: 12 }];
    XLSX.utils.book_append_sheet(
      workbook,
      expenseWorksheet,
      "Expenses by Category"
    );
  }

  // Add Monthly Breakdown sheet
  if (monthlyBreakdown.length > 0) {
    const monthlyWorksheet = XLSX.utils.json_to_sheet(monthlyBreakdown);
    monthlyWorksheet["!cols"] = [
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
    ];
    XLSX.utils.book_append_sheet(
      workbook,
      monthlyWorksheet,
      "Monthly Breakdown"
    );
  }

  // Add metadata sheet
  const metadataData = [
    {
      Field: "Report Generated",
      Value: format(new Date(), "dd/MM/yyyy HH:mm:ss"),
    },
    { Field: "User", Value: user?.full_name || "Unknown" },
    { Field: "Email", Value: user?.email || "Unknown" },
    { Field: "Currency", Value: user?.currency || "INR" },
    { Field: "Timezone", Value: user?.timezone || "Asia/Kolkata" },
    { Field: "Total Records", Value: transactions.length },
    {
      Field: "Date Range",
      Value:
        transactions.length > 0
          ? `${format(
              new Date(
                Math.min(...transactions.map((t) => new Date(t.date).getTime()))
              ),
              "dd/MM/yyyy, hh:mm:ss a"
            )} to ${format(
              new Date(
                Math.max(...transactions.map((t) => new Date(t.date).getTime()))
              ),
              "dd/MM/yyyy, hh:mm:ss a"
            )}`
          : "No transactions",
    },
    {
      Field: "Export Source",
      Value: "Fintica - Smart Personal Finance Manager",
    },
  ];

  const metadataWorksheet = XLSX.utils.json_to_sheet(metadataData);
  metadataWorksheet["!cols"] = [{ width: 20 }, { width: 40 }];
  XLSX.utils.book_append_sheet(workbook, metadataWorksheet, "Report Info");

  // Generate filename
  const defaultFilename = `financial-report-${format(
    new Date(),
    "yyyy-MM-dd, hh:mm:ss a"
  )}.xlsx`;
  const finalFilename = filename || defaultFilename;

  // Save the file
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const fileBlob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(fileBlob, finalFilename);
};

// Quick export function for simple transaction list
export const exportSimpleTransactionsToExcel = (
  transactions: Transaction[],
  categories: Category[],
  filename?: string
) => {
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Unknown Category";
  };

  const data = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((transaction, index) => ({
      "S.No": index + 1,
      Date: format(new Date(transaction.date), "dd/MM/yyyy, hh:mm:ss a"),
      Description: transaction.description,
      Category: getCategoryName(transaction.category_id),
      Type:
        transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
      "Amount (₹)": parseFloat(transaction.amount.toString()),
    }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  worksheet["!cols"] = [
    { width: 8 }, // S.No
    { width: 12 }, // Date
    { width: 30 }, // Description
    { width: 20 }, // Category
    { width: 10 }, // Type
    { width: 15 }, // Amount
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

  const defaultFilename = `transactions-${format(
    new Date(),
    "yyyy-MM-dd, hh:mm:ss a"
  )}.xlsx`;
  const finalFilename = filename || defaultFilename;

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const fileBlob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(fileBlob, finalFilename);
};
