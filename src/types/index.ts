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

export type AssetType = 'deposit' | 'stock' | 'pension' | 'debt'

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
  stock: '주식/ETF',
  pension: '연금',
  debt: '부채',
}

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
