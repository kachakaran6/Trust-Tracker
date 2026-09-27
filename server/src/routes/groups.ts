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
      `SELECT g.id, g.name, g.description, g.code, g.created_by, g.created_at,
              gm.role as my_role,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
              COALESCE((SELECT SUM(amount) FROM group_transactions WHERE group_id = g.id), 0) as total_spent
       FROM groups g
       INNER JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [userId]
    );

    const mapped = result.rows.map((r) => ({
      ...r,
      member_count: parseInt(r.member_count, 10),
      total_spent: parseFloat(r.total_spent),
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Fetch groups error:", err);
    res.status(500).json({ error: "Failed to fetch groups." });
  }
});

// POST /api/groups - Create a new group
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: "Group name is required." });
      return;
    }

    let code = generateGroupCode();
    // Ensure code uniqueness
    let isUnique = false;
    while (!isUnique) {
      const check = await query("SELECT id FROM groups WHERE code = $1", [code]);
      if (check.rows.length === 0) isUnique = true;
      else code = generateGroupCode();
    }

    const groupResult = await query(
      `INSERT INTO groups (name, description, code, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, code, created_by, created_at`,
      [name.trim(), description || "", code, userId]
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
      { name: "Food & Drinks", color: "#F59E0B", icon: "Coffee" },
      { name: "Accommodation", color: "#8B5CF6", icon: "Home" },
      { name: "Travel & Transport", color: "#3B82F6", icon: "Car" },
      { name: "Activities", color: "#10B981", icon: "Activity" },
      { name: "General", color: "#64748B", icon: "Tag" },
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
      "SELECT id, name, description, code, created_by, created_at FROM groups WHERE code = $1",
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
      "SELECT id, name, description, code, created_by, created_at FROM groups WHERE id = $1",
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      res.status(404).json({ error: "Group not found." });
      return;
    }

    const membersResult = await query(
      `SELECT gm.id, gm.group_id, gm.user_id, gm.role, gm.joined_at,
              u.name, u.email, u.avatar_url
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

// GET /api/groups/:groupId/transactions
router.get("/:groupId/transactions", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { groupId } = req.params;

    // Verify membership
    const memberCheck = await query("SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2", [groupId, userId]);
    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const result = await query(
      `SELECT gt.id, gt.group_id, gt.paid_by, gt.amount, gt.type, gt.category_id, gt.description, gt.date, gt.split_type, gt.split_details, gt.created_at,
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

    const mapped = result.rows.map((r) => ({
      ...r,
      amount: parseFloat(r.amount),
      category: r.category_id ? r.category : null,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Fetch group transactions error:", err);
    res.status(500).json({ error: "Failed to fetch group transactions." });
  }
});

// POST /api/groups/:groupId/transactions
router.post("/:groupId/transactions", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { groupId } = req.params;
    const { amount, type, category_id, description, date, split_type, split_details, paid_by } = req.body;

    // Verify membership
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

    const result = await query(
      `INSERT INTO group_transactions (group_id, paid_by, amount, type, category_id, description, date, split_type, split_details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, group_id, paid_by, amount, type, category_id, description, date, split_type, split_details, created_at`,
      [groupId, payer, parseFloat(amount), type || "expense", category_id || null, description || "", txDate, split_type || "equal", JSON.stringify(split_details || {})]
    );

    const tx = result.rows[0];
    res.status(201).json({
      ...tx,
      amount: parseFloat(tx.amount),
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

    res.json({ message: "Group transaction deleted successfully." });
  } catch (err) {
    console.error("Delete group transaction error:", err);
    res.status(500).json({ error: "Failed to delete group transaction." });
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
    const { name, type, color, icon } = req.body;

    const result = await query(
      `INSERT INTO group_categories (group_id, name, type, color, icon)
       VALUES ($1, $2, $3, COALESCE($4, '#3B82F6'), COALESCE($5, 'Tag'))
       RETURNING id, group_id, name, type, color, icon, created_at`,
      [groupId, name.trim(), type || "expense", color, icon]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create group category." });
  }
});

// GET /api/groups/:groupId/settlements - Debt Minimization Algorithm ("Who owes Whom")
router.get("/:groupId/settlements", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;

    // Get members
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

    // Calculate net balance for each member: balance = total_paid - total_share
    const netBalances: Record<string, number> = {};
    members.forEach((m) => (netBalances[m.user_id] = 0));

    for (const tx of txRes.rows) {
      const amount = parseFloat(tx.amount);
      const payer = tx.paid_by;
      if (netBalances[payer] === undefined) netBalances[payer] = 0;
      netBalances[payer] += amount;

      let split = tx.split_details;
      if (typeof split === "string") {
        try { split = JSON.parse(split); } catch { split = {}; }
      }

      if (tx.split_type === "custom" && split && Object.keys(split).length > 0) {
        for (const [uid, userShare] of Object.entries(split)) {
          if (netBalances[uid] === undefined) netBalances[uid] = 0;
          netBalances[uid] -= Number(userShare);
        }
      } else {
        // Equal split among all members
        const count = members.length;
        if (count > 0) {
          const share = amount / count;
          members.forEach((m) => {
            netBalances[m.user_id] -= share;
          });
        }
      }
    }

    // Debt Minimization using Greedy Algorithm
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    for (const [uid, balance] of Object.entries(netBalances)) {
      const rounded = Math.round(balance * 100) / 100;
      if (rounded < -0.01) debtors.push({ id: uid, amount: -rounded });
      else if (rounded > 0.01) creditors.push({ id: uid, amount: rounded });
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements: {
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
        settlements.push({
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
      settlements,
    });
  } catch (err) {
    console.error("Calculate settlements error:", err);
    res.status(500).json({ error: "Failed to calculate settlements." });
  }
});

export default router;
