import { Link } from 'react-router-dom'
import { Flame, CheckCircle2, ClipboardList, CalendarX2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { computeRecordStatus } from '@/lib/recordStatus'
import { getMonthLabel, getShortMonthLabel } from '@/lib/format'
import type { MonthlyRecord } from '@/types'

/**
 * 기록 현황·스트릭 배너.
 * 이번 달 입력 여부 / 연속 기록 / 마지막 입력자 / 빠진 달을 한 줄로 보여준다.
 */
export function RecordStatusBanner({
  records,
  currentMonth,
  showInputAction = true,
}: {
  records: MonthlyRecord[]
  currentMonth: string
  showInputAction?: boolean
}) {
  const status = computeRecordStatus(records, currentMonth)
  if (!status.hasAnyRecord) return null

  const entered = status.enteredThisMonth

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        entered
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-amber-500/30 bg-amber-500/5'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {entered ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          ) : (
            <ClipboardList className="h-5 w-5 shrink-0 text-amber-500" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {entered
                ? `${getMonthLabel(currentMonth)} 기록 완료`
                : `${getMonthLabel(currentMonth)} 기록 전이에요`}
            </p>
            {status.lastUpdatedByName && status.lastUpdatedMonth && (
              <p className="truncate text-xs text-muted-foreground">
                마지막 입력: {status.lastUpdatedByName} · {getMonthLabel(status.lastUpdatedMonth)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status.streak > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-600">
              <Flame className="h-3.5 w-3.5" /> {status.streak}개월 연속
            </span>
          )}
          {showInputAction && !entered && (
            <Button asChild size="sm" variant="outline">
              <Link to="/monthly">
                <ClipboardList className="mr-1 h-4 w-4" /> 입력하기
              </Link>
            </Button>
          )}
        </div>
      </div>

      {status.missingMonths.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-border/50 pt-2 text-xs text-muted-foreground">
          <CalendarX2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            빠진 달 {status.missingMonths.length}개
            {' · '}
            {status.missingMonths.slice(0, 3).map(getShortMonthLabel).join(', ')}
            {status.missingMonths.length > 3 ? ' 등' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
