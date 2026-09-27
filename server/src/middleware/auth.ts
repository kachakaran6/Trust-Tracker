import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { query } from "../db";

const JWT_SECRET = process.env.JWT_SECRET || "trust-tracker-ultra-secure-jwt-secret-key-2026";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "normal" | "super_admin";
  status: "active" | "banned";
  currency: string;
  timezone: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const result = await query<AuthenticatedUser>(
      `SELECT id, email, name, role, status, currency, timezone
       FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "User no longer exists" });
      return;
    }

    const user = result.rows[0];
    if (user.status === "banned") {
      res.status(403).json({ error: "Account is suspended by administrator." });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== "super_admin") {
    res.status(403).json({ error: "Access denied. Super Admin privileges required." });
    return;
  }
  next();
}
