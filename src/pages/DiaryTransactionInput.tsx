/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { useTransactions } from "../contexts/TransactionsContext";
import { useCategories } from "../contexts/CategoriesContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { div } from "@tensorflow/tfjs";

export default function DiaryTransactionInput() {
  const { addTransaction } = useTransactions();
  const { categories } = useCategories();
  const { user } = useAuth();

  const [entry, setEntry] = useState("");
  const [parsedEntries, setParsedEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const miscCategoryId = categories.find(
    (c) => c.name.toLowerCase() === "miscellaneous"
  )?.id;

  // Keyword to category map for auto-categorization
  const keywordCategoryMap: Record<string, string> = {};
  categories.forEach((c) => {
    keywordCategoryMap[c.name.toLowerCase()] = c.id;
  });

  // Enhanced parser for multi-entries and auto-category
  const parseEntry = (text: string) => {
    const entries = text.split(/,|and|\n/);
    const results: any[] = [];

    entries.forEach((entryText) => {
      const amountMatch = entryText.match(/([0-9]+(?:\.[0-9]{1,2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
      if (!amount) return;

      let type: "income" | "expense" =
        /income|salary|earned|freelance|received/i.test(entryText)
          ? "income"
          : "expense";
      if (/spent|bought|paid|expense/i.test(entryText)) type = "expense";
      if (/returned|refunded|cancelled/i.test(entryText)) type = "expense";

      const description = entryText
        .replace(/([0-9]+(?:\.[0-9]{1,2})?)/, "")
        .trim();

      // Auto-assign category
      let category_id = miscCategoryId || null;
      for (const keyword of Object.keys(keywordCategoryMap)) {
        if (description.toLowerCase().includes(keyword)) {
          category_id = keywordCategoryMap[keyword];
          break;
        }
      }

      results.push({ type, amount, description, category_id });
    });

    return results;
  };

  const handleParse = () => {
    const results = parseEntry(entry);
    if (results.length === 0) {
      toast.error("Could not understand your entry");
      return;
    }
    setParsedEntries(results);
  };

  const handleSave = async (parsed: any) => {
    setLoading(true);
    try {
      await addTransaction({
        amount: parsed.amount,
        category_id: parsed.category_id || miscCategoryId,
        description: parsed.description,
        type: parsed.type,
        date: new Date().toISOString(),
      });
      toast.success(`Transaction added: ${parsed.description}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    for (const entry of parsedEntries) {
      await handleSave(entry);
    }
    setEntry("");
    setParsedEntries([]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Manual Entry
        </h1>
      </div>

      {/* Input Section */}
      <div
        className="max-w-4xl mx-auto p-6 rounded-2xl shadow-xl 
                bg-white/90 dark:bg-gray-900/90 
                backdrop-blur border border-gray-200 dark:border-gray-700 
                transition-colors duration-300"
      >
        <h2
          className="flex items-center gap-2 text-2xl font-bold 
                 text-gray-800 dark:text-gray-100 mb-4"
        >
          📝 Transaction Entry
        </h2>

        <textarea
          className="w-full border border-gray-300 dark:border-gray-700 
               rounded-xl p-4 
               bg-gray-50 dark:bg-gray-800 
               text-gray-800 dark:text-gray-200 
               focus:ring-2 focus:ring-blue-500 focus:outline-none 
               resize-none min-h-[120px] shadow-sm 
               placeholder-gray-400 dark:placeholder-gray-500
               transition-colors duration-300"
          placeholder="e.g. Bought groceries for 50 and coffee 5, Received salary 2000"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
        />

        <button
          onClick={handleParse}
          className="mt-5 w-full py-3 
               bg-gradient-to-r from-blue-600 to-indigo-600 
               hover:from-blue-700 hover:to-indigo-700 
               text-white font-semibold rounded-xl shadow-lg 
               transform transition hover:scale-[1.02] active:scale-[0.98]"
        >
          🚀 Parse Transactions
        </button>
      </div>

      {/* Parsed Transactions */}
      {parsedEntries.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Income */}
          <div className="p-4 rounded-xl shadow bg-green-50 border border-green-200">
            <h3 className="text-lg font-semibold mb-3 text-green-700">
              Income
            </h3>
            <div className="space-y-3">
              {parsedEntries
                .filter((p) => p.type === "income")
                .map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg bg-white shadow-sm"
                  >
                    <p className="font-bold text-green-700">₹ {p.amount}</p>
                    <p className="text-sm text-gray-700">{p.description}</p>
                    <p className="text-xs text-gray-500">
                      Category:{" "}
                      {categories.find((c) => c.id === p.category_id)?.name ||
                        "Miscellaneous"}
                    </p>
                    <button
                      disabled={loading}
                      onClick={() => handleSave(p)}
                      className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition"
                    >
                      Save
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Expense */}
          <div className="p-4 rounded-xl shadow bg-red-50 border border-red-200">
            <h3 className="text-lg font-semibold mb-3 text-red-700">Expense</h3>
            <div className="space-y-3">
              {parsedEntries
                .filter((p) => p.type === "expense")
                .map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg bg-white shadow-sm"
                  >
                    <p className="font-bold text-red-700">₹ {p.amount}</p>
                    <p className="text-sm text-gray-700">{p.description}</p>
                    <p className="text-xs text-gray-500">
                      Category:{" "}
                      {categories.find((c) => c.id === p.category_id)?.name ||
                        "Miscellaneous"}
                    </p>
                    <button
                      disabled={loading}
                      onClick={() => handleSave(p)}
                      className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                    >
                      Save
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Save All Button */}
      {parsedEntries.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleSaveAll}
            disabled={loading}
            className="mt-6 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
          >
            Save All Transactions
          </button>
        </div>
      )}

      <footer className="max-w-4xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400 pt-8 border-t border-gray-200 dark:border-gray-700 mt-10">
        ⚠️ This page is still under{" "}
        <span className="font-semibold">testing</span>. Features may change or
        break unexpectedly.
      </footer>
    </div>
  );
}
