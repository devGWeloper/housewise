import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  PiggyBank,
  Trophy,
} from 'lucide-react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactions } from '@/hooks/useTransactions'
import { useMonthlyTrend } from '@/hooks/useMonthlyTrend'
import { useBudget } from '@/hooks/useBudget'
import { formatCurrency, getCurrentMonth, getMonthLabel, getPrevMonth, getNextMonth } from '@/lib/format'
import { CATEGORY_COLORS, type ExpenseCategory } from '@/types'

function formatAxisAmount(v: number) {
  if (v >= 10000000) return `${(v / 10000000).toFixed(0)}천만`
  if (v >= 1000000) return `${(v / 1000000).toFixed(0)}백만`
  if (v >= 10000) return `${(v / 10000).toFixed(0)}만`
  return `${v}`
}

export default function MonthlyHistory() {
  const [month, setMonth] = useState(getCurrentMonth())
  const prevMonth = getPrevMonth(month)

  const { transactions, loading } = useTransactions(month)
  const { transactions: prevTransactions, loading: prevLoading } = useTransactions(prevMonth)
  const { budget, loading: budgetLoading } = useBudget(month)
  const { data: trendData, loading: trendLoading } = useMonthlyTrend(month, 6)

  const monthIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const prevIncome = prevTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const prevExpense = prevTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const savings = monthIncome - monthExpense
  const savingsRate = monthIncome > 0 ? Math.round((savings / monthIncome) * 100) : 0

  const prevSavings = prevIncome - prevExpense
  const prevSavingsRate = prevIncome > 0 ? Math.round((prevSavings / prevIncome) * 100) : 0

  const incomeChange = prevIncome > 0 ? ((monthIncome - prevIncome) / prevIncome) * 100 : null
  const expenseChange = prevExpense > 0 ? ((monthExpense - prevExpense) / prevExpense) * 100 : null
  const savingsRateChange = prevSavingsRate !== 0 ? savingsRate - prevSavingsRate : null

  // Budget achievement
  const budgetUsage = budget ? Math.round((monthExpense / budget.totalBudget) * 100) : null
  const budgetAchieved = budget ? monthExpense <= budget.totalBudget : null

  // Top spending categories
  const expenseByCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})
  const topCategories = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  // Grouped transactions by date
  const grouped = transactions.reduce<Record<string, typeof transactions>>((acc, tx) => {
    const dateKey = format(tx.date.toDate(), 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(tx)
    return acc
  }, {})

  // Insight message
  const getInsight = () => {
    if (monthIncome === 0 && monthExpense === 0) return null
    const msgs: string[] = []
    if (expenseChange !== null) {
      if (expenseChange < -5) msgs.push(`지출이 지난달보다 ${Math.abs(Math.round(expenseChange))}% 줄었어요.`)
      else if (expenseChange > 10) msgs.push(`지출이 지난달보다 ${Math.round(expenseChange)}% 늘었어요`)
    }
    if (savingsRateChange !== null) {
      if (savingsRateChange > 0) msgs.push(`저축률이 지난달보다 ${savingsRateChange}%p 높아졌어요.`)
      else if (savingsRateChange < -5) msgs.push(`저축률이 지난달보다 ${Math.abs(savingsRateChange)}%p 낮아졌어요`)
    }
    if (savingsRate >= 20) msgs.push(`이번 달 저축률 ${savingsRate}%를 달성했어요.`)
    return msgs.length > 0 ? msgs[0] : null
  }

  const insight = getInsight()
  const isLoading = loading || prevLoading || budgetLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
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
          <h2 className="text-lg font-semibold">{getMonthLabel(month)} 결산</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMonth(getNextMonth(month))}
            disabled={month >= getCurrentMonth()}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Insight banner */}
      {insight && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
          <Trophy className="h-4 w-4 shrink-0" />
          {insight}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Income */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              수입
            </div>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(monthIncome)}</p>
            {incomeChange !== null && (
              <div className={`flex items-center gap-0.5 text-xs mt-1 ${incomeChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {incomeChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                지난달 대비 {Math.abs(Math.round(incomeChange))}%
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              지출
            </div>
            <p className="text-lg font-bold text-red-500">{formatCurrency(monthExpense)}</p>
            {expenseChange !== null && (
              <div className={`flex items-center gap-0.5 text-xs mt-1 ${expenseChange <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {expenseChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                지난달 대비 {Math.abs(Math.round(expenseChange))}%
              </div>
            )}
          </CardContent>
        </Card>

        {/* Savings */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <PiggyBank className="h-3.5 w-3.5" />
              저축
            </div>
            <p className={`text-lg font-bold ${savings >= 0 ? 'text-primary' : 'text-red-500'}`}>
              {formatCurrency(savings)}
            </p>
            {savingsRateChange !== null && (
              <div className={`flex items-center gap-0.5 text-xs mt-1 ${savingsRateChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {savingsRateChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(savingsRateChange)}%p
              </div>
            )}
          </CardContent>
        </Card>

        {/* Savings rate */}
        <Card className={savingsRate >= 20 ? 'border-emerald-300/60 bg-emerald-50/40 dark:bg-emerald-950/20' : ''}>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">저축률</p>
            <p className={`text-lg font-bold ${savingsRate >= 20 ? 'text-emerald-600' : savingsRate < 0 ? 'text-red-500' : ''}`}>
              {monthIncome > 0 ? `${savingsRate}%` : '-'}
            </p>
            {budget && budgetAchieved !== null && (
              <p className={`text-xs mt-1 ${budgetAchieved ? 'text-emerald-600' : 'text-red-500'}`}>
                {budgetAchieved ? `예산 달성 (${budgetUsage}% 사용)` : `예산 ${budgetUsage}% 초과`}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        {/* 6-month trend chart */}
        {!trendLoading && trendData.some((d) => d.income > 0 || d.expense > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">최근 6개월 흐름</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={trendData} margin={{ left: -10 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={formatAxisAmount} tick={{ fontSize: 10 }} width={48} />
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrency(Number(value)),
                      name === 'income' ? '수입' : name === 'expense' ? '지출' : '저축',
                    ]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend
                    formatter={(value) =>
                      value === 'income' ? '수입' : value === 'expense' ? '지출' : '저축'
                    }
                    iconSize={10}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="income" name="income" radius={[3, 3, 0, 0]}>
                    {trendData.map((entry) => (
                      <Cell
                        key={entry.month}
                        fill={entry.month === month ? '#10b981' : '#d1fae5'}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="expense" name="expense" radius={[3, 3, 0, 0]}>
                    {trendData.map((entry) => (
                      <Cell
                        key={entry.month}
                        fill={entry.month === month ? '#ef4444' : '#fee2e2'}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="savings"
                    name="savings"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
                {trendData.map((d) => (
                  <div
                    key={d.month}
                    className={`flex min-w-[64px] flex-col items-center rounded-lg px-1 py-1.5 text-center ${
                      d.month === month ? 'bg-primary/10' : ''
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">{d.label}</p>
                    <p className={`text-sm font-bold ${d.savingsRate >= 20 ? 'text-emerald-600' : d.savingsRate < 0 ? 'text-red-500' : ''}`}>
                      {d.income > 0 ? `${d.savingsRate}%` : '-'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top spending categories */}
        {topCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">이번 달 TOP 지출</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCategories.map(([cat, amount], idx) => {
                const pct = monthExpense > 0 ? Math.round((amount / monthExpense) * 100) : 0
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: CATEGORY_COLORS[cat as ExpenseCategory] ?? '#6b7280' }}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex justify-between gap-2">
                        <span className="truncate text-sm font-medium">{cat}</span>
                        <span className="shrink-0 text-sm font-bold">{formatCurrency(amount)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: CATEGORY_COLORS[cat as ExpenseCategory] ?? '#6b7280',
                          }}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{pct}%</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed transactions */}
      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            이번 달 거래 내역이 없어요
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground px-1">전체 거래 내역</h3>
          {Object.entries(grouped)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([dateKey, txs]) => {
              const dayIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
              const dayExpense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
              return (
                <div key={dateKey}>
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {format(new Date(dateKey + 'T00:00:00'), 'M월 d일 (EEE)', { locale: ko })}
                    </h3>
                    <div className="flex gap-3 text-xs">
                      {dayIncome > 0 && <span className="text-emerald-600">+{formatCurrency(dayIncome)}</span>}
                      {dayExpense > 0 && <span className="text-red-500">-{formatCurrency(dayExpense)}</span>}
                    </div>
                  </div>
                  <Card>
                    <CardContent className="divide-y divide-border p-0">
                      {txs.map((tx) => (
                        <div key={tx.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">{tx.category}</Badge>
                              <span className="text-xs text-muted-foreground">{tx.createdByName}</span>
                            </div>
                            {tx.memo && (
                              <p className="text-sm text-muted-foreground truncate mt-0.5">{tx.memo}</p>
                            )}
                          </div>
                          <span className={`text-sm font-semibold sm:text-right ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
