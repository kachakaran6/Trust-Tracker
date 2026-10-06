# 💸 TrustTracker
### Self-Hosted Personal Finance, Shared Expense & Group Debt Manager
**Built with React 18 + Vite + TypeScript + Node.js / Express + PostgreSQL + Docker + Coolify**

---

## 🚀 Overview

**TrustTracker** is a clean, sleek, unified personal finance platform. It combines day-to-day expense tracking, category budgets, shared group expense splitting with automated debt minimization, loan & EMI amortization schedules, and recurring subscription tracking into a single cohesive interface.

---

## 🎨 UI/UX Design System & Architectural Principles

- **Unified Design Tokens**: Built on a single sky/cyan primary brand (`#0284C7` light / `#38BDF8` dark) and neutral slate surfaces (`#F8FAFC` light / `#0B1120` dark). Zero hard-coded ad-hoc colors or gradients.
- **Lucide Icons Only**: All icons are curated in `src/components/ui/icons.ts` with consistent 1.75 stroke weight and semantic naming. Zero emoji glyphs or legacy icon bloat.
- **Shared UI Primitives**: Standardized components in `src/components/ui/` (`Button`, `IconButton`, `Card`, `StatCard`, `PageHeader`, `Tabs`, `Badge`, `Input`, `Select`, `Textarea`, `DataList`, `EmptyState`, `Modal`, `ConfirmDialog`, `ProgressBar`, `Skeleton`).
- **Responsive Layout**: Fixed left sidebar on desktop (≥1024px) and bottom tab navigation on mobile (<768px) with a single floating quick-add action. Tables adaptively transform into stacked cards on mobile to prevent horizontal scrolling.
- **Single Source of Truth Formatters**: All currency, dates, and category labels pass through `src/lib/format.ts` (`formatMoney`, `formatDate`, `formatDateTime`, `formatCategory`).
- **PWA Standalone Launch**: When opened as an installed PWA, TrustTracker launches directly into the app dashboard/login, skipping the landing page with zero flash.
- **Strict Accessibility**: Full keyboard navigation, visible `:focus-visible` rings, minimum 44px touch targets on mobile, and WCAG AA contrast in both light and dark themes.

For full guidelines, see [docs/design-system.md](docs/design-system.md).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Recharts, Framer Motion, Sonner, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, JWT, BcryptJS, Zod |
| **Database** | PostgreSQL 16 (Self-Hosted / Managed connection pool) |
| **PWA** | Web App Manifest, Service Worker caching, standalone routing |
| **Deployment** | Multi-stage Dockerfile, Docker Compose, Coolify 1-Click Deploy |

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
├── docs/
│   ├── design-system.md        # Design system specifications & token guide
│   └── ui-audit.md             # Baseline UI audit & checklist findings
├── server/                     # Express + PostgreSQL Backend
│   ├── src/
│   │   ├── db/                 # PostgreSQL connection pool & schema migrations
│   │   ├── middleware/         # JWT auth & super admin middleware
│   │   ├── routes/             # REST endpoints (auth, transactions, groups, loans, debts, admin)
│   │   └── index.ts            # Server entry & static SPA serving
│   └── tsconfig.json
├── src/                        # React 18 + Vite SPA Frontend
│   ├── components/             # Modular UI components & design system primitives
│   │   ├── layout/             # Sidebar, Header, BottomNav, Layout
│   │   └── ui/                 # Button, Card, StatCard, Badge, Input, Tabs, etc.
│   ├── contexts/               # Auth, Transactions, Categories, Budget, Theme
│   ├── lib/                    # api.ts, format.ts, pwa.ts
│   ├── pages/                  # Dashboard, Analytics, Budget, Group, Loans, Subscriptions, Debts, Admin, etc.
│   └── types/                  # Strictly typed data contracts
└── package.json
```

---

## 📄 License
MIT License. Created by [kachakaran6](https://github.com/kachakaran6).
