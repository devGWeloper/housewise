import { useEffect } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, PiggyBank } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactions } from '@/hooks/useTransactions'
import { useBudget } from '@/hooks/useBudget'
import { useAssets } from '@/hooks/useAssets'
import { useFixedCosts } from '@/hooks/useFixedCosts'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency, getCurrentMonth, getMonthLabel } from '@/lib/format'
import { CATEGORY_COLORS, type ExpenseCategory } from '@/types'

export default function Dashboard() {
  const currentMonth = getCurrentMonth()
  const { transactions, loading: txLoading } = useTransactions(currentMonth)
  const { budget, loading: budgetLoading } = useBudget(currentMonth)
  const { totalAssets, totalDebt, netWorth, loading: assetsLoading, assets } = useAssets()
  const { fixedCosts, applyFixedCosts } = useFixedCosts()
  const { profile } = useAuthStore()

  useEffect(() => {
    applyFixedCosts(currentMonth)
  }, [applyFixedCosts, currentMonth])

  const monthIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const monthExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const savings = monthIncome - monthExpense
  const savingsRate = monthIncome > 0 ? Math.round((savings / monthIncome) * 100) : null

  const remainingBudget = budget ? budget.totalBudget - monthExpense : 0
  const budgetPercent = budget ? Math.min((monthExpense / budget.totalBudget) * 100, 100) : 0
  const isOverBudget = budget ? monthExpense > budget.totalBudget : false
  const isNearBudget = budget ? budgetPercent >= 80 : false

  const categoryData = transactions
    .filter((t) => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})

  const pieData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.toMillis() - a.date.toMillis())
    .slice(0, 5)

  // Partner's last transaction
  const partnerLastTx = profile
    ? [...transactions]
        .sort((a, b) => b.date.toMillis() - a.date.toMillis())
        .find((t) => t.createdBy !== profile.uid)
    : null

  // Upcoming fixed costs (within next 7 days)
  const today = new Date()
  const todayDay = today.getDate()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const upcomingFixedCosts = fixedCosts
    .filter((fc) => {
      if (!fc.isActive) return false
      const day = Math.min(fc.payDay, daysInMonth)
      return day >= todayDay && day <= todayDay + 6
    })
    .sort((a, b) => a.payDay - b.payDay)

  const depositTotal = assets.filter((a) => a.assetType === 'deposit').reduce((s, a) => s + a.balance, 0)
  const stockTotal = assets.filter((a) => a.assetType === 'stock').reduce((s, a) => s + a.balance, 0)
  const pensionTotal = assets.filter((a) => a.assetType === 'pension').reduce((s, a) => s + a.balance, 0)

  const assetPieData = [
    { name: '예금/적금', value: depositTotal },
    { name: '주식/ETF', value: stockTotal },
    { name: '연금', value: pensionTotal },
  ].filter((d) => d.value > 0)
  const assetColors = ['#3b82f6', '#8b5cf6', '#f59e0b']

  const loading = txLoading || budgetLoading || assetsLoading

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <div className="rounded-2xl border border-border/70 bg-card/80 px-5 py-4 shadow-sm backdrop-blur">
        <p className="text-sm text-muted-foreground">월간 요약</p>
        <h2>{getMonthLabel(currentMonth)} 재정 현황</h2>
      </div>

      {/* Budget alerts */}
      {isNearBudget && !isOverBudget && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-300/70 bg-amber-100/60 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          예산의 {Math.round(budgetPercent)}%를 사용했습니다. 지출에 주의하세요!
        </div>
      )}
      {isOverBudget && (
        <div className="flex items-center gap-2 rounded-xl border border-red-300/70 bg-red-100/60 px-4 py-3 text-sm text-red-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          예산을 초과했습니다! 현재 {formatCurrency(monthExpense - (budget?.totalBudget ?? 0))} 초과
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              총 수입
            </div>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(monthIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              총 지출
            </div>
            <p className="text-lg font-bold text-red-500">{formatCurrency(monthExpense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Wallet className="h-3.5 w-3.5" />
              남은 예산
            </div>
            <p className={`text-lg font-bold ${isOverBudget ? 'text-red-500' : ''}`}>
              {budget ? formatCurrency(remainingBudget) : '미설정'}
            </p>
          </CardContent>
        </Card>
        <Card className={savingsRate !== null && savingsRate >= 20 ? 'border-emerald-300/60 bg-emerald-50/40 dark:bg-emerald-950/20' : ''}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <PiggyBank className="h-3.5 w-3.5" />
              이번 달 저축률
            </div>
            {savingsRate !== null ? (
              <>
                <p className={`text-lg font-bold ${savingsRate >= 20 ? 'text-emerald-600' : savingsRate < 0 ? 'text-red-500' : ''}`}>
                  {savingsRate}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(savings)}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">수입 기록 후 표시</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget progress */}
      {budget && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-muted-foreground">예산 소진율</span>
              <span className={`font-medium ${isOverBudget ? 'text-red-500' : ''}`}>
                {Math.round(budgetPercent)}%
              </span>
            </div>
            <Progress
              value={budgetPercent}
              className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : isNearBudget ? '[&>div]:bg-amber-500' : ''}`}
            />
          </CardContent>
        </Card>
      )}

      {/* Upcoming fixed costs (this week) */}
      {upcomingFixedCosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">이번 주 결제 예정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingFixedCosts.map((fc) => {
              const day = Math.min(fc.payDay, daysInMonth)
              const diff = day - todayDay
              return (
                <div key={fc.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={diff === 0 ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {diff === 0 ? '오늘' : diff === 1 ? '내일' : `${diff}일 후`}
                    </Badge>
                    <span>{fc.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(fc.amount)}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Expense pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">카테고리별 지출</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">지출 내역이 없습니다.</p>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={CATEGORY_COLORS[entry.name as ExpenseCategory] ?? '#6b7280'}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1 text-xs">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[entry.name as ExpenseCategory] ?? '#6b7280' }}
                      />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions + partner's last tx */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 거래</CardTitle>
          </CardHeader>
          <CardContent>
            {partnerLastTx && (
              <div className="mb-3 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                <span className="text-muted-foreground">
                  {partnerLastTx.createdByName}의 마지막 지출 ·{' '}
                  {format(partnerLastTx.date.toDate(), 'M/d', { locale: ko })}
                </span>
                <div className="flex justify-between mt-0.5">
                  <span className="font-medium">{partnerLastTx.category}{partnerLastTx.memo ? ` · ${partnerLastTx.memo}` : ''}</span>
                  <span className={`font-bold ${partnerLastTx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {partnerLastTx.type === 'income' ? '+' : '-'}{formatCurrency(partnerLastTx.amount)}
                  </span>
                </div>
              </div>
            )}
            {recentTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">거래 내역이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{tx.category}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(tx.date.toDate(), 'M/d', { locale: ko })}
                        </span>
                      </div>
                      {tx.memo && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{tx.memo}</p>
                      )}
                    </div>
                    <span className={`font-medium text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Net worth section */}
      <div className="pt-1">
        <h2>전체 자산 현황</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">예금/적금</p>
            <p className="text-lg font-bold">{formatCurrency(depositTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">주식/ETF</p>
            <p className="text-lg font-bold">{formatCurrency(stockTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">연금</p>
            <p className="text-lg font-bold">{formatCurrency(pensionTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">총 자산</span>
                <span className="font-bold">{formatCurrency(totalAssets)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">부채</span>
                <span className="font-bold text-red-500">-{formatCurrency(totalDebt)}</span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span className="font-medium">순자산</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(netWorth)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">자산 구성</CardTitle>
          </CardHeader>
          <CardContent>
            {assetPieData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">등록된 자산이 없습니다.</p>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={assetPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      innerRadius={30}
                    >
                      {assetPieData.map((_, idx) => (
                        <Cell key={idx} fill={assetColors[idx % assetColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2">
                  {assetPieData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center gap-1 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: assetColors[idx] }} />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
