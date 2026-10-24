# FinEase Documentation Index 📚

Welcome to the central documentation hub for **FinEase — Sovereign Wealth Architect**.

This directory contains the authoritative architecture, domain rules, operational playbooks, and strategic roadmap for the FinEase monorepo.

---

## 📑 Documentation Directory

| Document                                                        | Description                                                                                                                                   |
| :-------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| **[Architecture & Systems Overview](./architecture.md)**        | Full monorepo structure, Next.js 16 frontend, NestJS 11 backend, Firebase Firestore data schema, and security protocols.                      |
| **[Transaction & Wealth Engine Logic](./transaction-logic.md)** | Authoritative ledger replay rules (`recalculateBalances`), flow types (`IN`, `OUT`, `MOVE`), valuation tracking, and Wealth Pulse batch sync. |
| **[Strategic Product Roadmap](./roadmap.md)**                   | Comprehensive evolution from foundation to autonomous wealth strategist, with all completed phases and milestones.                            |
| **[Audit & Resolution History](./audit-history.md)**            | Historic transaction engine audit findings, balance recalculation edge cases, and resolved issues log.                                        |

---

## 🛠️ Quick Operational Commands

```bash
# Start all services concurrently (Web on :3000, API on :3001)
yarn dev

# Validate TypeScript across all packages
yarn check-types

# Run ESLint across all workspaces
yarn lint

# Format all code files with Prettier
yarn format

# Run full Turborepo production build
yarn build
```

---

## 🏛️ Monorepo Blueprint

```
finease/
├── apps/
│   ├── api/                   # NestJS 11 REST API service (Port 3001)
│   └── web/                   # Next.js 16 App Router frontend (Port 3000)
├── packages/
│   ├── types/                 # Shared TypeScript domain contracts & DTOs
│   ├── ui/                    # Shared core design tokens & components
│   ├── eslint-config/         # Standardized ESLint rule configurations
│   └── typescript-config/     # Unified tsconfig bases
└── docs/                      # Centralized documentation repository
```
