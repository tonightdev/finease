# FinEase Engine Audit & Resolution History 🛡️

This document archives historical engine audits, edge case discoveries, and verification logs for the transaction calculation and account synchronization engines.

---

## 📋 Ledger Replay Engine Audit (March 2026)

### Audited Components

- `apps/api/src/finance/transactions.service.ts`
- `apps/api/src/finance/accounts.service.ts`
- `apps/web/components/transactions/TransactionModal.tsx`

---

### Resolved Items Log

#### 1. Debt Repayment Flow Handling

- **Observed Behavior**: Selecting an OUT transaction with a "Credit To" destination was routed as a standard transfer without applying principal and burned interest splits.
- **Resolution**: Updated `transactions.service.ts` and `recalculateBalances` so that any destination transaction targeting a `debt` account processes the principal and interest breakdown (`repaidCapital += principal`, `burnedInterest += interest`).
- **Status**: ✅ **Resolved and Verified**

#### 2. Investment Valuation vs Cost Basis Synchronization

- **Observed Behavior**: Direct balance updates on investment accounts risked corrupting cost basis calculations.
- **Resolution**: Separated market value (`balance`) from cost basis (`investedAmount`). Introduced `metadata.isBalanceSync` flag for absolute valuation syncing without mutating historical capital contributions.
- **Status**: ✅ **Resolved and Verified**

#### 3. Initial Baseline Deduplication

- **Observed Behavior**: Legacy accounts without explicit `initialAmount` risking double-counting during transaction replay.
- **Resolution**: Standardized baseline fallback: if `initialAmount` is missing and transactions exist, baseline floor starts at `0`.
- **Status**: ✅ **Resolved and Verified**

#### 4. Wealth Snapshot Account Synchronization

- **Observed Behavior**: Deleting or editing a Wealth Pulse snapshot only changed historical records without adjusting actual accounts.
- **Resolution**: Implemented bidirectional synchronization in `accounts.service.ts`:
  - Snapshot edit updates actual account balances in Firestore and Redux store.
  - Snapshot deletion rolls back actual account balances to their baseline state prior to that pulse.
- **Status**: ✅ **Resolved and Verified**

---

## 📋 Full-Stack Architecture Cleanup & API Payload Audit (October 2026)

### Audited Workspaces

- `apps/web` (Next.js 16 App Router)
- `apps/api` (NestJS 11 REST Services)
- `packages/types` (Shared domain interfaces)

---

### Resolved Items & Removals Log

#### 1. Dead & Obsolete Frontend Components Removal

- **Observed Behavior**: Early prototype charts and obsolete components remained in `apps/web/components/` without active imports.
- **Resolution**: Safely removed 13 stale files and folders:
  - `StatWidget.tsx` (superseded by `DashboardStatCard.tsx`)
  - `DashboardHeader.tsx` (superseded by `PageHeader.tsx`)
  - `ExpenseChart.tsx`, `IncomeExpenseChart.tsx`, `SavingsVelocityChart.tsx` (prototypes superseded by `NetWorthChart.tsx` and `AssetLiabilityDonut.tsx`)
  - `components/verification/` (`FileUploadZone.tsx`, `VerificationList.tsx`) and `lib/csv-parser.ts` (legacy upload replaced by `/transactions/import`)
  - `AccountList.tsx` and `TransferModal.tsx` (superseded by `AccountsTab.tsx` and `TransactionModal.tsx`)
  - `TrajectoryHistoryModal.tsx` (converted to standalone view in `/reports?tab=trajectory`; pruned from `GlobalModals.tsx` and `uiSlice.ts`)
  - `lib/mock-data.ts` (0 usages; app uses live Firestore data)
  - `store/slices/statsSlice.ts` (unused prototype slice; asset allocation computed live from accounts)
- **Status**: ✅ **Removed and Verified (20/20 routes compile cleanly)**

#### 2. Sensitive Data & Unused Response Key Pruning

- **Observed Behavior**:
  - `GET /finance/profile` returned raw user document fields including hashed `password`.
  - `GET /finance/debrief` calculated artificial `allocation` and `alerts` objects that were never consumed by the frontend.
- **Resolution**:
  - In `users.service.ts`, sanitized `findOne` and `findAll` to strip `password` from all HTTP responses.
  - In `accounts.service.ts`, stripped fake `allocation` and unused `alerts` arrays from `getMonthlyDebrief`, focusing the payload on cash flow (`inflow`, `outflow`, `netCashFlow`, `savingsRate`, `topGainer`, `topLeak`, `insight`, `hasSufficientData`).
  - In `@repo/types`, made `allocation?` and `alerts?` optional on `MonthlyDebrief`.
- **Status**: ✅ **Resolved and Verified**

#### 3. Session Entity Hydration

- **Observed Behavior**: `GET /auth/sessions` returned documents without `id: doc.id`, creating inconsistencies with `UserSession` typing.
- **Resolution**: Added `id: doc.id` mapping in `auth.service.ts`.
- **Status**: ✅ **Resolved and Verified**

#### 4. Goal Hard Delete Crash Prevention

- **Observed Behavior**: In `goal.service.ts`, calling hard delete (`hard === true`) deleted the document before reading its data for activity logging, causing a null pointer exception on `goalData.userId`.
- **Resolution**: Retrieved document data prior to invoking `docRef.delete()`.
- **Status**: ✅ **Resolved and Verified**

#### 5. Command Palette Simulation Shortcut

- **Observed Behavior**: Selecting "Start Simulation" in the Command Palette dispatched `isSimulationModalOpen`, which had no corresponding modal.
- **Resolution**: Updated the action in `CommandPalette.tsx` to route directly to `/simulation`.
- **Status**: ✅ **Resolved and Verified**
