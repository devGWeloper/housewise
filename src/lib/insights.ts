import type { MonthlyRecord } from '@/types'

/**
 * 월별 기록만으로 계산하는 증감 인사이트.
 * 스키마 변경 없이 records(MonthlyRecord[])만 가지고 순수 함수로 산출한다.
 *
 * 핵심 분해식:
 *   순자산 증가 = 저축(수입 − 지출) + 자산가치 변동(평가손익 등 나머지)
 *   valuationChange = netWorthChange − savings
 */
export interface MonthlyInsight {
  month: string
  netWorth: number
  prevMonth: string | null
  prevNetWorth: number | null
  /** 전월 대비 순자산 증감액 (전월 기록이 없으면 null) */
  netWorthChange: number | null
  /** 전월 대비 순자산 증감률 (%) */
  netWorthChangePct: number | null
  income: number
  expense: number
  /** 저축 = 수입 − 지출 */
  savings: number
  /** 자산가치 변동 = 순자산 증감 − 저축 (전월 기록 없으면 null) */
  valuationChange: number | null
  /** 저축률 = 저축 / 수입 (수입이 0이면 null) */
  savingsRate: number | null
}

/** 해당 월의 인사이트를 계산한다. 그 달 기록이 없으면 null. */
export function computeInsight(records: MonthlyRecord[], month: string): MonthlyInsight | null {
  const current = records.find((r) => r.month === month)
  if (!current) return null

  // 해당 월 이전 가장 최근 기록 (records는 month asc 정렬되어 들어온다)
  const prev = [...records]
    .filter((r) => r.month < month)
    .sort((a, b) => (a.month < b.month ? 1 : -1))[0]

  const income = current.income ?? 0
  const expense = current.expense ?? 0
  const savings = income - expense

  const netWorth = current.netWorth
  const prevNetWorth = prev ? prev.netWorth : null
  const netWorthChange = prevNetWorth === null ? null : netWorth - prevNetWorth
  const netWorthChangePct =
    prevNetWorth === null || prevNetWorth === 0
      ? null
      : (netWorthChange! / Math.abs(prevNetWorth)) * 100
  const valuationChange = netWorthChange === null ? null : netWorthChange - savings
  const savingsRate = income > 0 ? (savings / income) * 100 : null

  return {
    month,
    netWorth,
    prevMonth: prev ? prev.month : null,
    prevNetWorth,
    netWorthChange,
    netWorthChangePct,
    income,
    expense,
    savings,
    valuationChange,
    savingsRate,
  }
}

export interface SavingsRatePoint {
  month: string
  savingsRate: number
}

/** 수입이 있는 달의 저축률 추이 (오래된 순). */
export function savingsRateTrend(records: MonthlyRecord[]): SavingsRatePoint[] {
  return records
    .filter((r) => (r.income ?? 0) > 0)
    .map((r) => ({
      month: r.month,
      savingsRate: (((r.income ?? 0) - (r.expense ?? 0)) / (r.income ?? 0)) * 100,
    }))
}

/**
 * 최근 n개월(수입이 있는 달 기준) 평균 저축률. 데이터가 없으면 null.
 * n을 지정하지 않으면 전체 기간 평균.
 */
export function averageSavingsRate(records: MonthlyRecord[], n?: number): number | null {
  const points = savingsRateTrend(records)
  if (points.length === 0) return null
  const sliced = n ? points.slice(-n) : points
  const sum = sliced.reduce((acc, p) => acc + p.savingsRate, 0)
  return sum / sliced.length
}

/**
 * 최근 n개월 평균 월간 순자산 증가액. (연속/비연속 무관, 인접 기록 간 차이의 평균)
 * 목표 ETA 계산 등에 사용. 기록이 2개 미만이면 null.
 */
export function averageMonthlyNetWorthChange(records: MonthlyRecord[], n = 6): number | null {
  if (records.length < 2) return null
  const sorted = [...records].sort((a, b) => (a.month < b.month ? -1 : 1))
  const deltas: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    deltas.push(sorted[i].netWorth - sorted[i - 1].netWorth)
  }
  const recent = deltas.slice(-n)
  if (recent.length === 0) return null
  return recent.reduce((acc, d) => acc + d, 0) / recent.length
}
