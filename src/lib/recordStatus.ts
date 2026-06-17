import type { Timestamp } from 'firebase/firestore'
import type { MonthlyRecord } from '@/types'
import { getPrevMonth } from '@/lib/format'

/**
 * 월별 기록 현황을 records만으로 계산한다. (스키마 변경 없음)
 * - 이번 달 입력 여부
 * - 연속 기록 스트릭
 * - 최근 12개월 중 빠진 달
 * - 마지막 입력자/시각
 */
export interface RecordStatus {
  hasAnyRecord: boolean
  enteredThisMonth: boolean
  /** 연속으로 기록한 달 수 (이번 달 미입력이면 직전 달부터 역산) */
  streak: number
  /** 최근 12개월(첫 기록 이후) 중 비어 있는 달 */
  missingMonths: string[]
  lastUpdatedByName: string | null
  lastUpdatedMonth: string | null
  lastUpdatedAt: Timestamp | null
}

export function computeRecordStatus(records: MonthlyRecord[], currentMonth: string): RecordStatus {
  const monthsSet = new Set(records.map((r) => r.month))
  const hasAnyRecord = records.length > 0
  const enteredThisMonth = monthsSet.has(currentMonth)

  // 연속 스트릭: 이번 달(입력했으면)부터, 아니면 직전 달부터 역방향으로 연속 기록을 센다.
  let streak = 0
  let cursor = enteredThisMonth ? currentMonth : getPrevMonth(currentMonth)
  while (monthsSet.has(cursor)) {
    streak++
    cursor = getPrevMonth(cursor)
  }

  // 첫 기록 이후 구간에서만 "빠진 달"을 따진다. (시작 전 달은 빠진 게 아님)
  const earliestMonth = hasAnyRecord
    ? [...monthsSet].sort()[0]
    : null
  const missingMonths: string[] = []
  let m = currentMonth
  for (let i = 0; i < 12; i++) {
    if (earliestMonth && m >= earliestMonth && !monthsSet.has(m)) {
      missingMonths.push(m)
    }
    m = getPrevMonth(m)
  }

  // 마지막 입력: updatedAt이 가장 최신인 기록 (없으면 가장 최근 달)
  let last: MonthlyRecord | undefined
  for (const r of records) {
    if (!last) {
      last = r
      continue
    }
    const a = r.updatedAt?.toMillis?.() ?? 0
    const b = last.updatedAt?.toMillis?.() ?? 0
    if (a > b || (a === b && r.month > last.month)) last = r
  }

  return {
    hasAnyRecord,
    enteredThisMonth,
    streak,
    missingMonths,
    lastUpdatedByName: last?.updatedByName ?? null,
    lastUpdatedMonth: last?.month ?? null,
    lastUpdatedAt: last?.updatedAt ?? null,
  }
}
