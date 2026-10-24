# FinEase — Sovereign Wealth Architect & Goal Navigator 💎

A monorepo personal finance and wealth management platform built with **Next.js 16**, **NestJS 11**, **Firebase Firestore**, and **Turborepo**.

FinEase treats personal finance as an architectural discipline, providing the precision, telemetry, and governance needed to monitor, model, and scale multi-asset capital.

---

## 🗂️ Project Structure

```
finease/
├── apps/
│   ├── web/                    # Next.js 16 App Router (Wealth Command Center)
│   └── api/                    # NestJS 11 REST API & Analytics Service
├── packages/
│   ├── types/                  # Shared TypeScript interfaces & DTO contracts
│   ├── ui/                     # Shared glassmorphic UI components
│   ├── eslint-config/          # Standard ESLint configuration
│   └── typescript-config/      # Root tsconfig definitions
└── docs/                       # Centralized engineering & functional documentation
    ├── architecture.md         # Monorepo architecture & data flow
    ├── transaction-logic.md    # Ledger replay, flow types, & batch sync rules
    ├── roadmap.md              # Strategic product roadmap & completed phases
    └── audit-history.md        # Engine audit findings & resolved edge cases
```

---

## 🚀 Key Features

### 📊 Wealth Intelligence & Command Center

- **Executive Net Worth Trajectory**: Real-time tracking of net worth, asset allocation, and capital retention velocity.
- **Minimalist Monthly Growth Debrief**: Automated debrief card spotlighting top capital gainers, savings efficiency, and leakage areas.
- **Liquid Capital Widget**: Consolidated view of all cash reserves and bank accounts without dashboard clutter.
- **Goal Velocity Navigator**: Financial North Stars (Retirement, Emergency Fund, Home) with automated monthly pacing requirements.

### ⚡ Wealth Pulse & Trajectory Protocol

- **Atomic Multi-Account Sync**: Instant checkpoint synchronizations across liquid, investment, and liability accounts.
- **Point-in-Time Wealth Snapshots**: Historical trajectory logs with delta calculations.
- **Bidirectional Account Synchronization**: Editing or deleting a snapshot automatically synchronizes or rolls back actual account balances in Firestore and Redux.
- **Cadence Scheduling**: Configurable monthly cadence with next review countdowns.

### 🔒 Privacy & Security Protocols

- **Ghost Mode**: One-click global toggle that masks all financial numbers with `*****` for screen sharing or public spaces.
- **Non-Dismissible Modals**: Strict modal protection preventing accidental closing on backdrop clicks.
- **Biometric & PIN Lock**: Client-side security gateway supporting biometric and passkey protection.

### 📈 Analytics & Reports

- **Inline Account Filter**: Account selector integrated into the header bar without drawer clutter.
- **Mobile-Optimized Growth Log**: Clean collapsed cards with expandable details displaying full timestamp and check-in notes.

---

## 🛠️ Quick Start

### Prerequisites

- **Node.js**: v20+
- **Yarn**: v4+ (Berry)
- A [Firebase](https://firebase.google.com/) project with **Authentication** and **Firestore** enabled.

### Commands

```bash
# Install dependencies
yarn install

# Start development servers (Web on :3000, API on :3001)
yarn dev

# Validate TypeScript across all packages
yarn check-types

# Run ESLint across all workspaces
yarn lint

# Format code with Prettier
yarn format

# Build all applications for production
yarn build
```

---

## 📖 Detailed Documentation

All comprehensive documentation is consolidated in the [`/docs`](./docs/README.md) directory:

- 🏛️ **[Architecture & Systems Overview](./docs/architecture.md)**
- 💳 **[Transaction Engine & Synchronization Logic](./docs/transaction-logic.md)**
- 🚀 **[Strategic Product Roadmap](./docs/roadmap.md)**
- 🛡️ **[Engine Audit & Resolution History](./docs/audit-history.md)**

---

## 📝 License

UNLICENSED — Private sovereign project.
