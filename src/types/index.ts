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
  memberRoles?: Record<string, UserRole> // uid → 역할 (남편/아내 중복 방지용)
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
    // 투자/연금 계좌 메타데이터 (수익률·평가손익 계산 및 표시용 — lib/asset.ts 참고)
    principal?: number // 투자/납입 원금 (balance와 비교해 수익률 계산)
    accountCash?: number // 계좌 내 미투자 현금(예수금)
    holdings?: string // 보유 종목 메모 (예: '삼성전자, S&P500 ETF')
  }
}

// 재무 목표 (couples/{coupleId}/goals/{goalId})
// 무엇을 기준으로 진행률을 잴지(track)와 목표 금액·기한을 저장한다.
export type GoalTrack = 'networth' | 'assets' | 'manual'

export const GOAL_TRACK_LABELS: Record<GoalTrack, string> = {
  networth: '순자산 기준 (자동)',
  assets: '총자산 기준 (자동)',
  manual: '직접 입력',
}

export const GOAL_TRACK_HINTS: Record<GoalTrack, string> = {
  networth: '현재 순자산이 자동으로 진행 금액이 돼요.',
  assets: '현재 총자산이 자동으로 진행 금액이 돼요.',
  manual: '이 목표를 위해 모은 금액을 직접 입력해요.',
}

export const GOAL_EMOJI_PRESETS = ['🏠', '✈️', '🚗', '🛟', '👶', '🌴', '💍', '🎓', '💰', '🎯']

export interface Goal {
  id: string
  coupleId: string
  name: string
  emoji?: string
  track: GoalTrack
  targetAmount: number
  currentAmount?: number // manual track 전용
  targetDate?: string // 'YYYY-MM-DD' (선택)
  createdAt: Timestamp
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

// 수입은 한 명·한 항목이 아니다. 명의(남편/아내) × 항목(월급/부수입/보너스 등)으로 담는다.
// 지출은 공동 풀이라 합계만 둔다.
export type IncomeOwner = 'husband' | 'wife'

export interface IncomeItem {
  owner: IncomeOwner
  label: string // '월급', '부수입', '보너스' 등
  amount: number
}

// 자주 쓰는 수입 항목 라벨 프리셋 (자유 입력도 허용)
export const INCOME_LABEL_PRESETS = ['월급', '부수입', '보너스', '사업소득', '이자/배당', '용돈', '기타']

export interface MonthlyRecord {
  id: string // = month 'YYYY-MM'
  month: string // 'YYYY-MM'
  coupleId: string
  income: number // 합계 (= incomeItems 총합). 추이 차트·하위호환용
  incomeItems?: IncomeItem[] // 명의별·항목별 수입 (구버전 기록엔 없을 수 있음)
  expense: number
  entries: MonthlyRecordEntry[]
  totalAssets: number
  totalDebt: number
  netWorth: number
  updatedBy: string
  updatedByName?: string
  updatedAt: Timestamp
}
