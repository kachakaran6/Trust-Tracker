import pg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/trust_tracker",
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

export async function query<T = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development" && duration > 500) {
      console.warn(`[DB Slow Query] ${duration}ms: ${text}`);
    }
    return res;
  } catch (error) {
    console.error(`[DB Error] Query failed: ${text}`, error);
    throw error;
  }
}

export async function initDatabase(): Promise<void> {
  console.log("🐘 Initializing PostgreSQL database schema...");
  try {
    const schemaPath = path.resolve(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    await pool.query(schemaSql);
    console.log("✅ PostgreSQL schema initialized successfully.");
  } catch (err) {
    console.error("❌ Failed to initialize database schema:", err);
    throw err;
  }
}

export const DEFAULT_CATEGORIES = [
  { name: "Salary", type: "income", color: "#10B981", icon: "Briefcase" },
  { name: "Freelance", type: "income", color: "#3B82F6", icon: "Laptop" },
  { name: "Investments", type: "income", color: "#8B5CF6", icon: "TrendingUp" },
  { name: "Other Income", type: "income", color: "#06B6D4", icon: "PlusCircle" },
  { name: "Housing & Rent", type: "expense", color: "#EF4444", icon: "Home" },
  { name: "Groceries & Food", type: "expense", color: "#F59E0B", icon: "ShoppingCart" },
  { name: "Dining & Drinks", type: "expense", color: "#EC4899", icon: "Coffee" },
  { name: "Transportation", type: "expense", color: "#6366F1", icon: "Car" },
  { name: "Utilities", type: "expense", color: "#14B8A6", icon: "Zap" },
  { name: "Entertainment", type: "expense", color: "#A855F7", icon: "Film" },
  { name: "Healthcare", type: "expense", color: "#F43F5E", icon: "Heart" },
  { name: "Shopping", type: "expense", color: "#FB923C", icon: "ShoppingBag" },
  { name: "Miscellaneous", type: "expense", color: "#64748B", icon: "HelpCircle" },
];

export async function seedDefaultCategories(userId: string): Promise<void> {
  try {
    for (const cat of DEFAULT_CATEGORIES) {
      await pool.query(
        `INSERT INTO categories (user_id, name, type, color, icon)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, name, type) DO NOTHING`,
        [userId, cat.name, cat.type, cat.color, cat.icon]
      );
    }
  } catch (err) {
    console.error("Failed to seed default categories:", err);
  }
}
