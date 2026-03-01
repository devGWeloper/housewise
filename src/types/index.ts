import type { Timestamp } from 'firebase/firestore'

export type TransactionType = 'income' | 'expense'

export type ExpenseCategory =
  | '식비'
  | '외식'
  | '교통'
  | '생활용품'
  | '의료'
  | '문화/여가'
  | '패션'
  | '기타지출'

export type IncomeCategory = '월급' | '부수입' | '용돈' | '기타수입'

export type Category = ExpenseCategory | IncomeCategory

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  '식비', '외식', '교통', '생활용품', '의료', '문화/여가', '패션', '기타지출',
]

export const INCOME_CATEGORIES: IncomeCategory[] = [
  '월급', '부수입', '용돈', '기타수입',
]

export const CATEGORY_COLORS: Record<Category, string> = {
  '식비': '#ef4444',
  '외식': '#f97316',
  '교통': '#eab308',
  '생활용품': '#22c55e',
  '의료': '#06b6d4',
  '문화/여가': '#3b82f6',
  '패션': '#8b5cf6',
  '기타지출': '#6b7280',
  '월급': '#10b981',
  '부수입': '#14b8a6',
  '용돈': '#f59e0b',
  '기타수입': '#64748b',
}

export type UserRole = 'husband' | 'wife'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: UserRole
  coupleId: string | null
  createdAt: Timestamp
}

export interface Couple {
  id: string
  members: string[]
  inviteCode: string
  createdAt: Timestamp
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: Category
  memo: string
  date: Timestamp
  createdBy: string
  createdByName: string
  coupleId: string
  createdAt: Timestamp
}

export interface CategoryBudget {
  category: ExpenseCategory
  amount: number
}

export interface Budget {
  id: string
  month: string // 'YYYY-MM'
  totalBudget: number
  categoryBudgets: CategoryBudget[]
  coupleId: string
}

export interface FixedCost {
  id: string
  name: string
  amount: number
  payDay: number // 1-31
  category: ExpenseCategory
  isActive: boolean
  coupleId: string
  createdBy: string
}

export type AssetType = 'deposit' | 'stock' | 'pension' | 'debt'

export interface Asset {
  id: string
  assetType: AssetType
  name: string
  balance: number
  coupleId: string
  details: {
    bankName?: string
    accountAlias?: string
    maturityDate?: string
    stockName?: string
    pensionType?: '국민연금' | '개인연금'
    loanName?: string
    monthlyPayment?: number
    originalAmount?: number
  }
}
