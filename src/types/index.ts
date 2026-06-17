import type { Timestamp } from 'firebase/firestore'

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

export type AssetType =
  | 'deposit'
  | 'cash'
  | 'stock'
  | 'crypto'
  | 'pension'
  | 'realestate'
  | 'debt'

// 투자 수익률(원금 대비)을 따지는 자산 종류
export const INVESTMENT_TYPES: AssetType[] = ['stock', 'crypto']

// 자산 명의 (맞벌이 부부 공동 관리 - 누구 통장인지)
export type AssetOwner = 'husband' | 'wife' | 'joint'

export const ASSET_OWNER_LABELS: Record<AssetOwner, string> = {
  husband: '남편',
  wife: '아내',
  joint: '공동',
}

export const ASSET_OWNER_COLORS: Record<AssetOwner, string> = {
  husband: '#3b82f6',
  wife: '#ec4899',
  joint: '#14b8a6',
}

export const ASSET_OWNERS: AssetOwner[] = ['husband', 'wife', 'joint']

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  deposit: '예금/적금',
  cash: '현금',
  stock: '주식/ETF',
  crypto: '코인',
  pension: '연금',
  realestate: '부동산',
  debt: '부채',
}

// 자산 구성 파이/배지 색상
export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  deposit: '#3b82f6',
  cash: '#22c55e',
  stock: '#8b5cf6',
  crypto: '#f59e0b',
  pension: '#06b6d4',
  realestate: '#ec4899',
  debt: '#ef4444',
}

// 입력/표시 순서 (자산 → 부채)
export const ASSET_TYPE_ORDER: AssetType[] = [
  'deposit',
  'cash',
  'stock',
  'crypto',
  'pension',
  'realestate',
  'debt',
]

export interface Asset {
  id: string
  assetType: AssetType
  name: string
  balance: number
  owner: AssetOwner
  purpose?: string // 이 통장의 용도 (예: 투자용, 공과금 자동이체, 비상금)
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
    principal?: number // 투자원금 (주식/코인 수익률 계산용)
  }
}

// 월별 입력 기록 (couples/{coupleId}/monthlyRecords/{YYYY-MM})
// 그 달의 수입/지출 + 각 자산/부채/주식 잔액을 한 번에 기록한다.
export interface MonthlyRecordEntry {
  assetId: string
  name: string
  assetType: AssetType
  owner: AssetOwner
  balance: number
}

// 부부 공동 설정 (couples/{coupleId}/settings/main)
export interface CoupleSettings {
  netWorthGoal?: number
  targetDate?: string // 'YYYY-MM-DD'
}

export interface MonthlyRecord {
  id: string // = month 'YYYY-MM'
  month: string // 'YYYY-MM'
  coupleId: string
  income: number
  expense: number
  entries: MonthlyRecordEntry[]
  totalAssets: number
  totalDebt: number
  netWorth: number
  updatedBy: string
  updatedByName?: string
  updatedAt: Timestamp
}
