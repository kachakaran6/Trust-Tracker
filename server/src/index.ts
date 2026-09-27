import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { initDatabase, pool } from "./db";

// Routes
import authRoutes from "./routes/auth";
import categoryRoutes from "./routes/categories";
import transactionRoutes from "./routes/transactions";
import budgetRoutes from "./routes/budgets";
import groupRoutes from "./routes/groups";
import predictionRoutes from "./routes/predictions";
import aiRoutes from "./routes/ai";
import adminRoutes from "./routes/admin";
import analyticsRoutes from "./routes/analytics";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Liveness & Readiness Healthcheck for Coolify / Docker
app.get("/api/health", async (_req, res) => {
  try {
    const dbCheck = await pool.query("SELECT 1 as connected");
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: dbCheck.rows[0].connected === 1 ? "connected" : "disconnected",
      uptime: process.uptime(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: "unhealthy",
      error: err.message || "Database connection failed",
    });
  }
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);

// In production, serve the compiled Vite frontend
const distPath = path.resolve(__dirname, "../../dist");
app.use(express.static(distPath));

// SPA catch-all route for React Router (Express 5 path-to-regexp compatible)
app.get("(.*)", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      res.status(200).send("Trust-Tracker API is running. Build frontend with `npm run build` to view UI.");
    }
  });
});

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start Server & Auto-init Database
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Trust-Tracker Server running on port ${PORT}`);
      console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error("Failed to start server due to database error:", err);
    process.exit(1);
  }
}

startServer();

export default app;
