# TrustTracker Design System

Welcome to the **TrustTracker** design system documentation. This document serves as the single source of truth for design tokens, typography, component primitives, formatting conventions, icon usage, and responsive layout guidelines.

---

## 1. Design Tokens

All colors, radii, shadows, and spacing are defined as CSS variables in `src/index.css` and mirrored in `tailwind.config.js`. **No component may hard-code hex colors, arbitrary border radii, or box shadows.**

### 1.1 Brand & Neutral Surfaces

The brand uses a sky/cyan primary hue paired with neutral slate background surfaces.

| Token | Light Value | Dark Value | Purpose / Usage |
|---|---|---|---|
| `--primary` | `#0284C7` | `#38BDF8` | Primary buttons, active nav, focus rings, links |
| `--primary-hover` | `#0369A1` | `#7DD3FC` | Hover and active pressed states |
| `--primary-subtle` | `#E0F2FE` | `rgba(56,189,248,0.12)` | Active nav backgrounds, selected tabs, info badges |
| `--bg` | `#F8FAFC` | `#0B1120` | Application root background |
| `--surface` | `#FFFFFF` | `#111827` | Cards, sidebar, modal dialogs, input surfaces |
| `--surface-muted` | `#F1F5F9` | `#1E293B` | Table headers, progress tracks, disabled elements |
| `--border` | `#E2E8F0` | `#1F2937` | Dividers, borders, outlines |
| `--text` | `#0F172A` | `#F1F5F9` | Primary headings, table text, body copy |
| `--text-muted` | `#64748B` | `#94A3B8` | Secondary labels, captions, metadata |

### 1.2 Semantic Colors

Colors are reserved strictly for meaning (money flow, warnings, and state confirmations).

| Token | Light Value | Dark Value | Meaning / Usage |
|---|---|---|---|
| `--success` | `#059669` | `#34D399` | Income, "owed to you", paid, settled |
| `--success-subtle` | `#ECFDF5` | `rgba(5,150,105,0.15)` | Success badges, positive alerts |
| `--danger` | `#DC2626` | `#F87171` | Expenses, "you owe", overdue, destructive actions |
| `--danger-subtle` | `#FEF2F2` | `rgba(220,38,38,0.15)` | Expense badges, destructive alerts |
| `--warning` | `#D97706` | `#FBBF24` | Pending approval, nearing budget limit (80%+) |
| `--warning-subtle` | `#FFFBEB` | `rgba(217,119,6,0.15)` | Warning badges, pending status rows |

> **Rule:** No purple, indigo, violet, pink, or gradient backgrounds. Super Admin, Predictions, and Subscriptions use primary and neutral tokens.

### 1.3 Typography

- **Font Family:** `Plus Jakarta Sans`, system fallback (`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
- **Scale:** `12px` (captions/badges), `14px` (app body), `16px` (landing body / inputs), `20px` (card headers), `24px` (page headers), `32px` / `48px` (hero headlines).
- **Weights:** 400 (regular), 500 (medium), 600 (semibold). No 800/900 weights.
- **Numbers:** All monetary amounts and stats must use tabular numbers (`font-variant-numeric: tabular-nums`).

### 1.4 Spacing, Radii & Elevation

- **Grid Base:** 4px base grid (4, 8, 12, 16, 24, 32, 48).
- **Radius Tokens:**
  - `--radius-sm`: `8px` (Inputs, buttons, small chips)
  - `--radius-md`: `12px` (Cards, panels, content blocks)
  - `--radius-lg`: `16px` (Modals, bottom sheets)
  - `--radius-full`: `9999px` (Status badges and avatars)
- **Shadows:**
  - `--shadow-xs`: Subtle card elevation
  - `--shadow-sm`: Standard surface elevation
  - `--shadow-md`: Floating panels, dropdowns, dialog overlays

---

## 2. Icon Policy: Lucide Only

To eliminate icon bloat and rendering discrepancies:

1. **Only Lucide Icons:** All icons must be imported from the central wrapper `src/components/ui/icons.ts`.
2. **No Emoji / Text Glyphs:** No flag emojis, hourglasses, or unicode icons in the UI. Currency selectors display clean text (e.g. `INR (₹) - Indian Rupee`).
3. **Sizing & Stroke Standard:**
   - Nav & Primary Actions: `size={18}`
   - Inline / Pills / Small Buttons: `size={14}` - `size={16}`
   - Section Headers / Empty States: `size={20}` - `size={24}`
   - Stroke Width: `1.75`
   - Color: `currentColor` (inherits text color)
4. **Accessible Icon Buttons:** Icon-only buttons must include `aria-label` and `title`.

---

## 3. Standard UI Components

All components are located in `src/components/ui/` and must be consumed across all pages.

### 3.1 Button & IconButton (`src/components/ui/Button.tsx`)
```tsx
import { Button, IconButton } from "../components/ui/Button";
import { Icons } from "../components/ui/icons";

<Button variant="primary" icon={<Icons.Add size={16} />} onClick={handleAdd}>
  Add Record
</Button>

<IconButton
  variant="danger"
  ariaLabel="Delete record"
  icon={<Icons.Delete size={14} />}
  onClick={() => setRecordToDelete(id)}
/>
```
- **Variants:** `primary`, `secondary`, `ghost`, `danger`.
- **Sizes:** `sm` (32px), `md` (40px), `lg` (48px).

### 3.2 Card & StatCard (`src/components/ui/Card.tsx`, `src/components/ui/StatCard.tsx`)
```tsx
<StatCard
  label="Monthly Expenses"
  value={formatMoney(24500, "INR")}
  variant="danger"
  helperText="Down 8% from last month"
/>
```
- Standardized 1px border, surface background, `--radius-md`.
- No colored decorative bubbles in stat cards.

### 3.3 PageHeader (`src/components/ui/PageHeader.tsx`)
```tsx
<PageHeader
  title="Transactions"
  description="Manage all your income and expense records in one place."
  secondaryActions={<Button variant="secondary">Export</Button>}
  action={<Button variant="primary">Add Transaction</Button>}
/>
```
- Unifies header layout across desktop and mobile. Single primary action collapses below the title on phones.

### 3.4 Tabs (`src/components/ui/Tabs.tsx`)
```tsx
<Tabs
  tabs={[
    { id: "all", label: "All Records" },
    { id: "expenses", label: "Expenses" },
    { id: "income", label: "Income" },
  ]}
  activeTab={tab}
  onChange={setTab}
  variant="underline" // or "segmented"
/>
```

### 3.5 Badge / StatusPill (`src/components/ui/Badge.tsx`)
- Variants: `neutral`, `success`, `warning`, `danger`, `info`.
- Subtle background tint with matching accessible text color.

### 3.6 Form Controls (`src/components/ui/Input.tsx`)
- `Input`, `Select`, `Textarea`.
- Height: 40px standard. Labels always above. Mobile input font size is minimum 16px to prevent iOS auto-zoom.

### 3.7 DataList (`src/components/ui/DataList.tsx`)
- Desktop (≥768px): clean semantic table with uppercase muted headers.
- Mobile (<768px): responsive stacked cards, eliminating horizontal overflow.

### 3.8 ConfirmDialog & Modal (`src/components/ui/ConfirmDialog.tsx`, `src/components/ui/Modal.tsx`)
- Modal: Centered dialog on desktop, bottom sheet on mobile.
- ConfirmDialog: Required for every destructive delete or ban action.

---

## 4. Single Source of Truth Formatters (`src/lib/format.ts`)

| Function | Example Input | Formatted Output |
|---|---|---|
| `formatMoney(amount, currency)` | `1420.5, "INR"` | `₹1,420.50` |
| `formatDate(date)` | `"2026-10-06T00:00:00.000Z"` | `6 Oct 2026` |
| `formatDateTime(date)` | `"2026-10-06T13:01:00.000Z"` | `6 Oct 2026, 1:01 pm` |
| `formatTime(date)` | `"2026-10-06T13:01:00.000Z"` | `1:01 pm` |
| `formatCategory(c)` | `null` or `"Unknown"` | `Uncategorized` |

> **Rule:** Never render raw ISO timestamp strings in the user interface.

---

## 5. Responsive Shell & PWA Standalone Rules

### 5.1 Breakpoints & Layout
- **Desktop (≥1024px):** Fixed left sidebar (240px), top bar with theme toggle and user menu. No floating action button.
- **Mobile (<768px):** Bottom navigation tab bar with 4 core tabs (Dashboard, Transactions, Analytics, More) + single Floating Action Button (Quick Add).
- Safe area support via `padding-bottom: env(safe-area-inset-bottom)` and `viewport-fit=cover`.

### 5.2 Standalone PWA Launch
- In `public/manifest.json`: `"start_url": "/dashboard?source=pwa"`, `"display": "standalone"`.
- `isStandalone()` detection in `src/lib/pwa.ts` immediately replaces the route to `/dashboard` (if authenticated) or `/login` (if unauthenticated), ensuring the landing page is never shown inside the installed app.
- All app pages and landing page are code-split via `React.lazy` and `Suspense`.
