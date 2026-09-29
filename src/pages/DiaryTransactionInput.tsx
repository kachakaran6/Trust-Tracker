import React, { useState } from "react";
import { useTransactions } from "../contexts/TransactionsContext";
import { useCategories } from "../contexts/CategoriesContext";
import { api } from "../lib/api";
import { Sparkles, ArrowRight, Check, Trash2, Calendar, Tag, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ParsedTransaction {
  amount: number;
  type: "income" | "expense";
  description: string;
  category_id: string | null;
  date: string;
}

export default function DiaryTransactionInput() {
  const { addTransaction } = useTransactions();
  const { categories } = useCategories();

  const [text, setText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedTransaction[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleParse = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text describing your transactions.");
      return;
    }

    try {
      setIsParsing(true);
      const res = await api.ai.parseDiary(text);
      if (!res.transactions || res.transactions.length === 0) {
        toast.warning("No transactions could be extracted. Try including amounts like '$25 for dinner'");
        return;
      }
      setParsedItems(res.transactions);
      toast.success(`Extracted ${res.transactions.length} transaction${res.transactions.length > 1 ? "s" : ""}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse text");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveAll = async () => {
    if (parsedItems.length === 0) return;

    try {
      setIsSaving(true);
      for (const item of parsedItems) {
        await addTransaction({
          amount: item.amount,
          type: item.type,
          description: item.description,
          category_id: item.category_id,
          date: item.date,
        });
      }
      toast.success(`Successfully saved ${parsedItems.length} transactions!`);
      setText("");
      setParsedItems([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to save transactions");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof ParsedTransaction, value: any) => {
    setParsedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-sky-500" />
          Smart AI Diary & Receipt Parser
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Paste your day's diary entry, receipt notes, or multiple expenses in free-form English
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm">
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Example: Spent $45.50 on groceries at Walmart, paid $12.00 for Uber to office, earned $350 from freelance design project."
          className="w-full p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />

        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-400" />
            AI extracts amounts, categories, types, and descriptions automatically
          </div>
          <button
            onClick={handleParse}
            disabled={isParsing || !text.trim()}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 hover:bg-primary-500 active:scale-[0.98] text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isParsing ? "Extracting..." : "Parse Transactions"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Extracted Preview List */}
      <AnimatePresence>
        {parsedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Extracted Transactions ({parsedItems.length})
              </h3>
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save All to Account"}
              </button>
            </div>

            <div className="space-y-3">
              {parsedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between"
                >
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                      value={item.type}
                      onChange={(e) => handleUpdateItem(idx, "type", e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>

                    <div className="relative flex-1 md:w-36">
                      <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => handleUpdateItem(idx, "amount", parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(idx, "description", e.target.value)}
                    placeholder="Description"
                    className="w-full md:flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <select
                      value={item.category_id || ""}
                      onChange={(e) => handleUpdateItem(idx, "category_id", e.target.value || null)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 max-w-[140px]"
                    >
                      <option value="">Select Category</option>
                      {categories
                        .filter((c) => c.type === item.type)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
