import { useState } from "react";
import { useTransactions } from "../../contexts/TransactionsContext";
import { useCategories } from "../../contexts/CategoriesContext";
import { useAuth } from "../../contexts/AuthContext";
import { format } from "date-fns";
import {
  X,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Tag,
  Calendar,
  Check,
  Zap,
} from "lucide-react";

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
  const currencySymbol = user?.currency || "$";

  const { addTransaction } = useTransactions();
  const { categories } = useCategories();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    type: "" as "income" | "expense" | "",
    amount: "",
    category_id: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  // Quick amounts for different transaction types
  const quickAmounts = [10, 25, 50, 100, 250, 500];

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

  const handleSubmit = async () => {
    if (
      !formData.type ||
      !formData.amount ||
      !formData.category_id ||
      !formData.description
    )
      return;

    setIsSubmitting(true);

    try {
      await addTransaction({
        amount: parseFloat(formData.amount),
        category_id: formData.category_id,
        description: formData.description,
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
          date: format(new Date(), "yyyy-MM-dd"),
        });
        setCurrentStep(1);
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Failed to add transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.type !== "";
      case 2:
        return formData.amount !== "" && parseFloat(formData.amount) > 0;
      case 3:
        return formData.category_id !== "";
      case 4:
        return formData.description !== "";
      default:
        return false;
    }
  };

  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        {showSuccess ? (
          <div className="text-center p-8 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-success-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600">
              Your transaction has been added successfully.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Zap size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Quick Add</h2>
                  <p className="text-sm text-gray-500">
                    Step {currentStep} of 4
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-4 bg-gray-50">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6 min-h-[300px] flex flex-col">
              {/* Step 1: Transaction Type */}
              {currentStep === 1 && (
                <div className="flex-1 flex flex-col animate-fade-in">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Transaction Type
                    </h3>
                    <p className="text-gray-600">
                      Choose whether this is money coming in or going out
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, type: "income" }))
                      }
                      className={`aspect-square p-4 rounded-xl border-2 transition-all duration-200 flex flex-col justify-center items-center ${
                        formData.type === "income"
                          ? "border-green-300 bg-green-50 shadow-md"
                          : "border-gray-200 hover:border-green-200 hover:bg-green-25"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                          formData.type === "income"
                            ? "bg-green-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <TrendingUp
                          size={24}
                          className={
                            formData.type === "income"
                              ? "text-green-600"
                              : "text-gray-500"
                          }
                        />
                      </div>
                      <h4 className="font-semibold text-gray-900">Income</h4>
                      <p className="text-xs text-gray-600">
                        Money you received
                      </p>
                    </button>

                    <button
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, type: "expense" }))
                      }
                      className={`aspect-square p-4 rounded-xl border-2 transition-all duration-200 flex flex-col justify-center items-center ${
                        formData.type === "expense"
                          ? "border-red-300 bg-red-50 shadow-md"
                          : "border-gray-200 hover:border-red-200 hover:bg-red-25"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                          formData.type === "expense"
                            ? "bg-red-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <TrendingDown
                          size={24}
                          className={
                            formData.type === "expense"
                              ? "text-red-600"
                              : "text-gray-500"
                          }
                        />
                      </div>
                      <h4 className="font-semibold text-gray-900">Expense</h4>
                      <p className="text-xs text-gray-600">Money you spent</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Amount */}
              {currentStep === 2 && (
                <div className="flex-1 flex flex-col animate-fade-in">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Amount
                    </h3>
                    <p className="text-gray-600">
                      Enter the amount for this {formData.type}
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="relative mb-4">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <DollarSign size={24} className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            amount: e.target.value,
                          }))
                        }
                        autoFocus
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {quickAmounts.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              amount: amount.toString(),
                            }))
                          }
                          className="py-2 px-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          {currencyFormatter.format(amount)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Category */}
              {currentStep === 3 && (
                <div className="flex-1 flex flex-col animate-fade-in">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Category
                    </h3>
                    <p className="text-gray-600">
                      Choose a category for this transaction
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Tag size={20} className="text-gray-400" />
                      </div>
                      <select
                        className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                        value={formData.category_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            category_id: e.target.value,
                          }))
                        }
                        autoFocus
                      >
                        <option value="">Select a category</option>
                        {filteredCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Description & Date */}
              {currentStep === 4 && (
                <div className="flex-1 flex flex-col animate-fade-in">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Description & Date
                    </h3>
                    <p className="text-gray-600">
                      Add details to remember this transaction
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col justify-center space-y-4">
                    <div>
                      <div className="relative mb-3">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FileText size={20} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="e.g., Grocery shopping"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          autoFocus
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
                    </div>

                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Calendar size={20} className="text-gray-400" />
                        </div>
                        <input
                          type="date"
                          className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          value={formData.date}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              date: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center"
                  >
                    <ArrowLeft size={18} className="mr-2" />
                    Back
                  </button>
                )}

                <button
                  onClick={nextStep}
                  disabled={!canProceed() || isSubmitting}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : currentStep === 4 ? (
                    <>
                      <Check size={18} className="mr-2" />
                      Add Transaction
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight size={18} className="ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StepByStepTransaction;
