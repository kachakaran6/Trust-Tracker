import { Router, Response } from "express";
import crypto from "crypto";
import { query } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Helper to generate a 6-character alphanumeric uppercase code
function generateGroupCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

// GET /api/groups - List all groups user is a member of
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await query(
      `SELECT g.id, g.name, g.description, g.code, g.currency, g.created_by, g.created_at,
              gm.role as my_role,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
              COALESCE((SELECT SUM(amount) FROM group_transactions WHERE group_id = g.id AND type = 'expense'), 0) as total_spent
       FROM groups g
       INNER JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [userId]
    );

    const mapped = result.rows.map((r) => ({
      ...r,
      member_count: parseInt(r.member_count, 10),
      total_spent: parseFloat(r.total_spent),
      currency: r.currency || "USD",
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Fetch groups error:", err);
    res.status(500).json({ error: "Failed to fetch groups." });
  }
});

// GET /api/groups/invite/:code - Preview group by invite code (can be called by any authenticated user or for preview)
router.get("/invite/:code", async (req, res): Promise<void> => {
  try {
    const { code } = req.params;
    if (!code) {
      res.status(400).json({ error: "Invite code is required." });
      return;
    }

    const result = await query(
      `SELECT g.id, g.name, g.description, g.code, g.currency, g.created_at,
              u.name as creator_name,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM groups g
       JOIN users u ON u.id = g.created_by
       WHERE g.code = $1`,
      [code.trim().toUpperCase()]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Invalid group invite link or code." });
      return;
    }

    const group = result.rows[0];
    res.json({
      ...group,
      member_count: parseInt(group.member_count, 10),
    });
  } catch (err) {
    console.error("Invite preview error:", err);
    res.status(500).json({ error: "Failed to load invite preview." });
  }
});

// POST /api/groups - Create a new group
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, description, currency } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: "Group name is required." });
      return;
    }

    // Determine group currency: user's choice, user's default, or USD
    const userRes = await query("SELECT currency FROM users WHERE id = $1", [userId]);
    const groupCurrency = currency || userRes.rows[0]?.currency || "USD";

    let code = generateGroupCode();
    let isUnique = false;
    while (!isUnique) {
      const check = await query("SELECT id FROM groups WHERE code = $1", [code]);
      if (check.rows.length === 0) isUnique = true;
      else code = generateGroupCode();
    }

    const groupResult = await query(
      `INSERT INTO groups (name, description, code, currency, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, code, currency, created_by, created_at`,
      [name.trim(), description || "", code, groupCurrency, userId]
    );

    const group = groupResult.rows[0];

    // Add creator as admin member
    await query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, 'admin')`,
      [group.id, userId]
    );

    // Seed default group categories
    const defaultCats = [
      { name: "Food & Dining", color: "#F59E0B", icon: "Utensils" },
      { name: "Rent & Stay", color: "#8B5CF6", icon: "Home" },
      { name: "Travel & Fuel", color: "#3B82F6", icon: "Car" },
      { name: "Groceries & Supplies", color: "#10B981", icon: "ShoppingCart" },
      { name: "Entertainment & Fun", color: "#EC4899", icon: "Film" },
      { name: "General / Other", color: "#64748B", icon: "Tag" },
    ];
    for (const cat of defaultCats) {
      await query(
        `INSERT INTO group_categories (group_id, name, color, icon)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (group_id, name) DO NOTHING`,
        [group.id, cat.name, cat.color, cat.icon]
      );
    }

    res.status(201).json(group);
  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ error: "Failed to create group." });
  }
});

// POST /api/groups/join - Join group by code
router.post("/join", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ error: "Group code is required." });
      return;
    }

    const groupResult = await query(
      "SELECT id, name, description, code, currency, created_by, created_at FROM groups WHERE code = $1",
      [code.trim().toUpperCase()]
    );

    if (groupResult.rows.length === 0) {
      res.status(404).json({ error: "Group not found with code: " + code });
      return;
    }

    const group = groupResult.rows[0];

    // Check if already a member
    const memberCheck = await query(
      "SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2",
      [group.id, userId]
    );

    if (memberCheck.rows.length > 0) {
      res.json({ message: "You are already a member of this group.", group });
      return;
    }

    await query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, 'member')`,
      [group.id, userId]
    );

    res.json({ message: "Joined group successfully!", group });
  } catch (err) {
    console.error("Join group error:", err);
    res.status(500).json({ error: "Failed to join group." });
  }
});

// GET /api/groups/split-requests/my - Get user's incoming and outgoing split requests across all groups
router.get("/split-requests/my", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT sr.id, sr.group_id, sr.group_transaction_id, sr.from_user_id, sr.to_user_id, sr.amount,
              sr.status, sr.payment_method, sr.notes, sr.paid_at, sr.created_at,
              u1.name as from_name, u1.email as from_email, u1.avatar_url as from_avatar,
              u2.name as to_name, u2.email as to_email, u2.avatar_url as to_avatar,
              gt.description as expense_description, gt.amount as expense_total_amount, gt.date as expense_date,
              g.name as group_name, g.currency as group_currency
       FROM group_split_requests sr
       JOIN users u1 ON u1.id = sr.from_user_id
       JOIN users u2 ON u2.id = sr.to_user_id
       JOIN group_transactions gt ON gt.id = sr.group_transaction_id
       JOIN groups g ON g.id = sr.group_id
       WHERE sr.to_user_id = $1 OR sr.from_user_id = $1
       ORDER BY sr.created_at DESC`,
      [userId]
    );

    const mapped = result.rows.map((r) => ({
      ...r,
      amount: parseFloat(r.amount),
      expense_total_amount: parseFloat(r.expense_total_amount),
      is_incoming: r.to_user_id === userId, // Current user owes this
      is_outgoing: r.from_user_id === userId, // Current user is owed this
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Fetch user split requests error:", err);
    res.status(500).json({ error: "Failed to fetch split requests." });
  }
});

// POST /api/groups/split-requests/:requestId/pay - Participant pays their split share
router.post("/split-requests/:requestId/pay", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { requestId } = req.params;
    const { payment_method = "upi", notes = "", date } = req.body;

    const reqResult = await query(
      `SELECT sr.*, gt.description as expense_description, gt.date as expense_date, g.name as group_name
       FROM group_split_requests sr
       JOIN group_transactions gt ON gt.id = sr.group_transaction_id
       JOIN groups g ON g.id = sr.group_id
       WHERE sr.id = $1`,
      [requestId]
    );

    if (reqResult.rows.length === 0) {
      res.status(404).json({ error: "Split request not found." });
      return;
    }

    const splitReq = reqResult.rows[0];

    // Check if user is recipient of the request or an admin of group
    if (splitReq.to_user_id !== userId) {
      const adminCheck = await query(
        "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2",
        [splitReq.group_id, userId]
      );
      if (adminCheck.rows.length === 0 || adminCheck.rows[0]?.role !== "admin") {
        res.status(403).json({ error: "Unauthorized to pay this request." });
        return;
      }
    }

    if (splitReq.status === "paid") {
      res.status(400).json({ error: "This split request is already marked as paid." });
      return;
    }

    const paymentDate = date ? new Date(date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const reqAmount = parseFloat(splitReq.amount);

    // 1. Record group settlement
    const settleResult = await query(
      `INSERT INTO group_settlements (group_id, from_user_id, to_user_id, amount, date, notes, payment_method, status, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', NOW())
       RETURNING id`,
      [
        splitReq.group_id,
        splitReq.to_user_id,
        splitReq.from_user_id,
        reqAmount,
        paymentDate,
        notes || `Paid split share for "${splitReq.expense_description}"`,
        payment_method,
      ]
    );

    const settleId = settleResult.rows[0]?.id;

    // 2. Mark split request as paid
    await query(
      `UPDATE group_split_requests
       SET status = 'paid', paid_at = NOW(), payment_method = $1, notes = $2, settlement_id = $3
       WHERE id = $4`,
      [payment_method, notes || "", settleId || null, requestId]
    );

    // 3. DEDUCT PROPERLY FROM PAYER'S PERSONAL TRANSACTION (Do not create a duplicate transaction!)
    const payerPersonalTxRes = await query(
      `SELECT * FROM transactions
       WHERE group_transaction_id = $1 AND user_id = $2`,
      [splitReq.group_transaction_id, splitReq.from_user_id]
    );

    if (payerPersonalTxRes.rows.length > 0) {
      const personalTx = payerPersonalTxRes.rows[0];
      const origAmount = parseFloat(personalTx.original_amount || personalTx.amount);
      const prevReceived = parseFloat(personalTx.split_received_amount || 0);
      const newReceived = Math.round((prevReceived + reqAmount) * 100) / 100;
      const newAmount = Math.max(0, Math.round((origAmount - newReceived) * 100) / 100);

      // Check if all other split requests for this group transaction are also paid
      const pendingCheck = await query(
        `SELECT COUNT(*) as pending_count
         FROM group_split_requests
         WHERE group_transaction_id = $1 AND status != 'paid' AND id != $2`,
        [splitReq.group_transaction_id, requestId]
      );
      const pendingCount = parseInt(pendingCheck.rows[0].pending_count, 10);
      const newSplitStatus = pendingCount === 0 ? "fully_settled" : "partially_settled";

      await query(
        `UPDATE transactions
         SET amount = $1, split_received_amount = $2, split_status = $3
         WHERE id = $4`,
        [newAmount, newReceived, newSplitStatus, personalTx.id]
      );
    }

    // 4. Record personal transaction for the participant (who just paid their share)
    await query(
      `INSERT INTO transactions (user_id, amount, original_amount, split_received_amount, split_status, type, description, date, group_id, group_transaction_id)
       VALUES ($1, $2, $2, 0, 'settled_share', 'expense', $3, $4, $5, $6)`,
      [
        splitReq.to_user_id,
        reqAmount,
        `Split Share: ${splitReq.expense_description} (${splitReq.group_name})`,
        paymentDate,
        splitReq.group_id,
        splitReq.group_transaction_id,
      ]
    );

    res.json({
      message: "Split share marked as paid successfully! Payer's transaction has been automatically deducted.",
      paidAmount: reqAmount,
    });
  } catch (err) {
    console.error("Pay split request error:", err);
    res.status(500).json({ error: "Failed to process split payment." });
  }
});

// POST /api/groups/split-requests/:requestId/accept - Participant acknowledges debt
router.post("/split-requests/:requestId/accept", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { requestId } = req.params;

    const result = await query(
      `UPDATE group_split_requests
       SET status = 'accepted'
       WHERE id = $1 AND to_user_id = $2 AND status = 'pending'
       RETURNING *`,
      [requestId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Pending split request not found or unauthorized." });
      return;
    }

    res.json({ message: "Split request accepted! You can pay whenever ready.", request: result.rows[0] });
  } catch (err) {
    console.error("Accept split error:", err);
    res.status(500).json({ error: "Failed to accept split request." });
  }
});

// POST /api/groups/split-requests/:requestId/decline - Participant disputes/declines split
router.post("/split-requests/:requestId/decline", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { requestId } = req.params;
    const { notes = "" } = req.body;

    const result = await query(
      `UPDATE group_split_requests
       SET status = 'declined', notes = $1
       WHERE id = $2 AND to_user_id = $3
       RETURNING *`,
      [notes, requestId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Split request not found or unauthorized." });
      return;
    }

    res.json({ message: "Split request declined.", request: result.rows[0] });
  } catch (err) {
    console.error("Decline split error:", err);
    res.status(500).json({ error: "Failed to decline split request." });
  }
});

// POST /api/groups/split-requests/:requestId/remind - Send a quick reminder
router.post("/split-requests/:requestId/remind", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { requestId } = req.params;

    const check = await query(
      `SELECT sr.*, u.name as to_name
       FROM group_split_requests sr
       JOIN users u ON u.id = sr.to_user_id
       WHERE sr.id = $1 AND sr.from_user_id = $2`,
      [requestId, userId]
    );

    if (check.rows.length === 0) {
      res.status(404).json({ error: "Split request not found or unauthorized." });
      return;
    }

    res.json({ message: `Payment reminder sent to ${check.rows[0].to_name || "member"}!` });
  } catch (err) {
    console.error("Remind split error:", err);
    res.status(500).json({ error: "Failed to send reminder." });
  }
});

// GET /api/groups/:groupId - Get group details & members
router.get("/:groupId", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { groupId } = req.params;

    // Check membership
    const memberCheck = await query(
      "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );

    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: "Access denied. You are not a member of this group." });
      return;
    }

    const groupResult = await query(
      "SELECT id, name, description, code, currency, created_by, created_at FROM groups WHERE id = $1",
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      res.status(404).json({ error: "Group not found." });
      return;
    }

    const membersResult = await query(
      `SELECT gm.id, gm.group_id, gm.user_id, gm.role, gm.joined_at,
              u.name, u.email, u.avatar_url, u.currency as user_currency
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = $1
       ORDER BY gm.joined_at ASC`,
      [groupId]
    );

    res.json({
      group: groupResult.rows[0],
      myRole: memberCheck.rows[0].role,
      members: membersResult.rows,
    });
  } catch (err) {
    console.error("Fetch group details error:", err);
    res.status(500).json({ error: "Failed to fetch group details." });
  }
});

// PATCH /api/groups/:groupId - Update group details (currency, name, description)
router.patch("/:groupId", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { groupId } = req.params;
    const { name, description, currency } = req.body;

    const memberCheck = await query(
      "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );

    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: "Access denied. You are not a member of this group." });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name !== undefined && name.trim()) {
      updates.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(description);
    }
    if (currency !== undefined && currency.trim()) {
      updates.push(`currency = $${idx++}`);
      values.push(currency.trim().toUpperCase());
    }

    if (updates.length === 0) {
      res.status(400).json({ error: "No fields to update." });
      return;
    }

    values.push(groupId);
    const updateQuery = `UPDATE groups SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`;
    const result = await query(updateQuery, values);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update group error:", err);
    res.status(500).json({ error: "Failed to update group." });
  }
});

// GET /api/groups/:groupId/split-requests - Fetch all split requests for a specific group
router.get("/:groupId/split-requests", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { groupId } = req.params;

    const memberCheck = await query("SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2", [groupId, userId]);
    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const result = await query(
      `SELECT sr.id, sr.group_id, sr.group_transaction_id, sr.from_user_id, sr.to_user_id, sr.amount,
              sr.status, sr.payment_method, sr.notes, sr.paid_at, sr.created_at,
              u1.name as from_name, u1.email as from_email, u1.avatar_url as from_avatar,
              u2.name as to_name, u2.email as to_email, u2.avatar_url as to_avatar,
              gt.description as expense_description, gt.amount as expense_total_amount, gt.date as expense_date,
              g.name as group_name, g.currency as group_currency
       FROM group_split_requests sr
       JOIN users u1 ON u1.id = sr.from_user_id
       JOIN users u2 ON u2.id = sr.to_user_id
       JOIN group_transactions gt ON gt.id = sr.group_transaction_id
       JOIN groups g ON g.id = sr.group_id
       WHERE sr.group_id = $1
       ORDER BY sr.created_at DESC`,
      [groupId]
    );

    const mapped = result.rows.map((r) => ({
      ...r,
      amount: parseFloat(r.amount),
      expense_total_amount: parseFloat(r.expense_total_amount),
      is_incoming: r.to_user_id === userId,
      is_outgoing: r.from_user_id === userId,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Fetch group split requests error:", err);
    res.status(500).json({ error: "Failed to fetch group split requests." });
  }
});

// GET /api/groups/:groupId/transactions - Fetch all group activity
router.get("/:groupId/transactions", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { groupId } = req.params;

    const memberCheck = await query("SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2", [groupId, userId]);
    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const result = await query(
      `SELECT gt.id, gt.group_id, gt.paid_by, gt.personal_transaction_id, gt.amount, gt.type, gt.category_id, gt.description, gt.date, gt.split_type, gt.split_details, gt.created_at,
              u.name as paid_by_name, u.email as paid_by_email, u.avatar_url as paid_by_avatar,
              json_build_object(
                'id', gc.id,
                'name', gc.name,
                'color', gc.color,
                'icon', gc.icon
              ) as category
       FROM group_transactions gt
       JOIN users u ON u.id = gt.paid_by
       LEFT JOIN group_categories gc ON gc.id = gt.category_id
       WHERE gt.group_id = $1
       ORDER BY gt.date DESC, gt.created_at DESC`,
      [groupId]
    );

    // Also fetch split request status summary for each transaction
    const splitReqsRes = await query(
      `SELECT group_transaction_id, status, COUNT(*) as count, SUM(amount) as sum
       FROM group_split_requests
       WHERE group_id = $1
       GROUP BY group_transaction_id, status`,
      [groupId]
    );

    const splitMap: Record<string, { totalRequests: number; paidRequests: number; paidSum: number; pendingSum: number }> = {};
    for (const row of splitReqsRes.rows) {
      const gtxId = row.group_transaction_id;
      if (!splitMap[gtxId]) {
        splitMap[gtxId] = { totalRequests: 0, paidRequests: 0, paidSum: 0, pendingSum: 0 };
      }
      const count = parseInt(row.count, 10);
      const sum = parseFloat(row.sum);
      splitMap[gtxId].totalRequests += count;
      if (row.status === "paid") {
        splitMap[gtxId].paidRequests += count;
        splitMap[gtxId].paidSum += sum;
      } else {
        splitMap[gtxId].pendingSum += sum;
      }
    }

    const mapped = result.rows.map((r) => ({
      ...r,
      amount: parseFloat(r.amount),
      category: r.category_id ? r.category : null,
      split_details: typeof r.split_details === "string" ? JSON.parse(r.split_details) : r.split_details,
      split_summary: splitMap[r.id] || null,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Fetch group transactions error:", err);
    res.status(500).json({ error: "Failed to fetch group transactions." });
  }
});

// POST /api/groups/:groupId/transactions - Record an expense split
router.post("/:groupId/transactions", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { groupId } = req.params;
    const { amount, type = "expense", category_id, description, date, split_type = "equal", split_details = {}, paid_by } = req.body;

    const memberCheck = await query("SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2", [groupId, userId]);
    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      res.status(400).json({ error: "Amount must be a positive number." });
      return;
    }

    const payer = paid_by || userId;
    const txDate = date ? new Date(date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const numAmount = parseFloat(amount);

    // 1. Get group details & members
    const groupRes = await query("SELECT name, currency FROM groups WHERE id = $1", [groupId]);
    const groupName = groupRes.rows[0]?.name || "Group";

    const membersRes = await query("SELECT user_id FROM group_members WHERE group_id = $1", [groupId]);
    const allMemberIds = membersRes.rows.map((r) => r.user_id);

    // 2. Insert group transaction
    const result = await query(
      `INSERT INTO group_transactions (group_id, paid_by, amount, type, category_id, description, date, split_type, split_details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, group_id, paid_by, amount, type, category_id, description, date, split_type, split_details, created_at`,
      [
        groupId,
        payer,
        numAmount,
        type,
        category_id || null,
        description || "Group Expense",
        txDate,
        split_type,
        JSON.stringify(split_details || {}),
      ]
    );

    const tx = result.rows[0];

    // 3. Calculate individual shares for each member
    const memberShares: Record<string, number> = {};
    let parsedSplit = split_details;
    if (typeof parsedSplit === "string") {
      try { parsedSplit = JSON.parse(parsedSplit); } catch { parsedSplit = {}; }
    }

    if (split_type === "exact" || split_type === "custom") {
      for (const [uid, shareVal] of Object.entries(parsedSplit)) {
        memberShares[uid] = parseFloat(String(shareVal)) || 0;
      }
    } else if (split_type === "percentage") {
      for (const [uid, pctVal] of Object.entries(parsedSplit)) {
        memberShares[uid] = (numAmount * (parseFloat(String(pctVal)) || 0)) / 100;
      }
    } else if (split_type === "shares") {
      const totalShares = Object.values(parsedSplit).reduce((sum: number, s: any) => sum + Number(s), 0);
      if (totalShares > 0) {
        for (const [uid, shareVal] of Object.entries(parsedSplit)) {
          memberShares[uid] = (numAmount * Number(shareVal)) / totalShares;
        }
      }
    } else {
      // Equal split
      const selectedMembers = parsedSplit && Object.keys(parsedSplit).length > 0
        ? Object.keys(parsedSplit)
        : allMemberIds;
      const count = selectedMembers.length > 0 ? selectedMembers.length : 1;
      const share = numAmount / count;
      selectedMembers.forEach((uid: string) => {
        memberShares[uid] = share;
      });
    }

    // 4. Determine other participants who owe reimbursement
    let totalOtherShares = 0;
    const requestsToInsert: { toUserId: string; shareAmount: number }[] = [];

    for (const [uid, shareAmt] of Object.entries(memberShares)) {
      const roundedShare = Math.round(shareAmt * 100) / 100;
      if (uid !== payer && roundedShare > 0.01) {
        totalOtherShares += roundedShare;
        requestsToInsert.push({ toUserId: uid, shareAmount: roundedShare });
      }
    }

    const splitStatus = requestsToInsert.length > 0 ? "pending_split" : "none";

    // 5. Create personal transaction for the payer
    // Payer paid full `numAmount` upfront out of pocket!
    const personalTxResult = await query(
      `INSERT INTO transactions (user_id, amount, original_amount, split_received_amount, split_status, type, description, date, group_id, group_transaction_id)
       VALUES ($1, $2, $3, 0, $4, 'expense', $5, $6, $7, $8)
       RETURNING id`,
      [
        payer,
        numAmount,
        numAmount,
        splitStatus,
        `${description || "Group Expense"} (${groupName})`,
        txDate,
        groupId,
        tx.id,
      ]
    );

    const personalTxId = personalTxResult.rows[0]?.id;

    // Link personal_transaction_id back to group_transactions
    if (personalTxId) {
      await query("UPDATE group_transactions SET personal_transaction_id = $1 WHERE id = $2", [personalTxId, tx.id]);
    }

    // 6. Create split request entries for all participants
    for (const reqItem of requestsToInsert) {
      await query(
        `INSERT INTO group_split_requests (group_id, group_transaction_id, from_user_id, to_user_id, amount, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')`,
        [groupId, tx.id, payer, reqItem.toUserId, reqItem.shareAmount]
      );
    }

    res.status(201).json({
      ...tx,
      amount: parseFloat(tx.amount),
      personal_transaction_id: personalTxId,
      split_requests_count: requestsToInsert.length,
    });
  } catch (err) {
    console.error("Create group transaction error:", err);
    res.status(500).json({ error: "Failed to create group transaction." });
  }
});

// DELETE /api/groups/:groupId/transactions/:txId
router.delete("/:groupId/transactions/:txId", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { groupId, txId } = req.params;

    const result = await query(
      `DELETE FROM group_transactions
       WHERE id = $1 AND group_id = $2 AND (paid_by = $3 OR (SELECT role FROM group_members WHERE group_id = $2 AND user_id = $3) = 'admin')
       RETURNING id`,
      [txId, groupId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Transaction not found or insufficient permissions." });
      return;
    }

    // Clean up split requests and associated personal transactions
    await query("DELETE FROM group_split_requests WHERE group_transaction_id = $1", [txId]);
    await query("DELETE FROM transactions WHERE group_transaction_id = $1", [txId]);

    res.json({ message: "Group transaction deleted successfully." });
  } catch (err) {
    console.error("Delete group transaction error:", err);
    res.status(500).json({ error: "Failed to delete group transaction." });
  }
});

// POST /api/groups/:groupId/settle - Record a settlement payment (Google Pay / Splitwise style)
router.post("/:groupId/settle", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { groupId } = req.params;
    const { to_user_id, from_user_id, amount, date, notes = "", payment_method = "upi", auto_confirm = true } = req.body;

    const memberCheck = await query("SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2", [groupId, userId]);
    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const payerId = from_user_id || userId;
    const receiverId = to_user_id;

    if (!receiverId || !amount || parseFloat(amount) <= 0) {
      res.status(400).json({ error: "Recipient user and valid amount are required." });
      return;
    }

    if (payerId === receiverId) {
      res.status(400).json({ error: "Payer and recipient cannot be the same person." });
      return;
    }

    const status = auto_confirm ? "confirmed" : "pending";
    const paymentDate = date ? new Date(date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const numAmount = parseFloat(amount);

    const result = await query(
      `INSERT INTO group_settlements (group_id, from_user_id, to_user_id, amount, date, notes, payment_method, status, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        groupId,
        payerId,
        receiverId,
        numAmount,
        paymentDate,
        notes,
        payment_method,
        status,
        status === "confirmed" ? new Date().toISOString() : null,
      ]
    );

    const settleRecord = result.rows[0];

    // If settlement is confirmed, reconcile open split requests between from_user_id and to_user_id
    if (status === "confirmed") {
      const openRequests = await query(
        `SELECT sr.*, gt.description as expense_description
         FROM group_split_requests sr
         JOIN group_transactions gt ON gt.id = sr.group_transaction_id
         WHERE sr.group_id = $1 AND sr.from_user_id = $2 AND sr.to_user_id = $3 AND sr.status IN ('pending', 'accepted')
         ORDER BY sr.created_at ASC`,
        [groupId, receiverId, payerId]
      );

      let remainingSettleAmt = numAmount;
      for (const sr of openRequests.rows) {
        const srAmt = parseFloat(sr.amount);
        if (remainingSettleAmt >= srAmt) {
          remainingSettleAmt -= srAmt;
          await query(
            "UPDATE group_split_requests SET status = 'paid', paid_at = NOW(), settlement_id = $1, payment_method = $2 WHERE id = $3",
            [settleRecord.id, payment_method, sr.id]
          );

          // Deduct from receiver's personal transaction
          const personalTxRes = await query(
            "SELECT * FROM transactions WHERE group_transaction_id = $1 AND user_id = $2",
            [sr.group_transaction_id, receiverId]
          );
          if (personalTxRes.rows.length > 0) {
            const pTx = personalTxRes.rows[0];
            const orig = parseFloat(pTx.original_amount || pTx.amount);
            const prevR = parseFloat(pTx.split_received_amount || 0);
            const newR = Math.round((prevR + srAmt) * 100) / 100;
            const newA = Math.max(0, Math.round((orig - newR) * 100) / 100);
            await query(
              "UPDATE transactions SET amount = $1, split_received_amount = $2, split_status = $3 WHERE id = $4",
              [newA, newR, "partially_settled", pTx.id]
            );
          }
        }
      }
    }

    res.status(201).json({
      message: status === "confirmed" ? "Settlement recorded and confirmed!" : "Settlement submitted for confirmation.",
      settlement: settleRecord,
    });
  } catch (err) {
    console.error("Record settlement error:", err);
    res.status(500).json({ error: "Failed to record settlement." });
  }
});

// PUT /api/groups/:groupId/settle/:settleId/approve - Confirm / approve receipt of payment
router.put("/:groupId/settle/:settleId/approve", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { groupId, settleId } = req.params;
    const { action } = req.body; // 'approve' | 'reject'

    const settleCheck = await query(
      "SELECT * FROM group_settlements WHERE id = $1 AND group_id = $2",
      [settleId, groupId]
    );

    if (settleCheck.rows.length === 0) {
      res.status(404).json({ error: "Settlement record not found." });
      return;
    }

    const settlement = settleCheck.rows[0];
    if (settlement.to_user_id !== userId) {
      res.status(403).json({ error: "Only the recipient can approve or reject this settlement." });
      return;
    }

    const newStatus = action === "reject" ? "rejected" : "confirmed";
    const result = await query(
      "UPDATE group_settlements SET status = $1, approved_at = NOW() WHERE id = $2 RETURNING *",
      [newStatus, settleId]
    );

    res.json({
      message: `Settlement ${newStatus}!`,
      settlement: result.rows[0],
    });
  } catch (err) {
    console.error("Approve settlement error:", err);
    res.status(500).json({ error: "Failed to update settlement status." });
  }
});

// DELETE /api/groups/:groupId/settle/:settleId - Delete settlement record
router.delete("/:groupId/settle/:settleId", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { groupId, settleId } = req.params;

    const result = await query(
      `DELETE FROM group_settlements
       WHERE id = $1 AND group_id = $2 AND (from_user_id = $3 OR to_user_id = $3 OR (SELECT role FROM group_members WHERE group_id = $2 AND user_id = $3) = 'admin')
       RETURNING id`,
      [settleId, groupId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Settlement not found or unauthorized." });
      return;
    }

    res.json({ message: "Settlement record deleted." });
  } catch (err) {
    console.error("Delete settlement error:", err);
    res.status(500).json({ error: "Failed to delete settlement." });
  }
});

// GET /api/groups/:groupId/categories
router.get("/:groupId/categories", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const result = await query(
      "SELECT id, group_id, name, type, color, icon, created_at FROM group_categories WHERE group_id = $1 ORDER BY name ASC",
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch group categories." });
  }
});

// POST /api/groups/:groupId/categories
router.post("/:groupId/categories", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { name, type = "expense", color = "#3B82F6", icon = "Tag" } = req.body;

    const result = await query(
      `INSERT INTO group_categories (group_id, name, type, color, icon)
       VALUES ($1, $2, $3, COALESCE($4, '#3B82F6'), COALESCE($5, 'Tag'))
       RETURNING id, group_id, name, type, color, icon, created_at`,
      [groupId, name.trim(), type, color, icon]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create group category." });
  }
});

// GET /api/groups/:groupId/settlements - Live Min-Cash-Flow Debt Graph with Settlement Tracking
router.get("/:groupId/settlements", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;

    // Get group members
    const membersRes = await query(
      `SELECT gm.user_id, u.name, u.email, u.avatar_url
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = $1`,
      [groupId]
    );
    const members = membersRes.rows;
    const memberMap: Record<string, { name: string; email: string; avatar_url: string }> = {};
    members.forEach((m) => {
      memberMap[m.user_id] = { name: m.name || m.email.split("@")[0], email: m.email, avatar_url: m.avatar_url };
    });

    // Get all transactions
    const txRes = await query(
      `SELECT id, paid_by, amount, split_type, split_details
       FROM group_transactions
       WHERE group_id = $1 AND type = 'expense'`,
      [groupId]
    );

    // Get all confirmed settlements
    const settleRes = await query(
      `SELECT s.*,
              u1.name as from_name, u1.email as from_email,
              u2.name as to_name, u2.email as to_email
       FROM group_settlements s
       JOIN users u1 ON u1.id = s.from_user_id
       JOIN users u2 ON u2.id = s.to_user_id
       WHERE s.group_id = $1
       ORDER BY s.date DESC, s.created_at DESC`,
      [groupId]
    );

    const settlementsHistory = settleRes.rows.map((s) => ({
      ...s,
      amount: parseFloat(s.amount),
    }));

    // Calculate net balance for each member: balance = total_paid - total_share + settlements_received - settlements_paid
    const netBalances: Record<string, number> = {};
    members.forEach((m) => (netBalances[m.user_id] = 0));

    // 1. Process Expenses
    for (const tx of txRes.rows) {
      const amount = parseFloat(tx.amount);
      const payer = tx.paid_by;
      if (netBalances[payer] === undefined) netBalances[payer] = 0;
      netBalances[payer] += amount;

      let split = tx.split_details;
      if (typeof split === "string") {
        try { split = JSON.parse(split); } catch { split = {}; }
      }

      if (tx.split_type === "custom" || tx.split_type === "exact") {
        for (const [uid, userShare] of Object.entries(split)) {
          if (netBalances[uid] === undefined) netBalances[uid] = 0;
          netBalances[uid] -= Number(userShare);
        }
      } else if (tx.split_type === "percentage") {
        for (const [uid, pct] of Object.entries(split)) {
          if (netBalances[uid] === undefined) netBalances[uid] = 0;
          netBalances[uid] -= (amount * Number(pct)) / 100;
        }
      } else if (tx.split_type === "shares") {
        const totalShares = Object.values(split).reduce((sum: number, s: any) => sum + Number(s), 0);
        if (totalShares > 0) {
          for (const [uid, shareVal] of Object.entries(split)) {
            if (netBalances[uid] === undefined) netBalances[uid] = 0;
            netBalances[uid] -= (amount * Number(shareVal)) / totalShares;
          }
        }
      } else {
        // Equal split among selected members or all members
        const selectedMembers = split && Object.keys(split).length > 0
          ? Object.keys(split)
          : members.map((m) => m.user_id);
        const count = selectedMembers.length;
        if (count > 0) {
          const share = amount / count;
          selectedMembers.forEach((uid) => {
            if (netBalances[uid] === undefined) netBalances[uid] = 0;
            netBalances[uid] -= share;
          });
        }
      }
    }

    // 2. Adjust for Confirmed Settlement Payments (Settle-Up)
    for (const s of settlementsHistory) {
      if (s.status === "confirmed") {
        const amt = parseFloat(s.amount);
        // from_user paid to to_user: from_user's debt reduces (credit +amt), to_user's credit reduces (credit -amt)
        if (netBalances[s.from_user_id] === undefined) netBalances[s.from_user_id] = 0;
        if (netBalances[s.to_user_id] === undefined) netBalances[s.to_user_id] = 0;
        netBalances[s.from_user_id] += amt;
        netBalances[s.to_user_id] -= amt;
      }
    }

    // 3. Debt Minimization Algorithm (Greedy Min-Cash-Flow)
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    for (const [uid, balance] of Object.entries(netBalances)) {
      const rounded = Math.round(balance * 100) / 100;
      if (rounded < -0.01) debtors.push({ id: uid, amount: -rounded });
      else if (rounded > 0.01) creditors.push({ id: uid, amount: rounded });
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const calculatedSettlements: {
      fromUserId: string;
      fromName: string;
      toUserId: string;
      toName: string;
      amount: number;
    }[] = [];

    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const settleAmount = Math.min(debtor.amount, creditor.amount);

      if (settleAmount > 0.01) {
        calculatedSettlements.push({
          fromUserId: debtor.id,
          fromName: memberMap[debtor.id]?.name || "Unknown",
          toUserId: creditor.id,
          toName: memberMap[creditor.id]?.name || "Unknown",
          amount: Math.round(settleAmount * 100) / 100,
        });
      }

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;

      if (debtor.amount <= 0.01) i++;
      if (creditor.amount <= 0.01) j++;
    }

    res.json({
      netBalances: Object.entries(netBalances).map(([userId, net]) => ({
        userId,
        name: memberMap[userId]?.name || "Unknown",
        net: Math.round(net * 100) / 100,
      })),
      settlements: calculatedSettlements,
      recordedSettlements: settlementsHistory,
    });
  } catch (err) {
    console.error("Calculate settlements error:", err);
    res.status(500).json({ error: "Failed to calculate settlements." });
  }
});

export default router;
