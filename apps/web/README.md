# FinEase Web App (Frontend) 💻

The Wealth Command Center interface for **FinEase**, built with [Next.js 16](https://nextjs.org/) (App Router) and [React 19](https://react.dev/).

---

## 🚀 Overview

- **Framework**: Next.js 16 (Turbopack, App Router)
- **State Management**: Redux Toolkit (`accounts`, `transactions`, `goals`, `strategies`, `ui`)
- **Styling**: Tailwind CSS with custom glassmorphism and executive dark-mode palettes
- **Motion & Dynamics**: Framer Motion for micro-animations and spring transitions
- **Data Visualization**: Recharts for Net Worth history and asset distribution
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
   - Hero Net Worth Trajectory with custom time horizons.
   - Minimalist Monthly Growth Debrief & Liquid Capital reserve widgets.
   - Pacing metrics for strategic financial goals.
2. **Wealth Pulse & Historical Trajectory**:
   - Multi-account batch sync modal.
   - Point-in-time snapshot editing with live Net Worth recalculation.
   - Modal-confirmed snapshot deletion with automatic Firestore rollback.
3. **Ghost Mode**:
   - One-click global privacy toggle masking all balances with `*****`.
4. **Analytics & Reports (`/reports`)**:
   - Inline Account dropdown filter and responsive Growth Log.

---

## 📚 Documentation Links

Full documentation is available in the root [`docs/`](../../docs/README.md) directory:

- [Architecture & Systems Overview](../../docs/architecture.md)
- [Transaction Logic & Wealth Synchronization](../../docs/transaction-logic.md)
- [Strategic Roadmap](../../docs/roadmap.md)
