# TrustTracker UI/UX Audit & Baseline Discovery

## 1. Stack & Architecture
- **Framework**: React 18.3.1 with TypeScript 5.5.3
- **Router**: React Router DOM 6.22.3
- **Build Tool**: Vite 5.4.2
- **Styling System**: TailwindCSS 3.4.1, PostCSS 8.4.35, Autoprefixer 10.4.18
- **Design Tokens & Fonts**: Tailwind configuration extending colors (`primary`, `success`, `warning`, `danger`), font family `Manrope`, custom CSS in `src/index.css`
- **State & Contexts**:
  - `AuthContext`: Authentication & session state
  - `TransactionsContext`: Transactions data & caching
  - `CategoriesContext`: Category management
  - `BudgetContext`: Budget tracking
  - `NotificationsContext`: User alerts & notifications
  - `PageHeaderContext`: Dynamic page titles
  - `ThemeProvider`: Light/Dark mode via `next-themes`
- **PWA Setup**:
  - `public/manifest.json`: `"start_url": "/"` (Needs update to `/dashboard?source=pwa`)
  - `public/service-worker.js`: Basic caching for `/`, `/index.html`, `/manifest.json`, icons
  - Dependencies: Workbox packages installed in `package.json`
- **Data & Charts**:
  - `recharts` 2.12.2 & `chart.js` 4.5.0
  - `date-fns` 3.3.1 for date manipulation
  - `sonner` 2.0.6 for toast notifications

---

## 2. Icon Inventory
### 2.1 Installed Libraries
- `lucide-react`: Primary icon set (Active across all components).
- `@heroicons/react`: Installed in `package.json` (^2.2.0) but **0 imports** in `src/`. Scheduled for removal in Phase 3.

### 2.2 Direct Emojis & Glyphs in Source Files
- `src/pages/Debts.tsx`: Text glyph `✕` used as modal close buttons (Lines 529, 682, 784).
- `src/pages/Loans.tsx`: Text glyph `✕` used as modal close buttons (Lines 660, 853).
- `src/pages/Subscriptions.tsx`: Text glyph `✕` used as modal close button (Line 489).
- `src/pages/Group.tsx`: Text glyph `✕` used as modal close button (Lines 251, 335).
- `src/pages/GroupDetail.tsx`: Text glyphs `✕` (Lines 1159, 1422, 1543, 1638, 1755), `Paid ✓` (Lines 776, 884), `💡 Currency Notice:` (Line 551), `⚡ Live Ledger Auto-Deduction` (Line 694), `✓ reimbursed` (Line 1105).
- `src/pages/Transactions.tsx`: `📊 Detailed Report`, `📋 Simple List`, `📄 Export PDF`, `👥 {group_name}`, `⚡ Partially Reimbursed`, `✓ Fully Reimbursed`, `🟣 Group Split Share Paid`, `⏳ Split in Progress` (Lines 316, 323, 346-348, 766, 785-800).
- `src/pages/Settings.tsx`: `💸 Expense`, `💰 Income` (Lines 568, 588).
- `src/pages/SessionAnalytics.tsx`: `⚠️` (Lines 89, 173).
- `src/pages/Preview.tsx`: `💼`, `🛒` (Lines 27, 34).
- `src/pages/Predictions.tsx`: `✓ High Confidence Projection` (Line 132).
- `src/components/TransactionsPDFReport.tsx`: `💰`, `💸`, `✅` (Lines 214, 244, 284, 366).
- `src/utils/currency.ts`: Country flag emojis (`🇺🇸`, `🇮🇳`, `🇪🇺`, etc.) in `CURRENCIES` array rendering as broken text `IN INR (₹)` on Windows systems.

---

## 3. Colour & Theme Inventory
### 3.1 Primary Colour Conflict
- Active nav / sidebar & logo use Sky/Cyan (`#0284C7` / `sky-500` / `sky-600`).
- Primary buttons (`Quick Add`, `Add Budget`, `Launch Dashboard`, `btn-primary`) use Royal Blue (`#2563EB` / `primary-600`).
- **Resolution**: Unify to single Sky/Cyan primary token `--primary: #0284C7` (light) / `#38BDF8` (dark).

### 3.2 Accidental & Excess Accent Colours
- Purple/Indigo accents found across:
  - `src/pages/Admin.tsx`: `p-3 bg-purple-500/10 text-purple-500`
  - `src/pages/Dashboard.tsx`: `bg-purple-100 dark:bg-purple-900`, `text-purple-600`, `bg-purple-500/10`
  - `src/pages/Subscriptions.tsx`: `variant="purple"`
  - `src/pages/Transactions.tsx`: `bg-purple-100 text-purple-700`
  - `src/pages/Predictions.tsx`: `text-purple-500`, Recharts line `stroke="#8B5CF6"`
  - `src/pages/UpdatePassword.tsx`: `bg-indigo-600`, `text-indigo-400`
  - `src/components/layout/Sidebar.tsx`: `text-purple-400`, `bg-purple-600` (Super Admin tab)
  - `src/components/ui/Badge.tsx`: `variant="purple"`
- **Resolution**: Eliminate all purple, indigo, violet, pink. Admin and stats to use neutral / primary tokens.

### 3.3 Gradients & Heavy Tinted Surfaces
- `src/pages/GroupDetail.tsx`: `bg-gradient-to-r from-sky-600 via-primary-600 to-blue-700` header banner.
- `src/pages/GroupDetail.tsx`: `bg-emerald-500/10` mint-green background on balance card.
- `src/pages/LandingPage.tsx`: `bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-500` text gradient headline.
- `src/pages/Dashboard.tsx`: `bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10` banner.
- `src/pages/JoinGroup.tsx`, `Login.tsx`, `Register.tsx`: `bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950` page background.
- `src/components/ui/Button.tsx` & `Card.tsx`: `variant="gradient"` definitions.
- **Resolution**: Strip all gradients and replace with clean surface tokens and 1px borders.

---

## 4. Component Duplicates & Inconsistencies
| Component Area | Current Inconsistencies | Target Primitive (`src/components/ui/`) |
|---|---|---|
| **Buttons** | Solid red delete buttons (`bg-red-600`) inline with rows; ad-hoc button classes in pages. | Unified `Button` & `IconButton` (Delete uses `variant="danger-ghost"`). |
| **Stat Cards** | Multi-coloured icon bubbles on Dashboard, Loans, Subscriptions, Debts. | Unified `StatCard` (no icon bubbles, clean typography). |
| **Page Headers** | Inconsistent headers across pages; floating `+` button and `Quick Add` button coexisting on Desktop Dashboard. | Unified `PageHeader` (one primary action on desktop; FAB only on mobile). |
| **Tabs / Filters** | Pill tabs on Subscriptions, Debts; underline tabs in Settings; segmented controls on Predictions. | Unified `Tabs` (underline for sections, segmented control for horizons). |
| **Status Badges** | Multiple variants: `Unknown` (dark grey filled), `Split in Progress` (yellow outlined), `PENDING` (yellow filled), `Active` (green outlined). | Unified `Badge` / `StatusPill` with standard semantic tokens (`neutral`, `success`, `warning`, `danger`, `info`). |
| **Form Inputs** | Inconsistent heights, focus rings, select arrows; Settings `Timezone` misconfigured. | Unified `Input`, `Select`, `Textarea` with standard 40px height & focus ring. |
| **Tables / Lists** | Raw `<table>` elements with horizontal scroll on mobile phones. | Responsive `DataList` (table on desktop, stacked card rows on `<768px` mobile). |
| **Empty States** | Disparate empty state designs on Subscriptions & Groups; missing empty state on Transactions & Debts. | Unified `EmptyState` component with single Lucide icon. |
| **Modals & Dialogs** | Desktop modals without mobile bottom sheet behavior; destructive actions without confirmation dialog. | Unified `Modal` (Sheet on mobile) & `ConfirmDialog`. |

---

## 5. Content & Data-Display Bug List
1. **Raw ISO Timestamp**: `src/pages/GroupDetail.tsx:756, 866` renders `{req.expense_date}` directly as `2026-10-06T00:00:00.000Z`. Needs `formatDate()` / `formatDateTime()`.
2. **Inconsistent Currency & Money Formatting**: Mixed usage of `formatCurrency` with 0 vs 2 decimal places and varied formatting rules across pages. Needs single `src/lib/format.ts` formatter.
3. **Brand Name Discrepancies**: Codebase mixes `Trust Tracker`, `Trust-Tracker`, and `TrustTracker`. Unify to **TrustTracker** across all views, headers, legal copy, and exports.
4. **Category Label "Unknown"**: Null or unknown categories display as `Unknown` / `Unknown Category`. Change to **Uncategorized**.
5. **Timezone Default**: `src/pages/Settings.tsx` defaults fallback to `"America/New_York"` or `"UTC"`. Change default to user locale (`Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata"`).
6. **Misleading Predictions Claims**: `src/pages/Predictions.tsx` shows "High Confidence Projection" and "Predictive AI" from a single data point. Rename to **Spending Forecast** and show an "Insufficient data" state when records span < 3 months.
7. **Group Numbers Sanity Check**:
   - `Total group spending ₹993 / 4 records`: Represents cumulative expense records for the entire group.
   - `Your Group Balance ₹140`: Represents personal net balance owed to/from the user based on split shares.
   - *Conclusion*: Calculation math is logically distinct (Group gross spend vs User net balance), but UI cards lacked clear explanatory copy. Clear sub-labels will be added.
8. **Landing Page Fabricated Claims**:
   - Remove fake social proof ("Rated 4.9 by over 14,800 active trackers", "42,000+ group settlements").
   - Remove Testimonials section until authentic user quotes exist.
   - Replace complex hero gradient and chrome mock with clean screenshot and honest copy.

---

## 6. PWA & Standalone Behavior
- `public/manifest.json` defines `"start_url": "/"`, causing installed PWA launches to render the landing page.
- Need `isStandalone()` detection helper and immediate route redirect to `/dashboard` (or `/login` if unauthenticated).
- Exclude landing route from initial app bundle via lazy loading (`React.lazy`).

---

## 7. Baseline Verification Status
| Check | Tool / Command | Result | Baseline Status |
|---|---|---|---|
| **TypeScript Typecheck** | `npx tsc --noEmit` | Clean (0 errors) | ✅ Passed |
| **Production Build** | `npm run build` | Vite production bundle generated (42.11s) | ✅ Passed |
| **Linter** | `npm run lint` | 189 errors, 9 warnings (unused vars & explicit `any` in legacy files) | ⚠️ Baseline recorded |

---

## 8. Execution Roadmap
- **Phase 1 (docs/ui-audit)**: Baseline audit documented (Current phase).
- **Phase 2 (feat/design-tokens)**: Implement CSS variables, update Tailwind theme, remove hardcoded colors/purple/gradients.
- **Phase 3 (refactor/lucide-icons)**: Create `src/components/ui/icons.ts`, eliminate non-Lucide icons and emojis, clean `package.json`.
- **Phase 4 (refactor/ui-primitives)**: Build unified UI primitives (`Button`, `Card`, `StatCard`, `PageHeader`, `Tabs`, `Badge`, `Input`, `EmptyState`, `Modal`, `ConfirmDialog`, `ProgressBar`, `src/lib/format.ts`).
- **Phase 5 (feat/responsive-app-shell)**: Responsive desktop sidebar, mobile bottom navigation bar (`<768px`), mobile header & FAB rules.
- **Phase 6 (refactor/pages-consistency)**: Migrate all 13 application pages to shared primitives and fix data display bugs.
- **Phase 7 (feat/landing-redesign)**: Clean, honest, typographic landing page redesign.
- **Phase 8 (feat/pwa-standalone-routing)**: Standalone detection, PWA manifest update, route lazy-loading.
- **Phase 9 (chore/ui-qa-and-docs)**: Final QA verification, `docs/design-system.md`, and clean git history.
