import { Router, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// POST /api/ai/parse-diary
router.post("/parse-diary", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { text } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "Text entry is required." });
      return;
    }

    // Get user categories for matching
    const catResult = await query(
      "SELECT id, name, type FROM categories WHERE user_id = $1",
      [userId]
    );
    const categories = catResult.rows;

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are a financial transaction extractor.
Extract all transactions from this natural language text: "${text.trim()}".
Available user categories: ${JSON.stringify(categories.map((c) => ({ id: c.id, name: c.name, type: c.type })))}.
Return ONLY a valid JSON array of objects with the following schema:
[
  {
    "amount": number (positive),
    "type": "income" | "expense",
    "description": string,
    "category_id": string (must match one of available category ids, or null if none match),
    "date": string (YYYY-MM-DD format, default to today '${new Date().toISOString().slice(0, 10)}')
  }
]
`;
        const aiResponse = await model.generateContent(prompt);
        const responseText = aiResponse.response.text();
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          res.json({ transactions: parsed, engine: "gemini" });
          return;
        }
      } catch (aiErr) {
        console.warn("Gemini AI parse failed, falling back to rule-based parser:", aiErr);
      }
    }

    // Fallback Rule-Based Parser
    const lines = text.split(/,|\n|and then|and/i);
    const results: any[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const amountMatch = line.match(/(?:\$|€|£|₹|Rs\.?\s*)?([0-9]+(?:\.[0-9]{1,2})?)/);
      if (!amountMatch) continue;

      const amount = parseFloat(amountMatch[1]);
      if (isNaN(amount) || amount <= 0) continue;

      let type: "income" | "expense" = "expense";
      if (/income|salary|earned|freelance|received|bonus|dividend/i.test(line)) {
        type = "income";
      }

      let description = line
        .replace(/(?:\$|€|£|₹|Rs\.?\s*)?([0-9]+(?:\.[0-9]{1,2})?)/g, "")
        .replace(/\b(for|on|at|spent|paid|bought|received)\b/gi, "")
        .trim();

      if (!description) description = type === "income" ? "Income" : "Expense";

      // Match category
      let category_id: string | null = null;
      for (const cat of categories) {
        if (line.toLowerCase().includes(cat.name.toLowerCase())) {
          category_id = cat.id;
          break;
        }
      }

      results.push({
        amount,
        type,
        description: description.charAt(0).toUpperCase() + description.slice(1),
        category_id,
        date: new Date().toISOString().slice(0, 10),
      });
    }

    res.json({ transactions: results, engine: "rule-based" });
  } catch (err) {
    console.error("AI diary parse error:", err);
    res.status(500).json({ error: "Failed to parse text entries." });
  }
});

export default router;
