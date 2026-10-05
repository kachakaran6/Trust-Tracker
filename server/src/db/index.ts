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

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
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

    // Safe runtime migrations for existing databases
    // NOTE: Each statement is executed individually so that PostgreSQL
    // commits the DDL (e.g. ALTER TABLE ADD COLUMN) before any subsequent
    // index creation references those columns in its own planning phase.
    await pool.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'USD'`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'USD'`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) NOT NULL DEFAULT 'UTC'`);

    await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS original_amount NUMERIC(12, 2)`);
    await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS split_received_amount NUMERIC(12, 2) NOT NULL DEFAULT 0`);
    await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS split_status VARCHAR(50) NOT NULL DEFAULT 'none'`);
    await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL`);
    await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS group_transaction_id UUID`);

    await pool.query(`ALTER TABLE group_transactions ADD COLUMN IF NOT EXISTS personal_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_split_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
          group_transaction_id UUID NOT NULL REFERENCES group_transactions(id) ON DELETE CASCADE,
          from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
          status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'paid', 'declined')),
          payment_method VARCHAR(50) DEFAULT 'upi',
          notes TEXT DEFAULT '',
          paid_at TIMESTAMPTZ,
          settlement_id UUID REFERENCES group_settlements(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Indexes are created AFTER all column/table DDL to avoid planning errors
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_group_split_req_to_user ON group_split_requests(to_user_id, status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_group_split_req_from_user ON group_split_requests(from_user_id, status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_group_split_req_tx ON group_split_requests(group_transaction_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_group_tx ON transactions(group_transaction_id)`);

    console.log("✅ PostgreSQL schema & migrations initialized successfully.");
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
