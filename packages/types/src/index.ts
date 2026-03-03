export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  displayName: string;
  gender?: "male" | "female" | "other";
  dob?: string;
  role: UserRole;
  createdAt: string;
  budgetTargets?: {
    needs: number;
    wants: number;
    savings: number;
  };
}

export type AccountType = "bank" | "cash" | "debt" | "investment" | "card" | "asset";

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  assetType: string;
  balance: number;
  investedAmount?: number;
  initialAmount?: number;
  paidAmount?: number;
  interestPaid?: number;
  minimumBalance?: number;
  maxLimit?: number;
  currency: string;
  institutionName?: string;
  lastSyncedAt: string;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  startDate: string;
  category: string;
  icon?: string;
}

export type CategoryParentType = "needs" | "wants" | "savings" | "income";

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  type?: "expense" | "income";
  parentType?: CategoryParentType;
}

export interface AssetClass {
  id: string;
  userId: string;
  name: string;
  color: string;
}

export type TransactionStatus = "pending" | "approved" | "rejected" | "pending_confirmation" | "completed";
export type TransactionType = "income" | "expense" | "transfer";
export type TransactionFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  toAccountId?: string; // For transfers
  amount: number;
  interestAmount?: number;
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  status: TransactionStatus;
  metadata?: {
    originalInstitutionDescription?: string;
    isCashWithdrawal?: boolean;
  };
  isAutomated?: boolean;
  frequency?: TransactionFrequency;
  recurringCount?: string | number;
  balanceAfter?: number;
  toBalanceAfter?: number;
}

export interface DashboardStats {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorthHistory: { month: string; value: number }[];
  assetAllocation: { name: string; value: number; color: string }[];
  goalPacing: {
    goalId: string;
    goalName: string;
    actualPercentage: number;
    expectedPercentage: number;
    status: "ahead" | "behind" | "ontrack";
  }[];
}
