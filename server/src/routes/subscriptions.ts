import { Router, Response } from "express";
import { query } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Helper: Calculate normalized monthly and annual costs
function normalizeCosts(cost: number, cycle: string): { monthly: number; yearly: number } {
  let monthly = 0;
  let yearly = 0;
  switch (cycle) {
    case "weekly":
      monthly = cost * 4.3333;
      yearly = cost * 52;
      break;
    case "monthly":
      monthly = cost;
      yearly = cost * 12;
      break;
    case "quarterly":
      monthly = cost / 3;
      yearly = cost * 4;
      break;
    case "yearly":
      monthly = cost / 12;
      yearly = cost;
      break;
    default:
      monthly = cost;
      yearly = cost * 12;
  }
  return {
    monthly: Math.round(monthly * 100) / 100,
    yearly: Math.round(yearly * 100) / 100,
  };
}

// GET /api/subscriptions - List all user subscriptions & summary
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT * FROM subscriptions
       WHERE user_id = $1
       ORDER BY next_billing_date ASC, created_at DESC`,
      [userId]
    );

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    let totalMonthlyBurn = 0;
    let totalAnnualBurn = 0;
    const categoryTotals: Record<string, number> = {};

    const subscriptions = result.rows.map((sub) => {
      const cost = parseFloat(sub.cost);
      const { monthly, yearly } = normalizeCosts(cost, sub.billing_cycle);

      if (sub.status === "active") {
        totalMonthlyBurn += monthly;
        totalAnnualBurn += yearly;
        const cat = sub.category || "General";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + monthly;
      }

      // Days until next renewal
      const nextDate = new Date(sub.next_billing_date);
      const diffTime = nextDate.getTime() - now.getTime();
      const daysUntilRenewal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...sub,
        cost,
        monthly_cost: monthly,
        yearly_cost: yearly,
        days_until_renewal: daysUntilRenewal,
        is_renewing_soon: sub.status === "active" && daysUntilRenewal >= 0 && daysUntilRenewal <= 7,
      };
    });

    const summary = {
      totalMonthlyBurn: Math.round(totalMonthlyBurn * 100) / 100,
      totalAnnualBurn: Math.round(totalAnnualBurn * 100) / 100,
      activeCount: subscriptions.filter((s) => s.status === "active").length,
      pausedCount: subscriptions.filter((s) => s.status === "paused").length,
      renewingIn7DaysCount: subscriptions.filter((s) => s.is_renewing_soon).length,
      categoryBreakdown: Object.entries(categoryTotals).map(([name, total]) => ({
        name,
        monthlyTotal: Math.round(total * 100) / 100,
      })),
    };

    res.json({ subscriptions, summary });
  } catch (err) {
    console.error("Fetch subscriptions error:", err);
    res.status(500).json({ error: "Failed to fetch subscriptions." });
  }
});

// POST /api/subscriptions - Create new subscription
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      name,
      category = "General",
      cost,
      currency = "USD",
      billing_cycle = "monthly",
      next_billing_date,
      payment_method = "Card",
      icon = "Film",
      color = "#6366F1",
      status = "active",
      reminder_days = 3,
      is_trial = false,
      trial_ends_at = null,
      notes = "",
    } = req.body;

    if (!name || cost === undefined || !next_billing_date) {
      res.status(400).json({ error: "Name, cost, and next billing date are required." });
      return;
    }

    const result = await query(
      `INSERT INTO subscriptions (
        user_id, name, category, cost, currency, billing_cycle,
        next_billing_date, payment_method, icon, color, status,
        reminder_days, is_trial, trial_ends_at, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        userId,
        name.trim(),
        category.trim(),
        parseFloat(cost),
        currency,
        billing_cycle,
        next_billing_date,
        payment_method,
        icon,
        color,
        status,
        parseInt(reminder_days, 10) || 3,
        Boolean(is_trial),
        trial_ends_at || null,
        notes,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create subscription error:", err);
    res.status(500).json({ error: "Failed to create subscription." });
  }
});

// PUT /api/subscriptions/:id - Update subscription
router.put("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      name,
      category,
      cost,
      currency,
      billing_cycle,
      next_billing_date,
      payment_method,
      icon,
      color,
      status,
      reminder_days,
      is_trial,
      trial_ends_at,
      notes,
    } = req.body;

    const result = await query(
      `UPDATE subscriptions SET
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        cost = COALESCE($3, cost),
        currency = COALESCE($4, currency),
        billing_cycle = COALESCE($5, billing_cycle),
        next_billing_date = COALESCE($6, next_billing_date),
        payment_method = COALESCE($7, payment_method),
        icon = COALESCE($8, icon),
        color = COALESCE($9, color),
        status = COALESCE($10, status),
        reminder_days = COALESCE($11, reminder_days),
        is_trial = COALESCE($12, is_trial),
        trial_ends_at = $13,
        notes = COALESCE($14, notes)
       WHERE id = $15 AND user_id = $16
       RETURNING *`,
      [
        name ? name.trim() : null,
        category ? category.trim() : null,
        cost !== undefined ? parseFloat(cost) : null,
        currency,
        billing_cycle,
        next_billing_date,
        payment_method,
        icon,
        color,
        status,
        reminder_days !== undefined ? parseInt(reminder_days, 10) : null,
        is_trial !== undefined ? Boolean(is_trial) : null,
        trial_ends_at || null,
        notes !== undefined ? notes : null,
        id,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Subscription not found." });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update subscription error:", err);
    res.status(500).json({ error: "Failed to update subscription." });
  }
});

// POST /api/subscriptions/:id/renew - Quick Renew
router.post("/:id/renew", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { record_in_transactions = false } = req.body;

    const subCheck = await query("SELECT * FROM subscriptions WHERE id = $1 AND user_id = $2", [id, userId]);
    if (subCheck.rows.length === 0) {
      res.status(404).json({ error: "Subscription not found." });
      return;
    }

    const sub = subCheck.rows[0];
    const currentNext = new Date(sub.next_billing_date);
    const updatedDate = new Date(currentNext);

    switch (sub.billing_cycle) {
      case "weekly":
        updatedDate.setDate(updatedDate.getDate() + 7);
        break;
      case "monthly":
        updatedDate.setMonth(updatedDate.getMonth() + 1);
        break;
      case "quarterly":
        updatedDate.setMonth(updatedDate.getMonth() + 3);
        break;
      case "yearly":
        updatedDate.setFullYear(updatedDate.getFullYear() + 1);
        break;
      default:
        updatedDate.setMonth(updatedDate.getMonth() + 1);
    }

    const newDateStr = updatedDate.toISOString().slice(0, 10);
    const result = await query(
      "UPDATE subscriptions SET next_billing_date = $1 WHERE id = $2 RETURNING *",
      [newDateStr, id]
    );

    if (record_in_transactions) {
      await query(
        `INSERT INTO transactions (user_id, amount, type, description, date)
         VALUES ($1, $2, 'expense', $3, $4)`,
        [userId, parseFloat(sub.cost), `Subscription renewal: ${sub.name}`, new Date().toISOString().slice(0, 10)]
      );
    }

    res.json({
      message: "Subscription renewed successfully",
      subscription: result.rows[0],
    });
  } catch (err) {
    console.error("Renew subscription error:", err);
    res.status(500).json({ error: "Failed to renew subscription." });
  }
});

// DELETE /api/subscriptions/:id - Delete subscription
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await query("DELETE FROM subscriptions WHERE id = $1 AND user_id = $2 RETURNING id", [id, userId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Subscription not found." });
      return;
    }

    res.json({ message: "Subscription deleted successfully." });
  } catch (err) {
    console.error("Delete subscription error:", err);
    res.status(500).json({ error: "Failed to delete subscription." });
  }
});

export default router;
