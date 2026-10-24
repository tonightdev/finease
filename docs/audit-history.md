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
