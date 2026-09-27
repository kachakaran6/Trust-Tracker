import { Router, Response } from "express";
import { query } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// GET /api/transactions
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { month, category_id, type, search, limit, offset, sort_by, order } = req.query;

    let queryText = `
      SELECT t.id, t.user_id, t.amount, t.type, t.category_id, t.description, t.date, t.created_at,
             json_build_object(
               'id', c.id,
               'name', c.name,
               'type', c.type,
               'color', c.color,
               'icon', c.icon
             ) as category
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (month && typeof month === "string") {
      queryText += ` AND to_char(t.date, 'YYYY-MM') = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    if (category_id && typeof category_id === "string") {
      queryText += ` AND t.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (type && (type === "income" || type === "expense")) {
      queryText += ` AND t.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (search && typeof search === "string") {
      queryText += ` AND t.description ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const sortField = sort_by === "amount" ? "t.amount" : "t.date";
    const sortDir = order === "asc" ? "ASC" : "DESC";
    queryText += ` ORDER BY ${sortField} ${sortDir}, t.created_at DESC`;

    if (limit) {
      queryText += ` LIMIT $${paramIndex}`;
      params.push(parseInt(limit as string, 10));
      paramIndex++;
    }

    if (offset) {
      queryText += ` OFFSET $${paramIndex}`;
      params.push(parseInt(offset as string, 10));
      paramIndex++;
    }

    const result = await query(queryText, params);
    
    // Map category null if category_id is null
    const mapped = result.rows.map((row) => ({
      ...row,
      amount: parseFloat(row.amount),
      category: row.category_id ? row.category : null,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Fetch transactions error:", err);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
});

// GET /api/transactions/summary/monthly
router.get("/summary/monthly", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

    const totalsResult = await query(
      `SELECT 
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
       FROM transactions
       WHERE user_id = $1 AND to_char(date, 'YYYY-MM') = $2`,
      [userId, month]
    );

    const categoryBreakdown = await query(
      `SELECT 
         t.category_id,
         COALESCE(c.name, 'Uncategorized') as category_name,
         c.color,
         c.icon,
         SUM(t.amount) as total,
         COUNT(t.id) as count
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND to_char(t.date, 'YYYY-MM') = $2 AND t.type = 'expense'
       GROUP BY t.category_id, c.name, c.color, c.icon
       ORDER BY total DESC`,
      [userId, month]
    );

    const totalIncome = parseFloat(totalsResult.rows[0].total_income);
    const totalExpense = parseFloat(totalsResult.rows[0].total_expense);

    res.json({
      month,
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      categories: categoryBreakdown.rows.map((r) => ({
        ...r,
        total: parseFloat(r.total),
        count: parseInt(r.count, 10),
      })),
    });
  } catch (err) {
    console.error("Monthly summary error:", err);
    res.status(500).json({ error: "Failed to compute monthly summary." });
  }
});

// POST /api/transactions
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { amount, type, category_id, description, date } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      res.status(400).json({ error: "Amount must be a positive number." });
      return;
    }

    if (!type || (type !== "income" && type !== "expense")) {
      res.status(400).json({ error: "Type must be either 'income' or 'expense'." });
      return;
    }

    const txDate = date ? new Date(date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

    const result = await query(
      `INSERT INTO transactions (user_id, amount, type, category_id, description, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, amount, type, category_id, description, date, created_at`,
      [userId, parseFloat(amount), type, category_id || null, description || "", txDate]
    );

    const created = result.rows[0];
    res.status(201).json({
      ...created,
      amount: parseFloat(created.amount),
    });
  } catch (err) {
    console.error("Create transaction error:", err);
    res.status(500).json({ error: "Failed to create transaction." });
  }
});

// PUT /api/transactions/:id
router.put("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount, type, category_id, description, date } = req.body;

    const txDate = date ? new Date(date).toISOString().slice(0, 10) : undefined;

    const result = await query(
      `UPDATE transactions
       SET amount = COALESCE($1, amount),
           type = COALESCE($2, type),
           category_id = COALESCE($3, category_id),
           description = COALESCE($4, description),
           date = COALESCE($5, date)
       WHERE id = $6 AND user_id = $7
       RETURNING id, user_id, amount, type, category_id, description, date, created_at`,
      [amount !== undefined ? parseFloat(amount) : null, type, category_id, description, txDate, id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Transaction not found." });
      return;
    }

    const updated = result.rows[0];
    res.json({
      ...updated,
      amount: parseFloat(updated.amount),
    });
  } catch (err) {
    console.error("Update transaction error:", err);
    res.status(500).json({ error: "Failed to update transaction." });
  }
});

// DELETE /api/transactions/:id
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await query(
      "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Transaction not found." });
      return;
    }

    res.json({ message: "Transaction deleted successfully." });
  } catch (err) {
    console.error("Delete transaction error:", err);
    res.status(500).json({ error: "Failed to delete transaction." });
  }
});

export default router;
