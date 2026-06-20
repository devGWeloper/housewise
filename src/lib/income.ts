import type { IncomeItem, MonthlyRecord } from '@/types'

export function sumIncomeItems(items: IncomeItem[]): number {
  return items.reduce((s, it) => s + it.amount, 0)
}

// 명의별 수입 합계 (남편/아내)
export function incomeByOwner(items: IncomeItem[]): { husband: number; wife: number } {
  return items.reduce(
    (acc, it) => {
      acc[it.owner] += it.amount
      return acc
    },
    { husband: 0, wife: 0 },
  )
}

// 한 달 기록에서 명의별 수입을 뽑는다.
// 구버전 기록(incomeItems 없음)은 분리 정보가 없으므로 합계만 income으로 노출한다.
export function recordIncomeByOwner(record: MonthlyRecord): {
  husband: number
  wife: number
  hasBreakdown: boolean
} {
  if (record.incomeItems && record.incomeItems.length > 0) {
    return { ...incomeByOwner(record.incomeItems), hasBreakdown: true }
  }
  return { husband: 0, wife: 0, hasBreakdown: false }
}
