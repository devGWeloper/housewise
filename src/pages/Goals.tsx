import { useState } from 'react'
import { differenceInCalendarMonths, format, isValid, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Plus, Pencil, Trash2, Target, TrendingUp, CalendarClock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { GoalForm } from '@/components/GoalForm'
import { useGoals } from '@/hooks/useGoals'
import { useAssets } from '@/hooks/useAssets'
import { useMonthlyRecords } from '@/hooks/useMonthlyRecords'
import { computeGoalProgress } from '@/lib/goals'
import { formatCurrency } from '@/lib/format'
import { GOAL_TRACK_LABELS, type Goal } from '@/types'

export default function GoalsPage() {
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useGoals()
  const { netWorth, totalAssets } = useAssets()
  const { records } = useMonthlyRecords()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)

  const openAdd = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (goal: Goal) => { setEditing(goal); setDialogOpen(true) }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 backdrop-blur">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Target className="h-5 w-5 text-primary" /> 재무 목표
          </h2>
          <p className="text-sm text-muted-foreground">
            내 집 마련·비상금처럼 함께 모을 목표를 세우고 달성 속도를 확인해요.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={openAdd}>
              <Plus className="mr-1 h-4 w-4" /> 목표 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? '목표 수정' : '목표 추가'}</DialogTitle>
            </DialogHeader>
            <GoalForm
              initial={editing ?? undefined}
              onSubmit={async (data) => {
                if (editing) await updateGoal(editing.id, data)
                else await addGoal(data)
              }}
              onClose={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="border-primary/25 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Target className="h-12 w-12 text-primary" />
            <div>
              <p className="font-semibold">아직 세운 목표가 없어요</p>
              <p className="mt-1 text-sm text-muted-foreground">
                목표를 추가하면 순자산 추세를 바탕으로<br />
                언제쯤 달성할 수 있을지 예측해 드려요.
              </p>
            </div>
            <Button onClick={openAdd}>
              <Plus className="mr-1 h-4 w-4" /> 첫 목표 세우기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const p = computeGoalProgress(goal, netWorth, totalAssets, records)
            const targetDate = goal.targetDate ? parseISO(goal.targetDate) : null
            const monthsToDeadline = targetDate && isValid(targetDate)
              ? differenceInCalendarMonths(targetDate, new Date())
              : null

            return (
              <Card key={goal.id} className="shadow-sm">
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="text-2xl">{goal.emoji ?? '🎯'}</span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{goal.name}</p>
                        <Badge variant="secondary" className="mt-0.5 text-[11px]">
                          {GOAL_TRACK_LABELS[goal.track]}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(goal)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-end justify-between gap-2">
                      <span className="text-lg font-bold break-all">{formatCurrency(p.current)}</span>
                      <span className="shrink-0 text-sm text-muted-foreground">
                        / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <Progress
                      value={p.progress}
                      className={p.achieved ? 'h-2.5 [&>div]:bg-emerald-500' : 'h-2.5'}
                    />
                    <div className="mt-1.5 flex justify-between text-xs">
                      <span className={p.achieved ? 'font-medium text-emerald-600' : 'text-muted-foreground'}>
                        {p.progress}% 달성
                      </span>
                      {!p.achieved && (
                        <span className="text-muted-foreground">
                          {formatCurrency(p.remaining)} 남음
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 상태 / 예측 */}
                  {p.achieved ? (
                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> 목표 달성! 축하해요 🎉
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {p.projection && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-2 text-sm">
                          <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
                          <span>
                            이 추세라면{' '}
                            <span className="font-semibold text-primary">
                              {format(p.projection.date, 'yyyy년 M월', { locale: ko })}
                            </span>{' '}
                            (약 {p.projection.monthsLeft}개월 후) 달성 예상
                          </span>
                        </div>
                      )}
                      {monthsToDeadline !== null && (
                        <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                          <CalendarClock className="h-3.5 w-3.5" />
                          목표 시점 {format(targetDate!, 'yyyy년 M월', { locale: ko })}
                          {monthsToDeadline >= 0 ? ` · ${monthsToDeadline}개월 남음` : ' · 기한 지남'}
                        </div>
                      )}
                      {goal.track !== 'manual' && !p.projection && (
                        <p className="px-1 text-xs text-muted-foreground">
                          월간 입력이 2개월 이상 쌓이면 달성 시점을 예측해 드려요.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
