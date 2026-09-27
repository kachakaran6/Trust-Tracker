import { Router, Request, Response } from "express";
import { query } from "../db";

const router = Router();

// POST /api/analytics/session - Create temporary session snapshot
router.post("/session", async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_data, access_token, expires_in_hours = 24 } = req.body;

    if (!session_data) {
      res.status(400).json({ error: "session_data is required." });
      return;
    }

    const expiresAt = new Date(Date.now() + expires_in_hours * 3600 * 1000);

    const result = await query(
      `INSERT INTO temporary_analytics (session_data, expires_at, access_token)
       VALUES ($1, $2, $3)
       RETURNING id, created_at, expires_at`,
      [JSON.stringify(session_data), expiresAt, access_token || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create temp analytics error:", err);
    res.status(500).json({ error: "Failed to create analytics session." });
  }
});

// GET /api/analytics/session/:id - Get temporary session snapshot
router.get("/session/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const token = req.query.token as string | undefined;

    const result = await query(
      `SELECT id, session_data, created_at, expires_at, access_token
       FROM temporary_analytics
       WHERE id = $1 AND expires_at > NOW()`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Session not found or has expired." });
      return;
    }

    const row = result.rows[0];

    if (row.access_token && row.access_token !== token) {
      res.status(403).json({ error: "Access token required to view this session." });
      return;
    }

    res.json({
      id: row.id,
      sessionData: typeof row.session_data === "string" ? JSON.parse(row.session_data) : row.session_data,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    });
  } catch (err) {
    console.error("Fetch temp analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics session." });
  }
});

export default router;
