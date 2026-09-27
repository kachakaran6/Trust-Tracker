import { Router, Response } from "express";
import { query } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// GET /api/budgets
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

    const result = await query(
      `SELECT b.id, b.user_id, b.category_id, b.amount, b.month, b.created_at,
              json_build_object(
                'id', c.id,
                'name', c.name,
                'type', c.type,
                'color', c.color,
                'icon', c.icon
              ) as category,
              COALESCE(SUM(t.amount), 0) as spent
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t ON t.category_id = b.category_id 
                               AND t.user_id = b.user_id 
                               AND to_char(t.date, 'YYYY-MM') = b.month
                               AND t.type = 'expense'
       WHERE b.user_id = $1 AND b.month = $2
       GROUP BY b.id, b.user_id, b.category_id, b.amount, b.month, b.created_at, c.id, c.name, c.type, c.color, c.icon
       ORDER BY b.amount DESC`,
      [userId, month]
    );

    const mapped = result.rows.map((r) => ({
      ...r,
      amount: parseFloat(r.amount),
      spent: parseFloat(r.spent),
      remaining: Math.max(0, parseFloat(r.amount) - parseFloat(r.spent)),
      percentage: parseFloat(r.amount) > 0 ? Math.min(100, (parseFloat(r.spent) / parseFloat(r.amount)) * 100) : 0,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Fetch budgets error:", err);
    res.status(500).json({ error: "Failed to fetch budgets." });
  }
});

// POST /api/budgets (Upsert)
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { category_id, amount, month } = req.body;

    if (!category_id || !amount || !month) {
      res.status(400).json({ error: "category_id, amount, and month (YYYY-MM) are required." });
      return;
    }

    const result = await query(
      `INSERT INTO budgets (user_id, category_id, amount, month)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, category_id, month)
       DO UPDATE SET amount = EXCLUDED.amount
       RETURNING id, user_id, category_id, amount, month, created_at`,
      [userId, category_id, parseFloat(amount), month]
    );

    const budget = result.rows[0];
    res.status(201).json({
      ...budget,
      amount: parseFloat(budget.amount),
    });
  } catch (err) {
    console.error("Save budget error:", err);
    res.status(500).json({ error: "Failed to save budget." });
  }
});

// DELETE /api/budgets/:id
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await query(
      "DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Budget not found." });
      return;
    }

    res.json({ message: "Budget deleted successfully." });
  } catch (err) {
    console.error("Delete budget error:", err);
    res.status(500).json({ error: "Failed to delete budget." });
  }
});

export default router;
