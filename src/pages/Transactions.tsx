/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-case-declarations */
import { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { supabase } from "../lib/supabase";

pdfMake.vfs = pdfFonts.vfs;

// import logo from "../../public/icons/icon-512x512.png";
const logoBase64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAE+2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI1LTA3LTA0PC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkV4dElkPmFhNTE0YWEyLTY5MTktNGZlOS1hYjlkLWZjZWE3NmE1ODc5OTwvQXR0cmliOkV4dElkPgogICAgIDxBdHRyaWI6RmJJZD41MjUyNjU5MTQxNzk1ODA8L0F0dHJpYjpGYklkPgogICAgIDxBdHRyaWI6VG91Y2hUeXBlPjI8L0F0dHJpYjpUb3VjaFR5cGU+CiAgICA8L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvQXR0cmliOkFkcz4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6ZGM9J2h0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvJz4KICA8ZGM6dGl0bGU+CiAgIDxyZGY6QWx0PgogICAgPHJkZjpsaSB4bWw6bGFuZz0neC1kZWZhdWx0Jz5GSU5USUNBICg1MTIgeCA1MTIgcHgpIC0gMTwvcmRmOmxpPgogICA8L3JkZjpBbHQ+CiAgPC9kYzp0aXRsZT4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6cGRmPSdodHRwOi8vbnMuYWRvYmUuY29tL3BkZi8xLjMvJz4KICA8cGRmOkF1dGhvcj5LYXJhbiBLYWNoYTwvcGRmOkF1dGhvcj4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6eG1wPSdodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvJz4KICA8eG1wOkNyZWF0b3JUb29sPkNhbnZhIChSZW5kZXJlcikgZG9jPURBR3NPdjBFbGkwIHVzZXI9VUFEN0FVMVJhZTggYnJhbmQ9T3JsYW5kbyBCZW5pY2lvJiMzOTtzIENsYXNzIHRlbXBsYXRlPUJsdWUgRmxhdCBJbGx1c3RyYXRlZCBGaW5hbmNlIENvbXBhbnkgTG9nbzwveG1wOkNyZWF0b3JUb29sPgogPC9yZGY6RGVzY3JpcHRpb24+CjwvcmRmOlJERj4KPC94OnhtcG1ldGE+Cjw/eHBhY2tldCBlbmQ9J3InPz6xgIraAAAnnElEQVR4nOzWMRHAIADAwFIHHDv+XVIXZci/gowZc+3zAAAp7+0AAOB/BgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABA0AcAAP//7N1rjFTlHcfx/5k558zM3ld2YRdkYS+zC4KKCuoisAu6aqJG05iiGNpiom2siS8srWltYt/UF1YT27QpaatNW21irIla0hYtWmlr21hSi6Ig2MptYUH2fpudOdMXw0WgsDO7M+d/zpzvJ9mQ7D5z5veK5zdnnuc5FAAAAAKIAgAAQABRAAAACCAKAAAAAUQBAAAggCgAAAAEEAUAAIAAogAAABBAFAAAAAKIAgAAQABRAAAACCAKAAAAAUQBAAAggCgAAAAEEAUAAIAAogAAABBAFAAAAAKIAgAAQACZ2gEABItZt0CslpVizl4sRqQs80snJYk92yTx3mZxho/rBgQCwqie0ZDWDgGguFnNK8RuWSF222oJVdRdcOz4js0y8senxBk65lI6IJgoAADyzohVih3vELu1U6ymdjHskpxenx4blIHn7pdk984CJQRAAQCQF+GaJrFbO8Vu7RDz4iXTvl56Ykz6n10vqZ7deUgH4GwUAABTZs1fJna8Q6zWTglXz8379VNH90rfps/l/boAWAQIIAdGpFTsllVixVeJHe8QI1Ja0PcL1zZL9Mo7ZWz7iwV9HyCIKAAALihUWS922/Vit3aINf9q198/cumtFACgACgAAM5hzl0idssqsVs7JFzbopzlCjEiZZIeH1LNARQbCgAAMayoWE3LM6v246skVFKtHekM4eqLJXn4Q+0YQFGhAAABFSqrEXthV2YRX1O7dpwLCpXViggFAMgnCgAQIGb9JadW7Zt1C7TjAFBEAQCKnN2yUqzWTrHjqyRUPlM7DgCPoAAARcYoqRI7njmQx2pqF8OKaUcC4EEUAKAIhGubM6fwxTvEvPhy7TgAfIACAPiU1XjNqfP2Q1VztOMA8BkKAOATRqRM7PiqzFa95utOP0oXAKaAAgB4WKhqjthtazKT/ryl2nEAFBEKAOAx5twrxG7N3NoPz2jUjgOgSFEAAGWGFROr+brMIr6WlWKUVGlHAhAAFABAQah8ZubWfrxDrObl2nEABBAFAHCJOXuR2PFOsVo7xJzVph0HQMBR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EwAiIiITYgJARERkQkwAiIiITIgJABERkQkxASAiIjIhJgBEREQmxASAiIjIhJgAEBERmRATACIiIhNiAkBERGRCTACIiIhMiAkAERGRCTEBICIiMiEmAERERCbEBICIiMiEmAAQERGZEBMAIiIiE2ICQEREZEJMAIiIiEyICQAREZEJMQEgIiIyISYAREREJsQEgIiIyIT+AwAA///t1oEAAAAAgCB/60EuigQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGAgjGfCU0AyikAAAAAElFTkSuQmCC";

import { useTransactions } from "../contexts/TransactionsContext";
import { useCategories } from "../contexts/CategoriesContext";
import { useAuth } from "../contexts/AuthContext";
import { Transaction } from "../lib/supabase";
import { User } from "../lib/supabase";
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
  Plus,
  Pencil,
} from "lucide-react";
import StepByStepTransaction from "../components/transactions/StepByStepTransaction";
import FloatingAddButton from "../components/transactions/FloatingAddButton";
// import VisualPdfExport from "../components/VisualPdfExport";

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
  const [dateFilter, setDateFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Export
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  // pdf
  const generateTransactionPDF = (
    transactions: Transaction[],
    getCategoryName: (id: string | null) => string
  ) => {
    const incomeRows = transactions
      .filter((t) => t.type === "income")
      .map((t) => [
        format(parseISO(t.created_at), "yyyy-MM-dd"),
        getCategoryName(t.category_id),
        t.amount.toFixed(2),
        t.description || "",
      ]);

    const expenseRows = transactions
      .filter((t) => t.type === "expense")
      .map((t) => [
        format(parseISO(t.created_at), "yyyy-MM-dd"),
        getCategoryName(t.category_id),
        t.amount.toFixed(2),
        t.description || "",
      ]);

    const totalIncome = incomeRows.reduce(
      (sum, row) => sum + Number(row[2]),
      0
    );
    const totalExpense = expenseRows.reduce(
      (sum, row) => sum + Number(row[2]),
      0
    );
    const netBalance = totalIncome - totalExpense;

    // const ranid = Math.floor(Math.random() * 1000000);

    async function getUserEmail() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.error("Error fetching auth user:", error);
        return "Unknown_User";
      }

      return user.email?.split("@")[0] ?? "Unknown_User";
    }

    async function main() {
      const userName = await getUserEmail();

      const docDefinition = {
        pageMargins: [40, 60, 40, 60],

        content: [
          {
            columns: [
              logoBase64
                ? { image: logoBase64, width: 60, margin: [0, 0, 20, 0] }
                : {},
              {
                stack: [
                  { text: "Fintica", style: "brandName" },
                  { text: "Transactions Report", style: "reportTitle" },
                  {
                    text: `Generated on: ${new Date().toLocaleDateString()}`,
                    style: "reportDate",
                  },
                ],
                alignment: "right",
              },
            ],
            columnGap: 10,
            margin: [0, 0, 0, 20],
            canvas: [
              {
                type: "line",
                x1: 0,
                y1: 0,
                x2: 515,
                y2: 0,
                lineWidth: 1,
                lineColor: "#ddd",
              },
            ],
          },

          { text: "Income Transactions", style: "sectionHeader" },
          {
            style: "card",
            table: {
              headerRows: 1,
              widths: ["auto", "*", "auto", "*"],
              body: [
                [
                  { text: "Date", style: "tableHeader" },
                  { text: "Category", style: "tableHeader" },
                  { text: "Amount", style: "tableHeader" },
                  { text: "Description", style: "tableHeader" },
                ],
                ...incomeRows.map((row, idx) =>
                  row.map((cell) => ({
                    text: cell,
                    margin: [4, 6, 4, 6],
                    fillColor: idx % 2 === 0 ? "#e3f2fd" : "#ffffff",
                  }))
                ),
              ],
            },
            layout: {
              fillColor: (rowIndex: number) =>
                rowIndex === 0 ? "#bbdefb" : null,
              hLineWidth: () => 0.6,
              vLineWidth: () => 0.6,
              hLineColor: () => "#90caf9",
              vLineColor: () => "#90caf9",
              paddingLeft: () => 12,
              paddingRight: () => 12,
              paddingTop: () => 8,
              paddingBottom: () => 8,
            },
          },
          {
            text: `Total Income: ${formatCurrency(totalIncome)}`,
            style: "highlightBox",
          },

          {
            text: "Expense Transactions",
            style: "sectionHeader",
            margin: [0, 30, 0, 10],
          },
          {
            style: "card",
            table: {
              headerRows: 1,
              widths: ["auto", "*", "auto", "*"],
              body: [
                [
                  { text: "Date", style: "tableHeader" },
                  { text: "Category", style: "tableHeader" },
                  { text: "Amount", style: "tableHeader" },
                  { text: "Description", style: "tableHeader" },
                ],
                ...expenseRows.map((row, idx) =>
                  row.map((cell) => ({
                    text: cell,
                    margin: [4, 6, 4, 6],
                    fillColor: idx % 2 === 0 ? "#fff3e0" : "#ffffff",
                  }))
                ),
              ],
            },
            layout: {
              fillColor: (rowIndex: number) =>
                rowIndex === 0 ? "#ffe0b2" : null,
              hLineWidth: () => 0.6,
              vLineWidth: () => 0.6,
              hLineColor: () => "#ffcc80",
              vLineColor: () => "#ffcc80",
              paddingLeft: () => 12,
              paddingRight: () => 12,
              paddingTop: () => 8,
              paddingBottom: () => 8,
            },
          },
          {
            text: `Total Expense: ${formatCurrency(totalExpense)}`,
            style: "highlightBox",
          },

          {
            text: `Net Balance: ${formatCurrency(netBalance)}`,
            style: netBalance >= 0 ? "successBox" : "warningBox",
            margin: [0, 30, 0, 0],
          },
        ],

        styles: {
          brandName: { fontSize: 24, bold: true, color: "#0d47a1" },
          reportTitle: {
            fontSize: 16,
            bold: true,
            color: "#37474f",
            margin: [0, 6, 0, 2],
          },
          reportDate: { fontSize: 11, color: "#757575", margin: [0, 0, 0, 10] },
          sectionHeader: {
            fontSize: 18,
            bold: true,
            color: "#1565c0",
            margin: [0, 20, 0, 10],
          },
          tableHeader: {
            bold: true,
            fontSize: 12,
            color: "#0d47a1",
            margin: [0, 5, 0, 5],
          },
          card: { margin: [0, 0, 0, 15] },
          highlightBox: {
            fontSize: 14,
            bold: true,
            color: "#0d47a1",
            decoration: "underline",
            margin: [0, 10, 0, 10],
          },
          successBox: {
            fontSize: 14,
            bold: true,
            color: "#2e7d32",
            margin: [0, 20, 0, 0],
          },
          warningBox: {
            fontSize: 14,
            bold: true,
            color: "#c62828",
            margin: [0, 20, 0, 0],
          },
        },

        defaultStyle: {
          fontSize: 11,
          color: "#333",
        },
      };

      pdfMake
        .createPdf(docDefinition)
        .download(
          `Fintica_Transactions_Report of ${userName} as on ${new Date().toLocaleString()}.pdf`
        );
    }

    main();
  };

  // const handleExport = (type) => {
  //   setShowExportMenu(false);
  //   if (type === "pdf") {
  //     generateTransactionPDF(sortedTransactions, getCategoryName);
  //   } else {
  //     exportToExcel();
  //   }
  // };

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

      {/* Export button */}

      <div className="relative inline-block text-left mt-4">
        <div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-2 text-white shadow-md transition hover:bg-green-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            onClick={() => setShowExportMenu((prev) => !prev)}
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
            Export
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {showExportMenu && (
          <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <button
                onClick={exportToExcel}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Export to Excel
              </button>
              <button
                onClick={() =>
                  generateTransactionPDF(sortedTransactions, getCategoryName)
                }
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Export to PDF
              </button>
            </div>
            {/* <VisualPdfExport
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              filteredTransactions={filteredTransactions}
              formatCurrency={formatCurrency}
              getCategoryName={getCategoryName}
            /> */}
          </div>
        )}
      </div>

      {showEditModal && transactionToEdit && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Edit Transaction
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
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
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Grocery shopping"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
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
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 150"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
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
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
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
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEdit(transactionToEdit)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

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
                            onClick={() => handleEditClick(transaction)}
                            className="btn-sm btn-outline"
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
