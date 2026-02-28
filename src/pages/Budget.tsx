import { useState } from 'react'
import { ChevronLeft, ChevronRight, Save, Info, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useBudget } from '@/hooks/useBudget'
import { useTransactions } from '@/hooks/useTransactions'
import { useFixedCosts } from '@/hooks/useFixedCosts'
import { formatCurrency, getCurrentMonth, getMonthLabel, getPrevMonth, getNextMonth } from '@/lib/format'
import { EXPENSE_CATEGORIES, CATEGORY_COLORS, type CategoryBudget, type ExpenseCategory } from '@/types'

export default function BudgetPage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const { budget, loading: budgetLoading, saveBudget } = useBudget(month)
  const { transactions, loading: txLoading } = useTransactions(month)
  const { fixedCosts } = useFixedCosts()

  const [totalBudget, setTotalBudget] = useState('')
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const startEdit = () => {
    setTotalBudget(budget?.totalBudget?.toString() ?? '')
    const catMap: Record<string, string> = {}
    budget?.categoryBudgets?.forEach((cb) => { catMap[cb.category] = cb.amount.toString() })
    setCategoryBudgets(catMap)
    setEditing(true)
  }

  const handleSave = async () => {
    if (!totalBudget) return
    setSaving(true)
    const catBudgets: CategoryBudget[] = Object.entries(categoryBudgets)
      .filter(([, v]) => v && Number(v) > 0)
      .map(([category, amount]) => ({ category: category as ExpenseCategory, amount: Number(amount) }))
    await saveBudget(Number(totalBudget), catBudgets)
    setEditing(false)
    setSaving(false)
  }

  const expenseByCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})

  const totalExpense = Object.values(expenseByCategory).reduce((s, v) => s + v, 0)
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const savings = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : null

  const remainingBudget = budget ? budget.totalBudget - totalExpense : 0
  const budgetPercent = budget ? Math.min((totalExpense / budget.totalBudget) * 100, 100) : 0
  const isOverBudget = budget ? totalExpense > budget.totalBudget : false

  const totalFixedCosts = fixedCosts.filter((fc) => fc.isActive).reduce((sum, fc) => sum + fc.amount, 0)

  const loading = budgetLoading || txLoading

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setMonth(getPrevMonth(month))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">{getMonthLabel(month)} 예산</h2>
          <Button variant="ghost" size="icon" onClick={() => setMonth(getNextMonth(month))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        {!editing && (
          <Button onClick={startEdit}>
            {budget ? '예산 수정' : '예산 설정'}
          </Button>
        )}
      </div>

      {/* Explanation banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200/70 bg-blue-50/60 dark:border-blue-800/40 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium mb-0.5">예산이란?</p>
          <p className="text-xs opacity-80">
            이번 달 지출 목표를 설정해요. 카테고리별로도 세울 수 있어요. 예산을 초과하면 대시보드에서 알림을 볼 수 있어요.
          </p>
        </div>
      </div>

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">예산 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>월 총 예산</Label>
              <Input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder="예: 3000000"
              />
              {totalFixedCosts > 0 && (
                <p className="text-xs text-muted-foreground">
                  💡 등록된 고정비 합계가 {formatCurrency(totalFixedCosts)}이에요. 이 금액 이상으로 설정하는 게 좋아요.
                </p>
              )}
            </div>
            <div className="space-y-3">
              <Label>
                카테고리별 예산{' '}
                <span className="text-muted-foreground font-normal text-xs">(선택 — 초과 시 경고)</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <div key={cat} className="space-y-1">
                    <label className="text-xs text-muted-foreground">{cat}</label>
                    <Input
                      type="number"
                      value={categoryBudgets[cat] ?? ''}
                      onChange={(e) =>
                        setCategoryBudgets((prev) => ({ ...prev, [cat]: e.target.value }))
                      }
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">
                취소
              </Button>
              <Button onClick={handleSave} disabled={saving || !totalBudget} className="flex-1">
                <Save className="h-4 w-4 mr-1" />
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : budget ? (
        <>
          {/* Summary: budget vs actual + savings rate */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">총 예산</p>
                <p className="text-base font-bold">{formatCurrency(budget.totalBudget)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">지출</p>
                <p className="text-base font-bold text-red-500">{formatCurrency(totalExpense)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">남은 예산</p>
                <p className={`text-base font-bold ${isOverBudget ? 'text-red-500' : 'text-primary'}`}>
                  {formatCurrency(remainingBudget)}
                </p>
              </CardContent>
            </Card>
            {savingsRate !== null && (
              <Card className={savingsRate >= 20 ? 'border-emerald-300/60 bg-emerald-50/40 dark:bg-emerald-950/20' : ''}>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">이번 달 저축률</p>
                  <p className={`text-base font-bold ${savingsRate >= 20 ? 'text-emerald-600' : savingsRate < 0 ? 'text-red-500' : ''}`}>
                    {savingsRate}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(savings)}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Overall budget progress */}
          <Card>
            <CardContent className="pt-5 pb-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">예산 소진율</span>
                <span className={`font-semibold ${isOverBudget ? 'text-red-500' : ''}`}>
                  {Math.round(budgetPercent)}%
                  {isOverBudget && ' 초과!'}
                </span>
              </div>
              <Progress
                value={budgetPercent}
                className={`h-3 ${
                  isOverBudget
                    ? '[&>div]:bg-red-500'
                    : budgetPercent >= 80
                      ? '[&>div]:bg-amber-500'
                      : ''
                }`}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0원</span>
                <span>{formatCurrency(budget.totalBudget)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Category budgets with progress bars */}
          {budget.categoryBudgets && budget.categoryBudgets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">카테고리별 예산 현황</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {budget.categoryBudgets.map((cb) => {
                  const spent = expenseByCategory[cb.category] ?? 0
                  const pct = Math.min((spent / cb.amount) * 100, 100)
                  const isOver = spent > cb.amount
                  return (
                    <div key={cb.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLORS[cb.category as ExpenseCategory] ?? '#6b7280' }}
                          />
                          <span className="text-sm font-medium">{cb.category}</span>
                          {isOver && (
                            <span className="text-xs text-red-500 font-medium">초과</span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          <span className={isOver ? 'text-red-500 font-semibold' : ''}>
                            {formatCurrency(spent)}
                          </span>
                          {' / '}{formatCurrency(cb.amount)}
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className={`h-2 ${isOver ? '[&>div]:bg-red-500' : pct >= 80 ? '[&>div]:bg-amber-500' : ''}`}
                        style={
                          !isOver && pct < 80
                            ? ({ '--tw-progress-bar-color': CATEGORY_COLORS[cb.category as ExpenseCategory] ?? '#6b7280' } as React.CSSProperties)
                            : undefined
                        }
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* All category spending (without budget set) */}
          {Object.keys(expenseByCategory).filter(
            (cat) => !budget.categoryBudgets?.find((cb) => cb.category === cat)
          ).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">예산 미설정 카테고리 지출</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(expenseByCategory)
                  .filter(([cat]) => !budget.categoryBudgets?.find((cb) => cb.category === cat))
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[cat as ExpenseCategory] ?? '#6b7280' }}
                        />
                        <span>{cat}</span>
                      </div>
                      <span className="text-muted-foreground">{formatCurrency(amount)}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-14 text-center">
            <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground mb-1">아직 이번 달 예산이 없어요</p>
            <p className="text-xs text-muted-foreground mb-5">예산을 설정하면 지출을 계획적으로 관리할 수 있어요</p>
            <Button onClick={startEdit}>예산 설정하기</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
