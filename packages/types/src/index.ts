export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  displayName: string;
  gender?: "male" | "female" | "other" | "not_specified";
  dob?: string;
  phone?: string;
  monthStartDate?: number;
  role: UserRole;
  createdAt: string;
  budgetTargets?: {
    needs: number;
    wants: number;
    savings: number;
  };
  hasOnboarded?: boolean;
  lastActiveAt?: string;
  deletedAt?: string | null;
  preferences?: {
    theme?: "light" | "dark" | "system";
    language?: string;
    currency?: string;
  };
}

export type AccountType =
  | "bank"
  | "cash"
  | "debt"
  | "investment"
  | "card"
  | "asset";

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  assetType: string;
  balance: number;
  investedAmount?: number;
  initialAmount?: number;
  repaidCapital?: number;
  burnedInterest?: number;
  minimumBalance?: number;
  maxLimit?: number;
  currency: string;
  valuationAdjustment?: number;
  institutionName?: string;
  excludeFromAnalytics?: boolean;
  lastSyncedAt: string;
  deletedAt?: string | null;
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
  initialAmount?: number;
  deletedAt?: string | null;
}

export type CategoryParentType = "needs" | "wants" | "savings" | "income";

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  type?: "expense" | "income";
  parentType?: CategoryParentType;
  deletedAt?: string | null;
}

export interface AssetClass {
  id: string;
  userId: string;
  name: string;
  color: string;
  deletedAt?: string | null;
}

export type TransactionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "pending_confirmation"
  | "completed";
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
    isBalanceSync?: boolean;
    [key: string]: unknown;
  };
  isAutomated?: boolean;
  frequency?: TransactionFrequency;
  recurringCount?: string | number;
  balanceAfter?: number;
  toBalanceAfter?: number;
  deletedAt?: string | null;
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
export interface TransactionImportMapping {
  date: string;
  description: string;
  amount_single?: string;
  amount_debit?: string;
  amount_credit?: string;
  category?: string;
  type?: string;
}

export type TransactionImportStage =
  | "upload"
  | "password"
  | "mapping"
  | "review";

export interface RawTransactionData {
  [key: string]: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers24h: number;
  totalAssetsTracked: number;
  systemHealth: string;
  recentActivities: (ActivityLog & { id: string | number; time?: string })[];
  userGrowth: {
    day: string;
    count: number;
  }[];
}

export type ActivityType =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "signup"
  | "import"
  | "export";

export interface ActivityLog {
  userId: string;
  userEmail: string;
  userName: string;
  action: ActivityType;
  entityType: string; // e.g., 'transaction', 'account', 'user'
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  previousState?: unknown;
  newState?: unknown;
  timestamp: string;
}
export interface Reminder {
  id: string;
  userId: string;
  name: string;
  type: "policy" | "document" | "other";
  expiryDate: string;
  renewalAmount: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  deletedAt?: string | null;
}export interface UserSession {
  id: string; // Document ID (usually same as token or random ID)
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  lastActiveAt: string;
  userAgent?: string;
  ipAddress?: string;
  isPWA?: boolean;
  userName?: string;
}

export interface SimEntry {
  id: string;
  amount: string;
  isMonthly?: boolean;
  description: string;
  categoryId: string;
  categoryName: string;
  parentType: CategoryParentType;
  type: "income" | "outflow";
  accountId: string;
  accountName: string;
}

export interface BudgetSimulation {
  userId: string;
  basis?: "monthly" | "yearly";
  protocol: { needs: number; wants: number; savings: number };
  entries: SimEntry[];
  updatedAt?: string;
}

export interface SimulationResult {
  surplus: number;
  adherence: number;
  efficiency: number;
  suggestions: string[];
}

export interface STAccount {
  id: string;
  name: string;
  balance: number;
}

export interface STExpense {
  id: string;
  name: string;
  amount: number;
  accountId: string;
  isPaid: boolean;
}

export interface ShortTermPlan {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  accounts: STAccount[];
  expenses: STExpense[];
  deletedAt?: string | null;
}
