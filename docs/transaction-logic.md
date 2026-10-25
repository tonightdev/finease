# FinEase Transaction & Wealth Synchronization Engine 💳

> **Authoritative Source of Truth** for financial calculations, ledger replay, and wealth snapshot governance.

---

## 1. Ledger-First Recalculation Engine

FinEase adheres to a strict ledger architecture: **balances are never mutated without an audit trail**. The system can reconstruct exact account balances by replaying transactions chronologically from an `initialAmount` baseline.

### Recalculation Trigger

Any creation, update, or deletion of a transaction triggers `recalculateBalances(accountId)` for all affected accounts.

### Baseline Rules

| Condition                                    | Starting Balance Floor                                 |
| :------------------------------------------- | :----------------------------------------------------- |
| `initialAmount` is set                       | `Number(initialAmount)` (recorded at account creation) |
| `initialAmount` missing + transactions exist | `0` (prevents double counting)                         |
| `initialAmount` missing + no transactions    | Current `balance` (legacy fallback)                    |
| Account type is `debt` and balance > 0       | Stored as `-balance` (debt is always negative)         |

---

## 2. Account Classifications

| Type         | Description                                   | Sign | Valuation Tracking                                                   |
| :----------- | :-------------------------------------------- | :--: | :------------------------------------------------------------------- |
| `bank`       | Standard checking/savings accounts            | `+`  | Face value balance                                                   |
| `cash`       | Physical cash / liquid digital wallets        | `+`  | Face value balance                                                   |
| `card`       | Credit card liabilities                       | `+`  | Current outstanding debt                                             |
| `investment` | Mutual funds, stocks, equity indices          | `+`  | Tracks `balance` (market value) & `investedAmount` (cost basis)      |
| `debt`       | Loans, mortgages, personal obligations        | `-`  | Tracks `balance` (remaining debt), `repaidCapital`, `burnedInterest` |
| `asset`      | Physical assets (gold, real estate, vehicles) | `+`  | Current appraised value                                              |

---

## 3. Transaction Flow Protocols

### A. OUT (Expense)

Money leaves the user's ecosystem to an external party.

- **Source (`accountId`)**: `balance -= amount`
- **Investment Source**: `balance -= amount`, `investedAmount -= amount`
- **Credit To Destination (`toAccountId`)**: If user specifies a destination debt account, the engine splits the payment into principal and burned interest:
  - `debt.balance += principal`
  - `debt.repaidCapital += principal`
  - `debt.burnedInterest += interestAmount`
- **Net Worth Effect**: Decreases.

### B. IN (Income)

Money enters the system from an external source (salary, dividends, gifts).

- **Destination (`accountId`)**: `balance += amount`
- **Investment Destination**: `balance += amount` (yield; does not artificially inflate cost basis unless explicitly recorded as capital contribution).
- **Special Case — Valuation Sync (`metadata.isBalanceSync = true`)**:
  - `balance = amount` (absolute set of current portfolio valuation)
  - `investedAmount` remains unchanged to preserve historical ROI calculations.
- **Net Worth Effect**: Increases.

### C. MOVE (Transfer)

Money moves internally between two accounts belonging to the user.

- **Source**: `balance -= amount` (Investment source also deducts `investedAmount -= amount`).
- **Destination**:
  - Bank / Cash / Card: `balance += amount`
  - Investment: `balance += amount`, `investedAmount += amount` (capital contribution)
  - Debt: `balance += principal`, `repaidCapital += principal`, `burnedInterest += interest`
- **Net Worth Effect**: Zero (internal capital reallocation).

---

## 4. Wealth Pulse & Snapshot Synchronization

The Wealth Pulse protocol provides scheduled periodic reconciliation (e.g. month-end checkpoints) that synchronizes multiple accounts in a single atomic transaction.

### A. Batch Sync (`POST /finance/accounts/batch-sync`)

1. Reads all active accounts for user and records baseline balances.
2. Applies delta to each account (`initialAmount` for liquid, `valuationAdjustment` for investments).
3. Atomically updates account documents in Firestore.
4. Generates a `WealthSnapshot` checkpoint:
   - Recalculates `netWorth`, `totalAssets`, `totalLiabilities`, `liquidCapital`, and `investedCapital`.
   - Records an array of `AccountSnapshotItem` containing `{ accountId, accountName, type, previousBalance, balance, delta }`.

### B. Snapshot Editing (`PUT /finance/snapshots/:id`)

1. Updates the snapshot's note and recalculates all snapshot totals.
2. **Actual Account Synchronization**: For any account balance edited in the snapshot, the engine locates the actual account in Firestore, calculates the delta, and commits the updated balance in the same atomic batch.
3. Redux updates both `state.snapshots` and `state.items`.

### C. Snapshot Deletion (`DELETE /finance/snapshots/:id`)

1. Retrieves the snapshot's recorded `accountSnapshots`.
2. **Automatic Rollback**: Reverts every modified account in Firestore back to its `previousBalance` from before that pulse was recorded.
3. Deletes the snapshot document from `wealth_snapshots`.
4. Redux removes the snapshot and updates the active account items with the reverted balances.

---

## 5. Monthly Overview & Trajectory Telemetry

### A. Monthly Overview Cash Flow Engine (`GET /finance/debrief`)

FinEase provides a unified 30-day cash flow perspective that operates seamlessly whether a user tracks individual daily transactions or relies strictly on periodic Wealth Pulses:

1. **Transaction Primary Flow**:
   - The engine scans completed transactions from the start of the current calendar/fiscal month.
   - `inflow = sum(type == 'income')`
   - `outflow = sum(type == 'expense')`
2. **Pulse Delta Fallback**:
   - If no transactions are recorded for the period, the engine extracts the liquid accounts delta (`bank` and `cash`) from the latest recorded `WealthSnapshot`.
   - Positive liquid deltas populate `inflow`, negative deltas populate `outflow`.
   - `topGainer` identifies the individual liquid account with the largest positive inflow.
   - `topLeak` identifies the liquid account with the largest contraction.
3. **Savings & Growth Rate**:
   - When income exists: `savingsRate = (netCashFlow / inflow) * 100`.
   - When relying on pulse: `percentageDelta = (liquidDelta / baseLiquid) * 100`.

### B. Trajectory Chart Baseline & Accumulation

1. **Executive Net Worth Trend (`NetWorthChart.tsx`)**:
   - Takes historical monthly snapshots alongside the real-time live net worth.
   - Computes trend delta (`currentNW - startNW`) and trend percentage (`(delta / startNW) * 100`).
   - Cleanly separates numerical delta `(+₹1,500)` from percentage badge `[ ↗ +20.0% ]` to prevent text truncation across responsive mobile viewports.
2. **Monthly Growth Pulse Log (`MonthlyGrowthChart.tsx`)**:
   - Establishes a true historical starting baseline using the earliest snapshot's `previousNetWorth`.
   - Accumulates subsequent pulse deltas to visualize accurate multi-month wealth expansion curves.
