import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query, seedDefaultCategories } from "../db";
import { generateToken, requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional().default(""),
  currency: z.string().optional().default("USD"),
  timezone: z.string().optional().default("UTC"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
router.post("/register", async (req, res: Response): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { email, password, name, currency, timezone } = parseResult.data;

    // Check if user already exists
    const existing = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    // Check if first user to assign super_admin
    const countResult = await query("SELECT COUNT(*) as count FROM users");
    const isFirstUser = parseInt(countResult.rows[0].count, 10) === 0;
    const role = isFirstUser ? "super_admin" : "normal";

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (email, password_hash, name, currency, timezone, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, role, status, currency, timezone, created_at`,
      [email.toLowerCase(), passwordHash, name || email.split("@")[0], currency, timezone, role]
    );

    const user = result.rows[0];

    // Seed default categories
    await seedDefaultCategories(user.id);

    const token = generateToken(user);
    res.status(201).json({
      user,
      token,
      message: "Registration successful!",
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Failed to register user." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    const { email, password } = parseResult.data;

    const result = await query(
      `SELECT id, email, password_hash, name, role, status, currency, timezone, avatar_url
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const user = result.rows[0];

    if (user.status === "banned") {
      res.status(403).json({ error: "Your account has been suspended by an administrator." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Update last sign in
    await query("UPDATE users SET last_sign_in_at = NOW() WHERE id = $1", [user.id]);

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    res.json({
      user: safeUser,
      token,
      message: "Login successful!",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed." });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile
router.put("/profile", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, currency, timezone, avatar_url } = req.body;
    const userId = req.user!.id;

    const result = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           currency = COALESCE($2, currency),
           timezone = COALESCE($3, timezone),
           avatar_url = COALESCE($4, avatar_url),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, name, role, status, currency, timezone, avatar_url`,
      [name, currency, timezone, avatar_url, userId]
    );

    res.json({ user: result.rows[0], message: "Profile updated successfully." });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile." });
  }
});

// PUT /api/auth/password
router.put("/password", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters long." });
      return;
    }

    const userId = req.user!.id;
    const userResult = await query("SELECT password_hash FROM users WHERE id = $1", [userId]);
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isMatch) {
      res.status(400).json({ error: "Current password is incorrect." });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [newHash, userId]);

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ error: "Failed to update password." });
  }
});

export default router;
