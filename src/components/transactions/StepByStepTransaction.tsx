import { useState } from "react";
import { useTransactions } from "../../contexts/TransactionsContext";
import { useCategories } from "../../contexts/CategoriesContext";
import { useAuth } from "../../contexts/AuthContext";
import { format } from "date-fns";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { motion, AnimatePresence } from "framer-motion";
// import { Toaster } from "sonner";

import {
  X,
  // ArrowRight,
  // ArrowLeft,
  // TrendingUp,
  // TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  // DollarSign,
  FileText,
  // Tag,
  Calendar,
  Check,
  Zap,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

interface StepByStepTransactionProps {
  isOpen: boolean;
  onClose: () => void;
}

function StepByStepTransaction({
  isOpen,
  onClose,
}: StepByStepTransactionProps) {
  const { user } = useAuth();
  const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: user?.currency || "USD",
    minimumFractionDigits: 0,
  });

  const getCurrencySymbol = (currency: string): string => {
    return (0)
      .toLocaleString(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      .replace(/\d/g, "")
      .trim(); // removes digits, keeps symbol
  };

  const currencySymbol = getCurrencySymbol(user?.currency || "USD");

  // const currencySymbol = user?.currency || "$";
  const { addTransaction } = useTransactions();
  const { categories } = useCategories();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isModalOpen, setModalOpen] = useState(true);

  const [formData, setFormData] = useState({
    type: "" as "income" | "expense" | "",
    amount: "",
    category_id: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  // Quick amounts for different transaction types
  const quickAmounts = [10, 20, 50, 100, 250, 500];

  // Common descriptions
  const commonDescriptions = {
    expense: ["Groceries", "Gas", "Coffee", "Lunch", "Shopping", "Utilities"],
    income: [
      "Salary",
      "Freelance",
      "Bonus",
      "Investment",
      "Gift",
      "Side Hustle",
    ],
  };

  const resetForm = () => {
    setFormData({
      type: "expense",
      category_id: "",
      amount: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    });
    setCurrentStep(1);
    setShowSuccess(false);
  };

  const handleClose = () => {
    // isOpen(false);
    setModalOpen(false);
    setTimeout(resetForm, 300);
  };

  const handleSubmit = async () => {
    if (
      !formData.type ||
      !formData.amount ||
      !formData.category_id
      // !formData.description
    )
      return;

    setIsSubmitting(true);

    try {
      await addTransaction({
        amount: parseFloat(formData.amount),
        category_id: formData.category_id,
        description: formData.description?.trim() || null,
        date: formData.date,
        type: formData.type as "income" | "expense",
      });

      setShowSuccess(true);

      setTimeout(() => {
        setFormData({
          type: "",
          amount: "",
          category_id: "",
          description: "",
          date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        });
        setCurrentStep(1);
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
    console.log("description value: ", JSON.stringify(formData.description));
  };

  // const nextStep = () => {
  //   if (currentStep < 4) {
  //     setCurrentStep(currentStep + 1);
  //   } else {
  //     handleSubmit();
  //   }
  // };

  // const prevStep = () => {
  //   if (currentStep > 1) {
  //     setCurrentStep(currentStep - 1);
  //   }
  // };

  // const canProceed = () => {
  //   switch (currentStep) {
  //     case 1:
  //       return formData.type !== "";
  //     case 2:
  //       return formData.amount !== "" && parseFloat(formData.amount) > 0;
  //     case 3:
  //       return formData.category_id !== "";
  //     case 4:
  //       return formData.description !== "";
  //     default:
  //       return false;
  //   }
  // };

  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type
  );

  if (!isOpen) return null;

  return (
    // <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    // <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card
              variant="glass"
              className="backdrop-blur-xl border-2 border-white/20"
            >
              {showSuccess ? (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Check size={32} className="text-success-600" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                    Transaction Added!
                  </h3>
                  <p className="text-neutral-600">
                    Your transaction has been successfully recorded.
                  </p>
                </div>
              ) : (
                <div className="p-6">
                  <Toaster position="top-center" />
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <Zap size={20} className="text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-800">
                          Quick Add
                        </h3>
                        <p className="text-sm text-neutral-500">
                          Step {currentStep} of 4
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<X size={20} />}
                      onClick={onClose}
                      className="text-neutral-400 hover:text-neutral-600"
                      children={undefined}
                    />
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-200 rounded-full h-2 mb-6">
                    <motion.div
                      className="bg-gradient-to-r from-primary-600 to-primary-700 h-2 rounded-full"
                      initial={{ width: "25%" }}
                      animate={{ width: `${(currentStep / 4) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Step Content */}
                  <AnimatePresence mode="wait">
                    {/* <div className="p-6 min-h-[300px] flex flex-col"> */}
                    {/* Step 1: Transaction Type */}
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <h4 className="font-medium text-neutral-800 mb-4">
                          Transaction Type
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            {
                              type: "income",
                              icon: ArrowUpRight,
                              label: "Income",
                              color: "success",
                            },
                            {
                              type: "expense",
                              icon: ArrowDownRight,
                              label: "Expense",
                              color: "danger",
                            },
                          ].map(({ type, icon: Icon, label, color }) => (
                            <button
                              key={type}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  type: type as "income" | "expense",
                                  category_id: "",
                                });
                                setCurrentStep(2);
                              }}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                formData.type === type
                                  ? `border-${color}-300 bg-${color}-50`
                                  : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                              }`}
                            >
                              <Icon
                                size={24}
                                className={`mx-auto mb-2 text-${color}-600`}
                              />
                              <p className="font-medium text-neutral-800">
                                {label}
                              </p>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Category */}
                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-neutral-800">
                            Select Category
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(1)}
                            className="text-neutral-500"
                          >
                            Back
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {filteredCategories.map((category) => (
                            <button
                              key={category.id}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  category_id: category.id,
                                });
                                setCurrentStep(3);
                              }}
                              className={`p-3 rounded-lg border transition-all duration-200 text-left cursor-pointer ${
                                formData.category_id === category.id
                                  ? "border-primary-500 bg-primary-50"
                                  : "border-neutral-200 bg-white hover:border-sky-300 hover:bg-sky-50"
                              }`}
                            >
                              <div className="flex items-center">
                                {/* <span
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm mr-2"
                                  style={{
                                    backgroundColor: category.color + "20",
                                    color: category.color,
                                  }}
                                >
                                  {category.icon}
                                </span> */}
                                <span className="font-medium text-sm text-neutral-800">
                                  {category.name}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Amount */}
                    {currentStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-neutral-800">
                            Amount
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(2)}
                            className="text-neutral-500"
                          >
                            Back
                          </Button>
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {quickAmounts.map((amount) => (
                            <button
                              key={amount}
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  amount: amount.toString(),
                                })
                              }
                              className="p-2 text-sm rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
                            >
                              {currencyFormatter.format(amount)}
                            </button>
                          ))}
                        </div>

                        {/* Custom Amount Input */}
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 text-sm">
                            {currencySymbol}
                          </span>

                          <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                amount: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                            placeholder="Enter amount"
                            min="0.01"
                            step="0.01"
                          />
                        </div>

                        <Button
                          variant="primary"
                          onClick={() => setCurrentStep(4)}
                          disabled={!formData.amount}
                          className="w-full"
                        >
                          Continue
                        </Button>
                      </motion.div>
                    )}

                    {/* Step 4: Description & Date */}
                    {currentStep === 4 && (
                      <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-neutral-800">
                            Final Details
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(3)}
                            className="text-neutral-500"
                          >
                            Back
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div className="relative">
                            <FileText
                              size={20}
                              className="absolute left-3 top-3 text-neutral-400"
                            />
                            <input
                              type="text"
                              value={formData.description}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  description: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                              placeholder="Description (optional)"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {(formData.type
                              ? commonDescriptions[formData.type]
                              : []
                            )
                              .slice(0, 4)
                              .map((desc) => (
                                <button
                                  key={desc}
                                  type="button"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      description: desc,
                                    }))
                                  }
                                  className="py-2 px-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left"
                                >
                                  {desc}
                                </button>
                              ))}
                          </div>

                          <div className="relative">
                            <Calendar
                              size={20}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500"
                            />
                            <input
                              type="datetime-local"
                              value={formData.date}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  date: e.target.value,
                                })
                              }
                              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-neutral-300 shadow-sm 
               focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
               transition-all duration-200 bg-white hover:shadow-md cursor-pointer"
                            />
                          </div>

                          {/* Summary */}
                          <div className="bg-neutral-50 rounded-xl p-4">
                            <h5 className="font-medium text-neutral-800 mb-2">
                              Summary
                            </h5>
                            <div className="space-y-1 text-sm text-neutral-600">
                              <div className="flex justify-between">
                                <span>Type:</span>
                                <span className="capitalize">
                                  {formData.type}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Category:</span>
                                <span>
                                  {
                                    categories.find(
                                      (c) => c.id === formData.category_id
                                    )?.name
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Amount:</span>
                                <span className="font-medium">
                                  {/* ₹{formData.amount} */}
                                  {currencyFormatter.format(
                                    Number(formData.amount)
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="gradient"
                            onClick={handleSubmit}
                            isLoading={isSubmitting}
                            className="w-full"
                            icon={<Check size={16} />}
                          >
                            {isSubmitting
                              ? "Adding Transaction..."
                              : "Add Transaction"}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                    {/* </div> */}
                  </AnimatePresence>
                </div>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    // </div>
    // </div>
  );
}

export default StepByStepTransaction;
