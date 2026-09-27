import { Router, Response } from "express";
import { query, pool } from "../db";
import { requireAuth, requireSuperAdmin, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Apply auth and superadmin check to all admin routes
router.use(requireAuth);
router.use(requireSuperAdmin);

// GET /api/admin/stats
router.get("/stats", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'banned' THEN 1 END) as banned_users,
        COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as new_users_this_month
      FROM users
    `);

    const txStats = await query(`
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(amount), 0) as total_amount
      FROM transactions
    `);

    const u = userStats.rows[0];
    const t = txStats.rows[0];

    res.json({
      totalUsers: parseInt(u.total_users, 10),
      superAdmins: parseInt(u.super_admins, 10),
      activeUsers: parseInt(u.active_users, 10),
      bannedUsers: parseInt(u.banned_users, 10),
      newUsersThisMonth: parseInt(u.new_users_this_month, 10),
      totalTransactions: parseInt(t.total_transactions, 10),
      totalAmount: parseFloat(t.total_amount),
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Failed to fetch admin stats." });
  }
});

// GET /api/admin/users
router.get("/users", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT 
        u.id as user_id,
        u.email,
        u.name as full_name,
        u.role as user_role,
        u.status as user_status,
        u.currency,
        u.timezone,
        u.avatar_url,
        u.created_at,
        u.last_sign_in_at,
        COUNT(t.id) as total_transactions,
        COALESCE(SUM(t.amount), 0) as total_amount
      FROM users u
      LEFT JOIN transactions t ON t.user_id = u.id
      GROUP BY u.id, u.email, u.name, u.role, u.status, u.currency, u.timezone, u.avatar_url, u.created_at, u.last_sign_in_at
      ORDER BY u.created_at DESC
    `);

    const mapped = result.rows.map((row) => ({
      ...row,
      total_transactions: parseInt(row.total_transactions, 10),
      total_amount: parseFloat(row.total_amount),
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Admin users list error:", err);
    res.status(500).json({ error: "Failed to fetch users list." });
  }
});

// POST /api/admin/users/:id/role
router.post("/users/:id/role", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (role !== "normal" && role !== "super_admin") {
      res.status(400).json({ error: "Role must be either 'normal' or 'super_admin'." });
      return;
    }

    if (id === req.user!.id && role !== "super_admin") {
      res.status(400).json({ error: "You cannot demote yourself from Super Admin." });
      return;
    }

    await query("UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2", [role, id]);

    res.json({ success: true, message: `User role updated to ${role}.` });
  } catch (err) {
    console.error("Admin user role error:", err);
    res.status(500).json({ error: "Failed to update user role." });
  }
});

// POST /api/admin/users/:id/status
router.post("/users/:id/status", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status !== "active" && status !== "banned") {
      res.status(400).json({ error: "Status must be either 'active' or 'banned'." });
      return;
    }

    if (id === req.user!.id) {
      res.status(400).json({ error: "You cannot change your own account status." });
      return;
    }

    await query("UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2", [status, id]);

    res.json({ success: true, message: `User status updated to ${status}.` });
  } catch (err) {
    console.error("Admin user status error:", err);
    res.status(500).json({ error: "Failed to update user status." });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      res.status(400).json({ error: "You cannot delete your own admin account." });
      return;
    }

    await client.query("BEGIN");

    // Cascade delete all dependent data
    await client.query("DELETE FROM group_transactions WHERE paid_by = $1", [id]);
    await client.query("DELETE FROM group_members WHERE user_id = $1", [id]);
    await client.query("DELETE FROM groups WHERE created_by = $1", [id]);
    await client.query("DELETE FROM budgets WHERE user_id = $1", [id]);
    await client.query("DELETE FROM transactions WHERE user_id = $1", [id]);
    await client.query("DELETE FROM categories WHERE user_id = $1", [id]);
    
    const result = await client.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "User not found." });
      return;
    }

    await client.query("COMMIT");

    res.json({ success: true, message: "User and all associated data deleted successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Admin delete user error:", err);
    res.status(500).json({ error: "Failed to delete user." });
  } finally {
    client.release();
  }
});

export default router;
