export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export type AccountType = "bank" | "cash" | "loan" | "investment" | "card" | "asset";

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

export type TransactionStatus = "pending" | "approved" | "rejected";
export type TransactionType = "income" | "expense" | "transfer";

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
  frequency?: string;
  recurringCount?: string | number;
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
