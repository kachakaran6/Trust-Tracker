import { useState, useRef, useEffect } from "react";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { usePDF } from "react-to-pdf";
import TransactionsPDFReport from "../components/TransactionsPDFReport";
import {
  exportTransactionsToExcel,
  exportSimpleTransactionsToExcel,
} from "../utils/excelExport";
import { useTransactions } from "../contexts/TransactionsContext";
import { useCategories } from "../contexts/CategoriesContext";
import { useAuth } from "../contexts/AuthContext";
import { formatMoney, formatDate, formatDateTime, formatCategory } from "../lib/format";
import { Transaction } from "../types";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import StepByStepTransaction from "../components/transactions/StepByStepTransaction";
import FloatingAddButton from "../components/transactions/FloatingAddButton";
import { usePageHeader } from "../contexts/PageHeaderContext";
import { PageHeader } from "../components/ui/PageHeader";
import { Button, IconButton } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Modal } from "../components/ui/Modal";
import { Icons } from "../components/ui/icons";
import { Card } from "../components/ui/Card";

pdfMake.vfs = pdfFonts.vfs;

type SortField = "date" | "amount" | "category";
type SortOrder = "asc" | "desc";

export default function Transactions() {
  const { user } = useAuth();
  const { setPageHeader } = usePageHeader();
  const { transactions, deleteTransaction, updateTransaction } =
    useTransactions();
  const { categories, getCategoryById } = useCategories();

  useEffect(() => {
    setPageHeader("Transactions");
  }, [setPageHeader]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit form state
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editDate, setEditDate] = useState("");

  // Filters & sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Export menu
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  const { toPDF, targetRef } = usePDF({
    filename: `trusttracker-report-${format(new Date(), "yyyy-MM-dd")}.pdf`,
    page: {
      margin: 10,
      format: "A4",
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    }
    if (exportMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [exportMenuOpen]);

  const filterTransactions = () => {
    return transactions.filter((transaction) => {
      if (
        searchTerm &&
        !(transaction.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      if (categoryFilter && transaction.category_id !== categoryFilter) {
        return false;
      }

      if (typeFilter && transaction.type !== typeFilter) {
        return false;
      }

      if (dateFilter) {
        const date = parseISO(transaction.date || transaction.created_at);
        let filterStart: Date, filterEnd: Date;

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

  const sortTransactions = (list: typeof transactions) => {
    return [...list].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison =
            new Date(a.date || a.created_at).getTime() -
            new Date(b.date || b.created_at).getTime();
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "category":
          const catA = getCategoryById(a.category_id || "")?.name || "";
          const catB = getCategoryById(b.category_id || "")?.name || "";
          comparison = catA.localeCompare(catB);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  const filteredAndSortedTransactions = sortTransactions(filterTransactions());

  const handleEditClick = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setEditDesc(transaction.description || "");
    setEditAmount(String(transaction.amount || ""));
    setEditCategory(transaction.category_id || "");
    setEditType(transaction.type);
    setEditDate(
      transaction.date
        ? transaction.date.slice(0, 10)
        : transaction.created_at.slice(0, 10)
    );
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionToEdit) return;

    try {
      await updateTransaction(transactionToEdit.id, {
        description: editDesc.trim(),
        amount: parseFloat(editAmount) || 0,
        category_id: editCategory,
        created_at: editDate || transactionToEdit.created_at,
        date: editDate || transactionToEdit.date,
        type: editType,
      });
      setShowEditModal(false);
      setTransactionToEdit(null);
    } catch (err) {
      console.error("Failed to update transaction:", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setIsDeleting(true);
      await deleteTransaction(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Failed to delete transaction:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportPDF = () => {
    setShowPDFPreview(true);
    setTimeout(() => {
      toPDF();
      setShowPDFPreview(false);
    }, 120);
    setExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    exportTransactionsToExcel({
      transactions: filteredAndSortedTransactions,
      categories,
      user,
      filename: `trusttracker-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`,
    });
    setExportMenuOpen(false);
  };

  const handleExportSimpleExcel = () => {
    exportSimpleTransactionsToExcel(
      filteredAndSortedTransactions,
      categories,
      `trusttracker-transactions-${format(new Date(), "yyyy-MM-dd")}.xlsx`
    );
    setExportMenuOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Search, filter, and audit your logged cashflow and group expense shares."
        secondaryActions={
          <div className="relative" ref={exportMenuRef}>
            <Button
              variant="secondary"
              icon={<Icons.Download size={16} />}
              iconRight={<Icons.ChevronDown size={14} />}
              onClick={() => setExportMenuOpen((p) => !p)}
            >
              Export
            </Button>

            {exportMenuOpen && (
              <div className="absolute right-0 top-11 w-52 bg-[var(--surface)] border border-[var(--border)] rounded-sm shadow-md z-30 p-1 space-y-0.5 animate-in fade-in-50 duration-100">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-muted)] rounded-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Icons.FileText size={15} className="text-[var(--text-muted)]" />
                  <span>PDF Statement</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-muted)] rounded-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Icons.Download size={15} className="text-[var(--text-muted)]" />
                  <div>
                    <p>Excel Workbook</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Detailed multi-sheet</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleExportSimpleExcel}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-muted)] rounded-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Icons.Download size={15} className="text-[var(--text-muted)]" />
                  <div>
                    <p>Excel (Simple List)</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Clean CSV-like sheet</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        }
        action={
          <Button
            variant="primary"
            icon={<Icons.Add size={16} />}
            onClick={() => setShowAddModal(true)}
          >
            Add Transaction
          </Button>
        }
      />

      {/* Filter Controls Bar */}
      <Card padding="sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Icons.Search size={16} />}
          />

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Cashflows</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </Select>

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {formatCategory(c.name)}
              </option>
            ))}
          </Select>

          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="">All Time</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="last-3-months">Last 3 Months</option>
          </Select>
        </div>
      </Card>

      {/* Transactions Table (Desktop) / Cards (Mobile) */}
      {filteredAndSortedTransactions.length === 0 ? (
        <EmptyState
          icon={<Icons.Transactions size={24} />}
          title="No transactions found"
          description={
            searchTerm || categoryFilter || typeFilter || dateFilter
              ? "No financial records matched your filter criteria."
              : "Start recording your daily expenses or income to track cashflow."
          }
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<Icons.Add size={16} />}
              onClick={() => setShowAddModal(true)}
            >
              Add Transaction
            </Button>
          }
        />
      ) : (
        <Card padding="none">
          {/* Mobile Stacked Rows (<768px) */}
          <div className="block md:hidden divide-y divide-[var(--border)]">
            {filteredAndSortedTransactions.map((tx) => {
              const category = getCategoryById(tx.category_id || "");
              const isIncome = tx.type === "income";

              return (
                <div key={tx.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-[var(--text)] truncate">
                        {tx.description || formatCategory(category?.name)}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <Badge variant="neutral" size="sm">
                          {formatCategory(category?.name)}
                        </Badge>
                        {tx.group_name && (
                          <Badge variant="primary" size="sm" icon={<Icons.Groups size={11} />}>
                            {tx.group_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-semibold tabular-nums ${
                          isIncome ? "text-[var(--success)]" : "text-[var(--danger)]"
                        }`}
                      >
                        {formatMoney(tx.amount, user?.currency, { showSign: true })}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {formatDate(tx.date || tx.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Split Status if present */}
                  {tx.split_status && (
                    <div className="pt-1">
                      {tx.split_status === "pending_split" && (
                        <Badge variant="warning">
                          Split in progress ({formatMoney(tx.split_received_amount, user?.currency)} reimbursed)
                        </Badge>
                      )}
                      {tx.split_status === "partially_settled" && (
                        <Badge variant="info">
                          Partially reimbursed ({formatMoney(tx.split_received_amount, user?.currency)} deducted)
                        </Badge>
                      )}
                      {tx.split_status === "fully_settled" && (
                        <Badge variant="success">Fully reimbursed & deducted</Badge>
                      )}
                      {tx.split_status === "settled_share" && (
                        <Badge variant="neutral">Group split share paid</Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1 pt-1 border-t border-[var(--border)]">
                    <IconButton
                      aria-label="Edit transaction"
                      variant="ghost"
                      size="sm"
                      icon={<Icons.Edit size={14} />}
                      onClick={() => handleEditClick(tx)}
                    />
                    <IconButton
                      aria-label="Delete transaction"
                      variant="danger-ghost"
                      size="sm"
                      icon={<Icons.Delete size={14} />}
                      onClick={() => setDeleteTargetId(tx.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
                  <th
                    onClick={() => {
                      setSortField("category");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] cursor-pointer"
                  >
                    Description & Group
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Category
                  </th>
                  <th
                    onClick={() => {
                      setSortField("date");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] cursor-pointer"
                  >
                    Date
                  </th>
                  <th
                    onClick={() => {
                      setSortField("amount");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] text-right cursor-pointer"
                  >
                    Amount
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                {filteredAndSortedTransactions.map((tx) => {
                  const category = getCategoryById(tx.category_id || "");
                  const isIncome = tx.type === "income";

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[var(--surface-muted)]/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-sm text-[var(--text)]">
                            {tx.description || formatCategory(category?.name)}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {tx.group_name && (
                              <Badge variant="primary" size="sm" icon={<Icons.Groups size={11} />}>
                                {tx.group_name}
                              </Badge>
                            )}
                            {tx.split_status === "pending_split" && (
                              <Badge variant="warning" size="sm">
                                Split in progress ({formatMoney(tx.split_received_amount, user?.currency)} reimbursed)
                              </Badge>
                            )}
                            {tx.split_status === "partially_settled" && (
                              <Badge variant="info" size="sm">
                                Partially reimbursed ({formatMoney(tx.split_received_amount, user?.currency)} deducted)
                              </Badge>
                            )}
                            {tx.split_status === "fully_settled" && (
                              <Badge variant="success" size="sm">Fully reimbursed</Badge>
                            )}
                            {tx.split_status === "settled_share" && (
                              <Badge variant="neutral" size="sm">Group split share</Badge>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant="neutral" size="sm">
                          {formatCategory(category?.name)}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs text-[var(--text-muted)]">
                        {formatDateTime(tx.date || tx.created_at)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                        <span
                          className={`tabular-nums text-sm font-semibold ${
                            isIncome ? "text-[var(--success)]" : "text-[var(--danger)]"
                          }`}
                        >
                          {formatMoney(tx.amount, user?.currency, { showSign: true })}
                        </span>
                        {tx.original_amount !== null &&
                          tx.original_amount !== undefined &&
                          tx.original_amount > tx.amount && (
                            <span className="text-[10px] text-[var(--text-muted)] line-through block tabular-nums">
                              was {formatMoney(tx.original_amount, user?.currency)}
                            </span>
                          )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton
                            aria-label="Edit transaction"
                            variant="ghost"
                            size="sm"
                            icon={<Icons.Edit size={14} />}
                            onClick={() => handleEditClick(tx)}
                          />
                          <IconButton
                            aria-label="Delete transaction"
                            variant="danger-ghost"
                            size="sm"
                            icon={<Icons.Delete size={14} />}
                            onClick={() => setDeleteTargetId(tx.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setTransactionToEdit(null);
        }}
        title="Edit Transaction"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Description"
            required
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
          />

          <Input
            label="Amount"
            type="number"
            step="0.01"
            required
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              value={editType}
              onChange={(e) => setEditType(e.target.value as "income" | "expense")}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </Select>

            <Select
              label="Category"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatCategory(c.name)}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Date"
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setTransactionToEdit(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action will update your budget and cashflow metrics."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />

      {/* Add Step by Step Modal */}
      <StepByStepTransaction
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Mobile Floating Add Button */}
      <FloatingAddButton onClick={() => setShowAddModal(true)} />

      {/* PDF Export Hidden Target */}
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
    </div>
  );
}
