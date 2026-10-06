import { useState, useEffect } from "react";
import { useTransactions } from "../contexts/TransactionsContext";
import { useCategories } from "../contexts/CategoriesContext";
import { api } from "../lib/api";
import { formatCategory } from "../lib/format";
import { toast } from "sonner";
import { usePageHeader } from "../contexts/PageHeaderContext";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button, IconButton } from "../components/ui/Button";
import { Textarea, Input, Select } from "../components/ui/Input";
import { Icons } from "../components/ui/icons";

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
  const { setPageHeader } = usePageHeader();

  useEffect(() => {
    setPageHeader("Diary Entry");
  }, [setPageHeader]);

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
        toast.warning("No transactions could be extracted. Include amounts like 'Spent ₹450 for groceries'");
        return;
      }
      setParsedItems(res.transactions);
      toast.success(`Extracted ${res.transactions.length} transaction${res.transactions.length > 1 ? "s" : ""}!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to parse text";
      toast.error(message);
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
      toast.success(`Saved ${parsedItems.length} transactions!`);
      setText("");
      setParsedItems([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save transactions";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof ParsedTransaction,
    value: string | number | null
  ) => {
    setParsedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Diary & Natural Language Entry"
        description="Type or paste unstructured daily logs, receipts, or notes. The system extracts amounts, categories, dates, and types automatically."
      />

      {/* Input Box */}
      <Card>
        <div className="space-y-4">
          <Textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Example: Spent ₹450 on groceries at supermarket, paid ₹120 for auto to office, received ₹25,000 freelance design milestone."
          />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
            <span className="text-xs text-[var(--text-muted)]">
              Paste multi-line text or single paragraph sentences.
            </span>
            <Button
              variant="primary"
              onClick={handleParse}
              disabled={isParsing || !text.trim()}
              isLoading={isParsing}
              icon={<Icons.ArrowRight size={16} />}
            >
              Parse Transactions
            </Button>
          </div>
        </div>
      </Card>

      {/* Extracted Preview List */}
      {parsedItems.length > 0 && (
        <Card
          title={`Extracted Transactions (${parsedItems.length})`}
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<Icons.Check size={16} />}
              onClick={handleSaveAll}
              isLoading={isSaving}
            >
              Save All to Ledger
            </Button>
          }
        >
          <div className="space-y-3 pt-2">
            {parsedItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-sm flex flex-col md:flex-row gap-3 items-center justify-between"
              >
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <Select
                    value={item.type}
                    onChange={(e) =>
                      handleUpdateItem(idx, "type", e.target.value as "income" | "expense")
                    }
                    className="w-28 text-xs"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </Select>

                  <Input
                    type="number"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) =>
                      handleUpdateItem(idx, "amount", parseFloat(e.target.value) || 0)
                    }
                    className="w-28 text-xs"
                  />
                </div>

                <div className="flex-1 w-full md:w-auto">
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      handleUpdateItem(idx, "description", e.target.value)
                    }
                    placeholder="Description"
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                  <Select
                    value={item.category_id || ""}
                    onChange={(e) =>
                      handleUpdateItem(idx, "category_id", e.target.value || null)
                    }
                    className="w-36 text-xs"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {formatCategory(c.name)}
                      </option>
                    ))}
                  </Select>

                  <Input
                    type="date"
                    value={item.date ? item.date.slice(0, 10) : ""}
                    onChange={(e) => handleUpdateItem(idx, "date", e.target.value)}
                    className="w-32 text-xs"
                  />

                  <IconButton
                    aria-label="Remove extracted item"
                    variant="danger-ghost"
                    size="sm"
                    icon={<Icons.Delete size={15} />}
                    onClick={() => handleRemoveItem(idx)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
