import { Router, Response } from "express";
import { query, seedDefaultCategories } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// GET /api/categories
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await query(
      `SELECT id, user_id, name, type, color, icon, created_at
       FROM categories
       WHERE user_id = $1
       ORDER BY name ASC`,
      [userId]
    );

    // If user has 0 categories, auto-seed defaults
    if (result.rows.length === 0) {
      await seedDefaultCategories(userId);
      const seeded = await query(
        `SELECT id, user_id, name, type, color, icon, created_at
         FROM categories
         WHERE user_id = $1
         ORDER BY name ASC`,
        [userId]
      );
      res.json(seeded.rows);
      return;
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch categories error:", err);
    res.status(500).json({ error: "Failed to fetch categories." });
  }
});

// POST /api/categories
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, type, color, icon } = req.body;

    if (!name || !type) {
      res.status(400).json({ error: "Name and type are required." });
      return;
    }

    const result = await query(
      `INSERT INTO categories (user_id, name, type, color, icon)
       VALUES ($1, $2, $3, COALESCE($4, '#3B82F6'), COALESCE($5, 'Tag'))
       RETURNING id, user_id, name, type, color, icon, created_at`,
      [userId, name.trim(), type, color, icon]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Category already exists with this name and type." });
      return;
    }
    console.error("Create category error:", err);
    res.status(500).json({ error: "Failed to create category." });
  }
});

// PUT /api/categories/:id
router.put("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, type, color, icon } = req.body;

    const result = await query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           color = COALESCE($3, color),
           icon = COALESCE($4, icon)
       WHERE id = $5 AND user_id = $6
       RETURNING id, user_id, name, type, color, icon, created_at`,
      [name?.trim(), type, color, icon, id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Category not found." });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update category error:", err);
    res.status(500).json({ error: "Failed to update category." });
  }
});

// DELETE /api/categories/:id
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await query(
      "DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Category not found." });
      return;
    }

    res.json({ message: "Category deleted successfully." });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ error: "Failed to delete category." });
  }
});

export default router;
