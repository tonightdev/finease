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

- `GET /finance/profile` — Fetch current user profile metadata (passwords strictly sanitized).
- `PUT /finance/profile` — Update user profile details.
- `GET /finance/accounts` — Fetch all accounts belonging to the authenticated user.
- `POST /finance/accounts/batch-sync` — Atomic multi-account balance update with Wealth Snapshot generation.
- `GET /finance/snapshots` — Retrieve historical wealth snapshots and trajectory log.
- `PUT /finance/snapshots/:id` — Update snapshot note and balances with live account sync in Firestore.
- `DELETE /finance/snapshots/:id` — Delete snapshot and roll back accounts to their previous balance.
- `GET /finance/debrief` — Compute 30-day cash flow debrief (`inflow`, `outflow`, `netCashFlow`, `savingsRate`, `topGainer`, `topLeak`, `insight`).
- `GET /finance/pulse-schedule` — Get scheduled review cadence and countdown.

### 2. Transactions & Ledger

- `GET /finance/transactions` — Ledger query with pagination, category, and date filtering.
- `POST /finance/transactions` — Create transaction and trigger ledger replay (`recalculateBalances`).
- `POST /finance/recalculate` — System repair tool recalculating all account balances and goal pacing from ledger.

### 3. Authentication & Sessions (`AuthModule`)

- `POST /auth/login` & `POST /auth/signup` — Token authentication with device metadata tracking.
- `GET /auth/sessions` — Active authorization sessions registry (`UserSession`).
- `POST /auth/sessions/revoke` — Revoke individual session token.
- `POST /auth/sessions/revoke-others` — Revoke all other active device sessions.

### 4. Goals, Strategies & Simulations

- `GET /finance/goals` — Goal velocity pacing and target milestone monitoring.
- `GET /finance/strategy` & `POST /finance/strategy` — 50/30/20 and custom budget strategy protocol state.
- `GET /finance/simulations` — Forward-looking scenario sandbox for major life capital events.
- `GET /finance/yearly-expenses` — Annual commitments and recurring obligations.

---

## 📚 Documentation Links

Full documentation is available in the root [`docs/`](../../docs/README.md) directory:

- [Architecture & Systems Overview](../../docs/architecture.md)
- [Transaction Logic & Wealth Synchronization](../../docs/transaction-logic.md)
- [Strategic Roadmap](../../docs/roadmap.md)
