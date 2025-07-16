import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  DollarSign,
  Calculator,
  Split,
  Plus,
  Minus,
  Percent,
  Equal,
  UserCheck,
  AlertCircle,
  CheckCircle,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { groupService } from "../../services/groupService";
import { GroupTransaction } from "../../types/group";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface SplitMember {
  id: string;
  name: string;
  email: string;
  amount: number;
  percentage: number;
  isSelected: boolean;
}

interface TransactionSplitModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  categories: any[];
  existingTransaction?: GroupTransaction | null;
  onTransactionAdded: () => void;
}

const TransactionSplitModal: React.FC<TransactionSplitModalProps> = ({
  open,
  onClose,
  groupId,
  categories,
  existingTransaction,
  onTransactionAdded,
}) => {
  const [step, setStep] = useState(1);
  const [members, setMembers] = useState<SplitMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Transaction form (pre-filled if existing transaction)
  const [transactionForm, setTransactionForm] = useState({
    description: "",
    category_id: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    paidBy: "",
  });

  // Split settings
  const [splitType, setSplitType] = useState<"equal" | "percentage" | "amount">(
    "equal"
  );
  const [splitMembers, setSplitMembers] = useState<SplitMember[]>([]);

  useEffect(() => {
    if (open && groupId) {
      loadGroupMembers();
      getCurrentUser();

      if (existingTransaction) {
        // Pre-fill form with existing transaction data
        setTransactionForm({
          description: existingTransaction.description,
          category_id: existingTransaction.category_id,
          amount: existingTransaction.amount.toString(),
          date: existingTransaction.date,
          paidBy: existingTransaction.created_by,
        });
        setStep(2); // Skip transaction details step
      } else {
        resetForm();
      }
    }
  }, [open, groupId, existingTransaction]);

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await groupService.supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error getting current user:", error);
    }
  };

  const loadGroupMembers = async () => {
    try {
      setLoading(true);
      const data = await groupService.getGroupMembers(groupId);

      const membersList: SplitMember[] = data.map((member) => ({
        id: member.user_id,
        name: member.users?.full_name || "Unknown",
        email: member.users?.email || "",
        amount: 0,
        percentage: 0,
        isSelected: true,
      }));

      setMembers(membersList);
      setSplitMembers([...membersList]);

      // Set first member as default payer if not existing transaction
      if (membersList.length > 0 && !existingTransaction) {
        setTransactionForm((prev) => ({ ...prev, paidBy: membersList[0].id }));
      }
    } catch (error) {
      console.error("Error loading group members:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setTransactionForm({
      description: "",
      category_id: "",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      paidBy: "",
    });
    setSplitType("equal");
  };

  const calculateSplit = () => {
    const totalAmount = parseFloat(transactionForm.amount) || 0;
    const selectedMembers = splitMembers.filter((m) => m.isSelected);

    if (selectedMembers.length === 0) return;

    let updatedMembers = [...splitMembers];

    switch (splitType) {
      case "equal":
        const equalAmount = totalAmount / selectedMembers.length;
        updatedMembers = updatedMembers.map((member) => ({
          ...member,
          amount: member.isSelected ? equalAmount : 0,
          percentage: member.isSelected ? 100 / selectedMembers.length : 0,
        }));
        break;

      case "percentage":
        updatedMembers = updatedMembers.map((member) => ({
          ...member,
          amount: member.isSelected
            ? (totalAmount * member.percentage) / 100
            : 0,
        }));
        break;

      case "amount":
        // Amounts are set manually, calculate percentages
        updatedMembers = updatedMembers.map((member) => ({
          ...member,
          percentage: totalAmount > 0 ? (member.amount / totalAmount) * 100 : 0,
        }));
        break;
    }

    setSplitMembers(updatedMembers);
  };

  useEffect(() => {
    if (transactionForm.amount && splitMembers.length > 0) {
      calculateSplit();
    }
  }, [transactionForm.amount, splitType]);

  const toggleMemberSelection = (memberId: string) => {
    setSplitMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? { ...member, isSelected: !member.isSelected }
          : member
      )
    );
  };

  const updateMemberAmount = (memberId: string, amount: number) => {
    setSplitMembers((prev) =>
      prev.map((member) =>
        member.id === memberId ? { ...member, amount } : member
      )
    );
  };

  const updateMemberPercentage = (memberId: string, percentage: number) => {
    setSplitMembers((prev) =>
      prev.map((member) =>
        member.id === memberId ? { ...member, percentage } : member
      )
    );
  };

  const getTotalSplit = () => {
    return splitMembers
      .filter((m) => m.isSelected)
      .reduce((sum, member) => sum + member.amount, 0);
  };

  const getTotalPercentage = () => {
    return splitMembers
      .filter((m) => m.isSelected)
      .reduce((sum, member) => sum + member.percentage, 0);
  };

  const isValidSplit = () => {
    const totalAmount = parseFloat(transactionForm.amount) || 0;
    const splitTotal = getTotalSplit();
    const difference = Math.abs(totalAmount - splitTotal);

    return difference < 0.01; // Allow for small rounding differences
  };

  const getCurrentUserSplit = () => {
    const currentUserMember = splitMembers.find(
      (m) => m.id === currentUser?.id
    );
    return currentUserMember?.amount || 0;
  };

  const handleSubmit = async () => {
    if (!isValidSplit()) {
      alert("Split amounts do not match the total transaction amount");
      return;
    }

    try {
      setSubmitting(true);

      // Create split records for each member
      const splitDetails = splitMembers
        .filter((m) => m.isSelected && m.amount > 0)
        .map((m) => ({
          user_id: m.id,
          amount: m.amount,
          percentage: m.percentage,
        }));

      // If it's an existing transaction, create split records
      if (existingTransaction) {
        // Create individual split transactions for each member
        for (const split of splitDetails) {
          const splitTransaction = {
            category_id: transactionForm.category_id,
            amount: split.amount,
            type: "expense" as const,
            description: `${
              transactionForm.description
            } (Your split: ${formatCurrency(split.amount)})`,
            date: transactionForm.date,
            // Add metadata to indicate this is a split transaction
            metadata: {
              original_transaction_id: existingTransaction.id,
              split_type: splitType,
              total_amount: parseFloat(transactionForm.amount),
              split_with: splitDetails.length,
            },
          };

          // Only create transaction for the current user to show their portion
          if (split.user_id === currentUser?.id) {
            await groupService.createGroupTransaction(
              groupId,
              splitTransaction
            );
          }
        }
      } else {
        // Create new transaction with split details
        const mainTransaction = {
          category_id: transactionForm.category_id,
          amount: getCurrentUserSplit(), // Only show user's portion
          type: "expense" as const,
          description: `${transactionForm.description} (Split ${splitDetails.length} ways - Your portion)`,
          date: transactionForm.date,
        };

        await groupService.createGroupTransaction(groupId, mainTransaction);
      }

      onTransactionAdded();
      onClose();
    } catch (error: any) {
      console.error("Error creating split transaction:", error);
      alert("Failed to create split transaction: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const modalTitle = existingTransaction
    ? `Split Transaction: ${existingTransaction.description}`
    : "Create Split Transaction";

  return (
    <Modal open={open} title={modalTitle} onClose={onClose}>
      <div className="max-w-2xl">
        <AnimatePresence mode="wait">
          {step === 1 && !existingTransaction && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <Split size={24} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800">
                    Transaction Details
                  </h3>
                  <p className="text-sm text-neutral-500">
                    Enter the transaction information
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={transactionForm.description}
                    onChange={(e) =>
                      setTransactionForm({
                        ...transactionForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="What was this expense for?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Category
                  </label>
                  <select
                    value={transactionForm.category_id}
                    onChange={(e) =>
                      setTransactionForm({
                        ...transactionForm,
                        category_id: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories
                      .filter((cat) => cat.type === "expense")
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    value={transactionForm.amount}
                    onChange={(e) =>
                      setTransactionForm({
                        ...transactionForm,
                        amount: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter total amount"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={transactionForm.date}
                    onChange={(e) =>
                      setTransactionForm({
                        ...transactionForm,
                        date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setStep(2)}
                  disabled={
                    !transactionForm.description ||
                    !transactionForm.category_id ||
                    !transactionForm.amount
                  }
                  className="flex-1"
                >
                  Next: Split Amount
                </Button>
              </div>
            </motion.div>
          )}

          {(step === 2 || existingTransaction) && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <Calculator size={24} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-800">
                      Split Amount
                    </h3>
                    <p className="text-sm text-neutral-500">
                      Total:{" "}
                      {formatCurrency(parseFloat(transactionForm.amount) || 0)}
                    </p>
                  </div>
                </div>
                {!existingTransaction && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                    className="text-neutral-500"
                  >
                    Back
                  </Button>
                )}
              </div>

              {/* Your Split Amount Highlight */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="text-primary-600 mr-2" size={20} />
                    <span className="font-medium text-primary-800">
                      Your Split Amount:
                    </span>
                  </div>
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(getCurrentUserSplit())}
                  </span>
                </div>
                <p className="text-sm text-primary-600 mt-1">
                  This is the amount that will be added to your transactions
                </p>
              </div>

              {/* Split Type Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Split Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "equal", label: "Equal Split", icon: Equal },
                    {
                      value: "percentage",
                      label: "By Percentage",
                      icon: Percent,
                    },
                    {
                      value: "amount",
                      label: "Custom Amount",
                      icon: DollarSign,
                    },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setSplitType(value as any)}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        splitType === value
                          ? "border-primary-300 bg-primary-50 text-primary-700"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <Icon size={20} className="mx-auto mb-1" />
                      <div className="text-xs font-medium">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Members List */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Split Between Members
                </label>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {splitMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`p-4 rounded-lg border transition-all duration-200 ${
                        member.isSelected
                          ? "border-primary-200 bg-primary-50"
                          : "border-neutral-200"
                      } ${
                        member.id === currentUser?.id
                          ? "ring-2 ring-primary-300"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleMemberSelection(member.id)}
                            className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors ${
                              member.isSelected
                                ? "border-primary-500 bg-primary-500 text-white"
                                : "border-neutral-300"
                            }`}
                          >
                            {member.isSelected && <UserCheck size={12} />}
                          </button>
                          <div>
                            <p
                              className={`font-medium ${
                                member.id === currentUser?.id
                                  ? "text-primary-700"
                                  : "text-neutral-800"
                              }`}
                            >
                              {member.name}{" "}
                              {member.id === currentUser?.id && "(You)"}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {member.email}
                            </p>
                          </div>
                        </div>

                        {member.isSelected && (
                          <div className="flex items-center space-x-2">
                            {splitType === "percentage" && (
                              <div className="flex items-center">
                                <input
                                  type="number"
                                  value={member.percentage}
                                  onChange={(e) =>
                                    updateMemberPercentage(
                                      member.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 px-2 py-1 text-sm border border-neutral-200 rounded"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                />
                                <span className="text-sm text-neutral-500 ml-1">
                                  %
                                </span>
                              </div>
                            )}

                            {splitType === "amount" && (
                              <input
                                type="number"
                                value={member.amount}
                                onChange={(e) =>
                                  updateMemberAmount(
                                    member.id,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20 px-2 py-1 text-sm border border-neutral-200 rounded"
                                min="0"
                                step="0.01"
                              />
                            )}

                            <div className="text-right">
                              <p
                                className={`text-sm font-medium ${
                                  member.id === currentUser?.id
                                    ? "text-primary-600"
                                    : "text-neutral-800"
                                }`}
                              >
                                {formatCurrency(member.amount)}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {member.percentage.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Split Summary */}
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700">
                    Split Total:
                  </span>
                  <span className="font-bold text-neutral-800">
                    {formatCurrency(getTotalSplit())}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700">
                    Transaction Total:
                  </span>
                  <span className="font-bold text-neutral-800">
                    {formatCurrency(parseFloat(transactionForm.amount) || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">
                    Difference:
                  </span>
                  <span
                    className={`font-bold ${
                      isValidSplit() ? "text-success-600" : "text-danger-600"
                    }`}
                  >
                    {formatCurrency(
                      Math.abs(
                        (parseFloat(transactionForm.amount) || 0) -
                          getTotalSplit()
                      )
                    )}
                  </span>
                </div>

                {splitType === "percentage" && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-neutral-700">
                      Total Percentage:
                    </span>
                    <span
                      className={`font-bold ${
                        getTotalPercentage() === 100
                          ? "text-success-600"
                          : "text-warning-600"
                      }`}
                    >
                      {getTotalPercentage().toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Validation Message */}
              {!isValidSplit() && (
                <div className="flex items-center p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <AlertCircle size={16} className="text-warning-600 mr-2" />
                  <span className="text-sm text-warning-700">
                    Split amounts must equal the transaction total
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="gradient"
                  onClick={handleSubmit}
                  disabled={!isValidSplit() || submitting}
                  isLoading={submitting}
                  className="flex-1"
                  icon={<CheckCircle size={16} />}
                >
                  {existingTransaction
                    ? "Split Transaction"
                    : "Create Split Transaction"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};

export default TransactionSplitModal;
