# 💸 Trust-Tracker (v2.0)
### Self-Hosted AI Finance & Group Expense Manager
**Built with React 18 + Vite + TypeScript + Node.js / Express + PostgreSQL + Docker + Coolify**

---

## 🚀 What's New in v2.0

- 🐘 **Native PostgreSQL Backend**: Replaced direct cloud Supabase lock-in with a high-performance Express REST API + PostgreSQL connection pool with automated schema initialization.
- 🐳 **Fully Dockerized & Coolify Ready**: Multi-stage `Dockerfile` + `docker-compose.yml` with healthchecks (`/api/health`) for instant 1-click deployment on Coolify, VPS, or Docker hosts.
- 🤝 **Automated Group Debt Settlement Engine**: Solves multi-person split debts using a greedy Min-Cash-Flow algorithm ("Who owes Whom").
- 🤖 **AI Diary & Receipt Parser**: Extract structured transactions from free-form natural language text using Google Gemini or the built-in intelligent tokenizer.
- 📈 **Predictive AI Forecast Engine**: Statistical linear regression & category momentum forecasting based on real spending history.
- 🛡️ **Admin Command Center**: System-wide analytics, user inspection, role management (Super Admin / Normal), ban toggles, and cascade user deletion.
- 💎 **100% Strict Type Safety & Clean Architecture**: Removed `any` types, sanitized console logging, standardized toast notifications with Sonner.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Recharts, Framer Motion, Sonner, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, JWT, BcryptJS, Zod |
| **Database** | PostgreSQL 16 (Self-Hosted / Managed) |
| **Deployment** | Docker (Multi-stage), Docker Compose, Coolify |

---

## 📦 Quick Start with Docker & Docker Compose (Recommended)

To spin up the entire application along with PostgreSQL:

```bash
# 1. Clone the repository
git clone https://github.com/kachakaran6/Trust-Tracker.git
cd Trust-Tracker

# 2. Copy environment variables
cp .env.example .env

# 3. Launch with Docker Compose
docker compose up -d --build
```

The app will be available at: **http://localhost:5000**  
API Health Check: **http://localhost:5000/api/health**

---

## 🌐 Coolify 1-Click Deployment Guide

1. In your **Coolify Dashboard**, create a new **Project** or **Resource**.
2. Select **Public / Private Git Repository** and enter `https://github.com/kachakaran6/Trust-Tracker.git`.
3. Choose **Docker Compose** or **Dockerfile** deployment.
4. Set the environment variables:
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgres://user:password@your-postgres-host:5432/trust_tracker
   JWT_SECRET=your-random-32-char-jwt-secret
   GEMINI_API_KEY=your-optional-gemini-key
   ```
5. Click **Deploy**. Coolify will automatically build the multi-stage image, run healthchecks, and serve your app.

---

## 💻 Local Development Setup (Without Docker)

### 1. Prerequisites
- Node.js 20+
- A running PostgreSQL database instance (e.g. `localhost:5432`)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Create `.env` in the project root:
```env
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/trust_tracker
JWT_SECRET=trust_tracker_super_secure_key_2026
GEMINI_API_KEY=
```

### 4. Run Development Servers
```bash
# Starts Express backend and Vite frontend concurrently
npm run dev
```

- Frontend: **http://localhost:5173**
- Backend: **http://localhost:5000**

---

## 📂 Project Architecture

```
Trust-Tracker/
├── Dockerfile                  # Production multi-stage Docker build
├── docker-compose.yml          # App + PostgreSQL container definitions
├── server/                     # Express + PostgreSQL Backend
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql      # Auto-migrated PostgreSQL schema
│   │   │   └── index.ts        # Database connection pool & seeders
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT & Super Admin authentication middleware
│   │   ├── routes/
│   │   │   ├── admin.ts        # Admin control panel endpoints
│   │   │   ├── ai.ts           # AI Diary & Receipt NLP parsing
│   │   │   ├── analytics.ts    # Temporary session sharing
│   │   │   ├── auth.ts         # Authentication & password management
│   │   │   ├── budgets.ts      # Monthly category budgets
│   │   │   ├── categories.ts   # Category management
│   │   │   ├── groups.ts       # Groups & Debt Settlement Engine
│   │   │   ├── predictions.ts  # ML / Regression forecasting
│   │   │   └── transactions.ts # Transaction CRUD & monthly aggregations
│   │   └── index.ts            # Server entry & static SPA serving
│   └── tsconfig.json
├── src/                        # React 18 + Vite SPA Frontend
│   ├── components/             # Modular UI components
│   ├── contexts/               # Auth, Transactions, Categories, Budget Contexts
│   ├── hooks/                  # Custom hooks (useGroup, useTheme)
│   ├── lib/
│   │   └── api.ts              # Unified type-safe REST API client
│   ├── pages/                  # Dashboard, Analytics, Budget, Group, Admin, etc.
│   └── types/
│       └── index.ts            # Central strictly-typed data contracts
└── package.json
```

---

## 📄 License
MIT License. Created by [kachakaran6](https://github.com/kachakaran6).
