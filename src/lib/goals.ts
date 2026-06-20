import { addMonths } from 'date-fns'
import type { Goal, MonthlyRecord } from '@/types'

export interface GoalProgress {
  current: number
  progress: number // 0-100 (clamped)
  remaining: number // 남은 금액 (>= 0)
  achieved: boolean
  /** 자동 추세 기반 달성 예상 (현금 추세가 양수일 때만) */
  projection: {
    monthlyDelta: number // 월 평균 증가액
    monthsLeft: number
    date: Date
  } | null
}

/**
 * 목표의 현재 진행 금액을 구한다.
 * - networth/assets: 자산 현황에서 자동
 * - manual: 사용자가 입력한 currentAmount
 */
function getCurrentAmount(goal: Goal, netWorth: number, totalAssets: number): number {
  switch (goal.track) {
    case 'networth':
      return netWorth
    case 'assets':
      return totalAssets
    case 'manual':
      return goal.currentAmount ?? 0
  }
}

/** 최근 기록들로 추적 지표의 월 평균 증가액을 추정한다. */
function estimateMonthlyDelta(goal: Goal, records: MonthlyRecord[]): number | null {
  if (goal.track === 'manual') return null
  const recent = records.slice(-6)
  if (recent.length < 2) return null
  const pick = (r: MonthlyRecord) => (goal.track === 'networth' ? r.netWorth : r.totalAssets)
  const first = pick(recent[0])
  const last = pick(recent[recent.length - 1])
  const delta = (last - first) / (recent.length - 1)
  return delta
}

export function computeGoalProgress(
  goal: Goal,
  netWorth: number,
  totalAssets: number,
  records: MonthlyRecord[],
): GoalProgress {
  const current = getCurrentAmount(goal, netWorth, totalAssets)
  const target = goal.targetAmount || 0
  const progress = target > 0 ? Math.min(Math.max((current / target) * 100, 0), 100) : 0
  const remaining = Math.max(target - current, 0)
  const achieved = target > 0 && current >= target

  let projection: GoalProgress['projection'] = null
  if (!achieved && remaining > 0) {
    const monthlyDelta = estimateMonthlyDelta(goal, records)
    if (monthlyDelta && monthlyDelta > 0) {
      const monthsLeft = Math.ceil(remaining / monthlyDelta)
      projection = {
        monthlyDelta,
        monthsLeft,
        date: addMonths(new Date(), monthsLeft),
      }
    }
  }

  return { current, progress: Math.round(progress), remaining, achieved, projection }
}
