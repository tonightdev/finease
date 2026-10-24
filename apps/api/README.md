# FinEase API (Backend Service) ⚙️

The backend service for **FinEase**, built with [NestJS 11](https://nestjs.com/) and Google Cloud Firestore via the Firebase Admin SDK.

---

## 🚀 Overview

- **Framework**: NestJS 11 (Node.js runtime)
- **Database**: Cloud Firestore via Firebase Admin SDK
- **Authentication**: JWT-based security with Firebase token validation
- **Documentation**: Swagger / OpenAPI at `/api/docs`
- **Role**: Serves as the central intelligence engine, executing transaction replay logic, atomic batch account syncs, point-in-time wealth snapshot creation, and rollback operations.

---

## 📥 Getting Started

### Prerequisites

- Node.js (v20+)
- Yarn v4+
- Firebase service account credentials (`serviceAccountKey.json` or environment variables)

### Running the API

```bash
# Start in development watch mode
yarn workspace api start:dev

# Build for production
yarn workspace api build

# Run unit tests
yarn workspace api test
```

The API service runs on `http://localhost:3001` (Swagger docs available at `http://localhost:3001/api/docs`).

---

## 🏗️ Core API Modules & Endpoints

### 1. Finance & Accounts (`FinanceModule`)

- `GET /finance/accounts` — Fetch all accounts belonging to the authenticated user.
- `POST /finance/accounts/batch-sync` — Atomic multi-account balance update with Wealth Snapshot generation.
- `GET /finance/snapshots` — Retrieve historical wealth snapshots and trajectory log.
- `PUT /finance/snapshots/:id` — Update snapshot note and balances with live account sync in Firestore.
- `DELETE /finance/snapshots/:id` — Delete snapshot and roll back accounts to their previous balance.
- `GET /finance/debrief` — Compute monthly growth debrief, top gainers, and capital leakage metrics.
- `GET /finance/pulse-schedule` — Get scheduled review cadence and countdown.

### 2. Transactions & Ledger

- `GET /finance/transactions` — Ledger query with pagination, category, and date filtering.
- `POST /finance/transactions` — Create transaction and trigger ledger replay (`recalculateBalances`).

### 3. Goals & Strategies

- `GET /goals` — Goal velocity pacing and target milestone monitoring.
- `GET /strategies` — 50/30/20 and custom budget strategy protocol calculations.

---

## 📚 Documentation Links

Full documentation is available in the root [`docs/`](../../docs/README.md) directory:

- [Architecture & Systems Overview](../../docs/architecture.md)
- [Transaction Logic & Wealth Synchronization](../../docs/transaction-logic.md)
- [Strategic Roadmap](../../docs/roadmap.md)
