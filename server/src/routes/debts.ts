import { Router, Response } from "express";
import { query } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// GET /api/debts - List all personal debts & summary stats
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT d.*,
              COALESCE((SELECT SUM(amount) FROM debt_payments WHERE debt_id = d.id), 0) as calculated_paid,
              COALESCE((SELECT COUNT(*) FROM debt_payments WHERE debt_id = d.id), 0) as payment_count
       FROM debts d
       WHERE d.user_id = $1
       ORDER BY d.created_at DESC`,
      [userId]
    );

    const nowStr = new Date().toISOString().slice(0, 10);

    const debts = result.rows.map((d) => {
      const amount = parseFloat(d.amount);
      const paid = Math.max(parseFloat(d.amount_paid), parseFloat(d.calculated_paid));
      const remaining = Math.max(0, Math.round((amount - paid) * 100) / 100);
      const progressPercent = amount > 0 ? Math.min(100, Math.round((paid / amount) * 100)) : 100;

      let computedStatus = d.status;
      if (remaining <= 0) {
        computedStatus = "settled";
      } else if (paid > 0) {
        computedStatus = "partially_paid";
      } else if (d.due_date && d.due_date < nowStr) {
        computedStatus = "overdue";
      } else {
        computedStatus = "active";
      }

      return {
        ...d,
        amount,
        amount_paid: paid,
        remaining_balance: remaining,
        progress_percent: progressPercent,
        status: computedStatus,
        payment_count: parseInt(d.payment_count, 10),
      };
    });

    const iOweDebts = debts.filter((d) => d.type === "i_owe" && d.status !== "settled");
    const owedToMeDebts = debts.filter((d) => d.type === "owed_to_me" && d.status !== "settled");

    const totalIOwe = iOweDebts.reduce((sum, d) => sum + d.remaining_balance, 0);
    const totalOwedToMe = owedToMeDebts.reduce((sum, d) => sum + d.remaining_balance, 0);

    const summary = {
      totalIOwe: Math.round(totalIOwe * 100) / 100,
      totalOwedToMe: Math.round(totalOwedToMe * 100) / 100,
      netBalance: Math.round((totalOwedToMe - totalIOwe) * 100) / 100,
      activeCount: debts.filter((d) => d.status !== "settled").length,
      settledCount: debts.filter((d) => d.status === "settled").length,
      overdueCount: debts.filter((d) => d.status === "overdue").length,
    };

    res.json({ debts, summary });
  } catch (err) {
    console.error("Fetch debts error:", err);
    res.status(500).json({ error: "Failed to fetch debts." });
  }
});

// POST /api/debts - Create new debt entry
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      counterparty_name,
      counterparty_contact = "",
      type,
      amount,
      currency = "USD",
      due_date = null,
      notes = "",
    } = req.body;

    if (!counterparty_name || !amount || parseFloat(amount) <= 0) {
      res.status(400).json({ error: "Counterparty name and positive amount are required." });
      return;
    }

    const result = await query(
      `INSERT INTO debts (
        user_id, counterparty_name, counterparty_contact, type,
        amount, amount_paid, currency, due_date, status, notes
      ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, 'active', $8)
      RETURNING *`,
      [
        userId,
        counterparty_name.trim(),
        counterparty_contact ? counterparty_contact.trim() : "",
        type || "i_owe",
        parseFloat(amount),
        currency,
        due_date || null,
        notes,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create debt error:", err);
    res.status(500).json({ error: "Failed to create debt." });
  }
});

// GET /api/debts/:id - Get debt details with payment history
router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const debtResult = await query("SELECT * FROM debts WHERE id = $1 AND user_id = $2", [id, userId]);
    if (debtResult.rows.length === 0) {
      res.status(404).json({ error: "Debt entry not found." });
      return;
    }

    const paymentsResult = await query(
      "SELECT * FROM debt_payments WHERE debt_id = $1 ORDER BY payment_date DESC, created_at DESC",
      [id]
    );

    const debt = debtResult.rows[0];
    const amount = parseFloat(debt.amount);
    const payments = paymentsResult.rows.map((p) => ({ ...p, amount: parseFloat(p.amount) }));
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, Math.round((amount - totalPaid) * 100) / 100);

    res.json({
      debt: {
        ...debt,
        amount,
        amount_paid: totalPaid,
        remaining_balance: remaining,
        status: remaining <= 0 ? "settled" : totalPaid > 0 ? "partially_paid" : "active",
      },
      payments,
    });
  } catch (err) {
    console.error("Fetch debt detail error:", err);
    res.status(500).json({ error: "Failed to fetch debt." });
  }
});

// POST /api/debts/:id/payments - Record a repayment
router.post("/:id/payments", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount, payment_date, notes = "", record_in_transactions = false } = req.body;

    const debtCheck = await query("SELECT * FROM debts WHERE id = $1 AND user_id = $2", [id, userId]);
    if (debtCheck.rows.length === 0) {
      res.status(404).json({ error: "Debt entry not found." });
      return;
    }

    const debt = debtCheck.rows[0];
    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) {
      res.status(400).json({ error: "Payment amount must be greater than zero." });
      return;
    }

    const pDate = payment_date ? new Date(payment_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

    const paymentRes = await query(
      `INSERT INTO debt_payments (debt_id, amount, payment_date, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, payAmount, pDate, notes]
    );

    // Calculate new total paid
    const sumRes = await query("SELECT SUM(amount) as total FROM debt_payments WHERE debt_id = $1", [id]);
    const totalPaid = parseFloat(sumRes.rows[0].total || 0);
    const totalPrincipal = parseFloat(debt.amount);
    const newStatus = totalPaid >= totalPrincipal ? "settled" : "partially_paid";

    await query(
      "UPDATE debts SET amount_paid = $1, status = $2 WHERE id = $3",
      [totalPaid, newStatus, id]
    );

    // Optionally record in transactions
    if (record_in_transactions) {
      const txType = debt.type === "i_owe" ? "expense" : "income";
      const txDesc = `Debt Repayment: ${debt.counterparty_name} (${debt.type === "i_owe" ? "Paid back" : "Received"})`;
      await query(
        `INSERT INTO transactions (user_id, amount, type, description, date)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, payAmount, txType, txDesc, pDate]
      );
    }

    res.status(201).json({
      message: "Payment recorded successfully",
      payment: paymentRes.rows[0],
      totalPaid,
      status: newStatus,
    });
  } catch (err) {
    console.error("Record debt payment error:", err);
    res.status(500).json({ error: "Failed to record repayment." });
  }
});

// DELETE /api/debts/:id - Delete debt
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await query("DELETE FROM debts WHERE id = $1 AND user_id = $2 RETURNING id", [id, userId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Debt not found." });
      return;
    }

    res.json({ message: "Debt entry deleted successfully." });
  } catch (err) {
    console.error("Delete debt error:", err);
    res.status(500).json({ error: "Failed to delete debt." });
  }
});

export default router;
