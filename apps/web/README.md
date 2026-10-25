# FinEase Web App (Frontend) 💻

The Wealth Command Center interface for **FinEase**, built with [Next.js 16](https://nextjs.org/) (App Router) and [React 19](https://react.dev/).

---

## 🚀 Overview

- **Framework**: Next.js 16 (Turbopack, App Router)
- **State Management**: Redux Toolkit (`accounts`, `transactions`, `goals`, `strategies`, `user`, `categories`, `assetClasses`, `expiries`, `simulations`, `yearlyExpenses`, `ui`)
- **Styling**: Tailwind CSS with custom glassmorphism and executive dark-mode palettes
- **Motion & Dynamics**: Framer Motion for micro-animations and spring transitions
- **Data Visualization**: Recharts for Net Worth history, Monthly Growth pulse trends, and asset distribution
- **Icons**: Lucide React

---

## 📥 Getting Started

### Prerequisites

- Node.js (v20+)
- Yarn v4+
- Backend API running on `http://localhost:3001` (or configured via `.env.local`)

### Installation & Execution

```bash
# Run from workspace or root
yarn dev

# Validate types
yarn check-types

# Production build
yarn build
```

The web application runs on [http://localhost:3000](http://localhost:3000).

---

## 🎨 Key Interface Features

1. **Wealth Command Center (`/dashboard`)**:
   - Hero Net Worth Trajectory with custom time horizons (`1M`, `6M`, `1Y`, `ALL`) and responsive delta/% badges.
   - 3-Card Monthly Overview (`Period Inflow`, `Period Outflow`, `Net Cash Flow`) with executive insight and rate badges.
   - Consolidated Liquid Capital reserve widget with individual account balance progress indicators.
   - Real-time Asset & Liability Allocation donut computed directly from active account records.
   - Pacing metrics for strategic financial goals.
2. **Wealth Pulse & Historical Trajectory**:
   - Multi-account atomic batch sync modal.
   - Point-in-time snapshot editing with live Net Worth recalculation.
   - Modal-confirmed snapshot deletion with automatic Firestore rollback.
3. **Ghost Mode**:
   - One-click global privacy toggle masking all balances with `*****`.
4. **Analytics & Reports (`/reports`)**:
   - Monthly Growth & Trajectory Chart with baseline delta accumulation.
   - Historical Trajectory log with snapshot note inspection and deletion rollback.
   - Inline Account dropdown filter.

---

## 📚 Documentation Links

Full documentation is available in the root [`docs/`](../../docs/README.md) directory:

- [Architecture & Systems Overview](../../docs/architecture.md)
- [Transaction Logic & Wealth Synchronization](../../docs/transaction-logic.md)
- [Strategic Roadmap](../../docs/roadmap.md)
