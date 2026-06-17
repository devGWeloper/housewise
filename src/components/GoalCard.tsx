import { Link } from 'react-router-dom'
import { Target, Trophy, CalendarClock, PartyPopper } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useGoal } from '@/hooks/useGoal'
import { averageMonthlyNetWorthChange } from '@/lib/insights'
import { formatCurrency, formatAxisAmount, getCurrentMonth, getMonthLabel, addMonths } from '@/lib/format'
import type { MonthlyRecord } from '@/types'

const MILESTONES = [50_000_000, 100_000_000, 200_000_000, 300_000_000, 500_000_000, 1_000_000_000]

function ProgressRing({ pct }: { pct: number }) {
  const r = 52
  const stroke = 11
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, pct))
  const offset = c * (1 - clamped / 100)
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0">
      <circle cx="64" cy="64" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 64 64)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="64" y="60" textAnchor="middle" className="fill-foreground text-xl font-bold">
        {Math.round(clamped)}%
      </text>
      <text x="64" y="80" textAnchor="middle" className="fill-muted-foreground text-[10px]">
        달성률
      </text>
    </svg>
  )
}

export function GoalCard({ netWorth, records }: { netWorth: number; records: MonthlyRecord[] }) {
  const { settings, loading } = useGoal()
  const goal = settings?.netWorthGoal ?? 0

  // 목표 미설정 → 설정 유도
  if (!loading && goal <= 0) {
    return (
      <Card className="border-dashed shadow-sm">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <Target className="h-8 w-8 text-primary" />
          <div>
            <p className="font-semibold">순자산 목표를 정해보세요</p>
            <p className="mt-1 text-sm text-muted-foreground">
              목표를 정하면 달성률과 예상 달성 시점을 보여드려요.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/settings">
              <Target className="mr-1 h-4 w-4" /> 목표 설정
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) return null

  const pct = goal > 0 ? (netWorth / goal) * 100 : 0
  const remaining = goal - netWorth
  const achieved = remaining <= 0

  // ETA: 최근 6개월 평균 순자산 증가액으로 달성 예상 시점 추정
  const avgChange = averageMonthlyNetWorthChange(records, 6)
  let eta: string | null = null
  if (!achieved && avgChange !== null && avgChange > 0) {
    const months = Math.ceil(remaining / avgChange)
    if (months > 0 && months <= 1200) {
      eta = getMonthLabel(addMonths(getCurrentMonth(), months))
    }
  }

  // 마일스톤: 이미 돌파한 가장 큰 구간
  const passed = [...MILESTONES].reverse().find((m) => netWorth >= m)

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" /> 순자산 목표
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <ProgressRing pct={pct} />
          <div className="min-w-0 flex-1 space-y-2.5 text-center sm:text-left">
            <div>
              <p className="text-xs text-muted-foreground">목표</p>
              <p className="text-lg font-bold break-all">{formatCurrency(goal)}</p>
            </div>
            {achieved ? (
              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-600 sm:justify-start">
                <Trophy className="h-4 w-4" /> 목표 달성! 🎉
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground">남은 금액</p>
                <p className="font-semibold break-all">{formatCurrency(remaining)}</p>
              </div>
            )}
            {settings?.targetDate && (
              <p className="text-xs text-muted-foreground">목표 시점: {settings.targetDate}</p>
            )}
            {eta && (
              <p className="flex items-center justify-center gap-1 text-xs text-primary sm:justify-start">
                <CalendarClock className="h-3.5 w-3.5" /> 예상 달성 {eta}
              </p>
            )}
          </div>
        </div>

        {passed && (
          <div className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
            <PartyPopper className="h-4 w-4" /> {formatAxisAmount(passed)} 돌파! 축하해요 🎊
          </div>
        )}
      </CardContent>
    </Card>
  )
}
