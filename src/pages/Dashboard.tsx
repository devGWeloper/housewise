import { useEffect, useState } from 'react'
import { differenceInDays, isValid, parseISO } from 'date-fns'
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Landmark,
  CalendarClock,
  CircleDashed,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactions } from '@/hooks/useTransactions'
import { useAssets } from '@/hooks/useAssets'
import { useFixedCosts } from '@/hooks/useFixedCosts'
import { formatCurrency, getCurrentMonth, getMonthLabel, getPrevMonth, getNextMonth } from '@/lib/format'
import { CATEGORY_COLORS, type ExpenseCategory } from '@/types'

const assetColors = ['#3b82f6', '#8b5cf6', '#f59e0b']
const assetFlowColors = {
  deposit: '#3b82f6',
  stock: '#8b5cf6',
  pension: '#f59e0b',
  debt: '#ef4444',
}

export default function Dashboard() {
  const currentMonth = getCurrentMonth()
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const { transactions, loading: txLoading } = useTransactions(selectedMonth)
  const { totalAssets, totalDebt, netWorth, loading: assetsLoading, assets } = useAssets()
  const { fixedCosts, applyFixedCosts } = useFixedCosts()

  useEffect(() => {
    if (selectedMonth === currentMonth) {
      applyFixedCosts(currentMonth)
    }
  }, [applyFixedCosts, currentMonth, selectedMonth])

  const monthIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const monthExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const categoryData = transactions
    .filter((t) => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})
  const pieData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const debtAssets = assets.filter((a) => a.assetType === 'debt')
  const debtWithOriginal = debtAssets.filter((a) => (a.details?.originalAmount ?? 0) > 0)
  const totalOriginalDebt = debtWithOriginal.reduce((sum, a) => sum + (a.details.originalAmount ?? 0), 0)
  const totalRepaidDebt = debtWithOriginal.reduce((sum, a) => {
    const original = a.details.originalAmount ?? 0
    return sum + Math.max(original - a.balance, 0)
  }, 0)
  const overallDebtProgress = totalOriginalDebt > 0
    ? Math.min(Math.round((totalRepaidDebt / totalOriginalDebt) * 100), 100)
    : null

  const today = new Date()
  const upcomingDeposits = assets
    .filter((a) => a.assetType === 'deposit' && a.details?.maturityDate)
    .map((a) => {
      const parsed = parseISO(a.details.maturityDate!)
      if (!isValid(parsed)) return null
      return {
        ...a,
        daysLeft: differenceInDays(parsed, today),
      }
    })
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .filter((a) => a.daysLeft >= 0 && a.daysLeft <= 180)
    .sort((a, b) => a.daysLeft - b.daysLeft)

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
  const grossManagedAmount = depositTotal + stockTotal + pensionTotal + totalDebt
  const debtRatio = totalAssets > 0 ? Math.round((totalDebt / totalAssets) * 100) : null

  const assetFlowItems = [
    { key: 'deposit', label: '예금/적금', value: depositTotal, color: assetFlowColors.deposit },
    { key: 'stock', label: '주식/ETF', value: stockTotal, color: assetFlowColors.stock },
    { key: 'pension', label: '연금', value: pensionTotal, color: assetFlowColors.pension },
    { key: 'debt', label: '부채', value: totalDebt, color: assetFlowColors.debt },
  ].filter((item) => item.value > 0)

  const assetPieData = [
    { name: '예금/적금', value: depositTotal },
    { name: '주식/ETF', value: stockTotal },
    { name: '연금', value: pensionTotal },
  ].filter((d) => d.value > 0)

  const loading = txLoading || assetsLoading

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/70 bg-card/85 px-3 py-3 shadow-sm backdrop-blur md:px-4">
        <p className="text-xs sm:text-sm text-muted-foreground">재정 현황</p>
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(getPrevMonth(selectedMonth))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-base font-semibold text-center sm:text-lg">{getMonthLabel(selectedMonth)}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
            disabled={selectedMonth >= currentMonth}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <Card className="border-primary/25 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-muted-foreground mb-1">순자산</p>
            <p className="text-3xl font-bold text-primary sm:text-4xl break-all">{formatCurrency(netWorth)}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">총 자산</p>
                <p className="font-semibold break-all">{formatCurrency(totalAssets)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">총 부채</p>
                <p className="font-semibold text-red-500 break-all">-{formatCurrency(totalDebt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-muted-foreground mb-2">부채 요약</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">현재 부채</span>
                <span className="font-bold text-red-500">{formatCurrency(totalDebt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">상환 완료</span>
                <span className="font-semibold text-emerald-600">
                  {totalRepaidDebt > 0 ? formatCurrency(totalRepaidDebt) : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">부채 비율</span>
                <span className="font-semibold">{debtRatio !== null ? `${debtRatio}%` : '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              {getMonthLabel(selectedMonth)} 수입
            </div>
            <p className="text-lg font-bold text-emerald-600 break-all">{formatCurrency(monthIncome)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              {getMonthLabel(selectedMonth)} 지출
            </div>
            <p className="text-lg font-bold text-red-500 break-all">{formatCurrency(monthExpense)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CircleDashed className="h-4 w-4" />
            자산/부채 구성 흐름
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assetFlowItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">표시할 데이터가 없습니다.</p>
          ) : (
            <>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted flex">
                {assetFlowItems.map((item) => {
                  const width = grossManagedAmount > 0 ? (item.value / grossManagedAmount) * 100 : 0
                  return (
                    <div
                      key={item.key}
                      style={{ width: `${Math.max(width, 3)}%`, backgroundColor: item.color }}
                      title={`${item.label}: ${formatCurrency(item.value)}`}
                    />
                  )
                })}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {assetFlowItems.map((item) => {
                  const ratio = grossManagedAmount > 0 ? Math.round((item.value / grossManagedAmount) * 100) : 0
                  return (
                    <div key={item.key} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span className="text-muted-foreground shrink-0">{ratio}%</span>
                      <span className={`font-semibold shrink-0 ${item.key === 'debt' ? 'text-red-500' : ''}`}>
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {debtAssets.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              대출 상환 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl bg-muted/40 px-4 py-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">총 대출 원금</p>
                  <p className="font-bold text-sm break-all">
                    {totalOriginalDebt > 0 ? formatCurrency(totalOriginalDebt) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">상환 완료</p>
                  <p className="font-bold text-sm text-emerald-600 break-all">
                    {totalRepaidDebt > 0 ? formatCurrency(totalRepaidDebt) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">잔여 부채</p>
                  <p className="font-bold text-sm text-red-500 break-all">{formatCurrency(totalDebt)}</p>
                </div>
              </div>
              {overallDebtProgress !== null ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>전체 상환률</span>
                    <span className="font-medium text-emerald-600">{overallDebtProgress}%</span>
                  </div>
                  <Progress value={overallDebtProgress} className="h-2.5 [&>div]:bg-emerald-500" />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center">
                  상환 진행률을 보려면 자산 관리에서 대출별 \"최초 대출금\"을 입력해 주세요.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">대출별 상세</p>
              {debtAssets.map((debt) => {
                const original = debt.details?.originalAmount
                const repaid = original ? Math.max(original - debt.balance, 0) : null
                const progress = original && original > 0 ? Math.min(Math.round((repaid! / original) * 100), 100) : null

                return (
                  <div key={debt.id} className="space-y-2 rounded-lg border border-border/70 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate pr-2">{debt.name}</span>
                      <span className="font-bold text-red-500 text-sm shrink-0">{formatCurrency(debt.balance)}</span>
                    </div>
                    {progress !== null ? (
                      <>
                        <Progress value={progress} className="h-1.5" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>상환 {formatCurrency(repaid!)} ({progress}%)</span>
                          <span>원금 {formatCurrency(original!)}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">원금 정보가 없어 진행률을 계산할 수 없습니다.</p>
                    )}
                    {debt.details?.monthlyPayment && (
                      <p className="text-xs text-muted-foreground">
                        월 {formatCurrency(debt.details.monthlyPayment)} 상환
                        {debt.balance > 0
                          ? ` · 약 ${Math.ceil(debt.balance / debt.details.monthlyPayment)}개월 남음`
                          : ''}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {upcomingDeposits.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              만기 예정 예금/적금
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingDeposits.map((dep) => (
              <div key={dep.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <Badge
                    variant={dep.daysLeft <= 30 ? 'destructive' : dep.daysLeft <= 90 ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {dep.daysLeft === 0 ? '오늘' : `${dep.daysLeft}일 후`}
                  </Badge>
                  <span className="truncate">{dep.name}</span>
                  {dep.details?.bankName && (
                    <span className="hidden sm:inline text-xs text-muted-foreground">{dep.details.bankName}</span>
                  )}
                </div>
                <span className="font-semibold shrink-0">{formatCurrency(dep.balance)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedMonth === currentMonth && upcomingFixedCosts.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">이번 주 결제 예정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingFixedCosts.map((fc) => {
              const day = Math.min(fc.payDay, daysInMonth)
              const diff = day - todayDay
              return (
                <div key={fc.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge variant={diff === 0 ? 'default' : 'secondary'} className="text-xs">
                      {diff === 0 ? '오늘' : diff === 1 ? '내일' : `${diff}일 후`}
                    </Badge>
                    <span className="truncate">{fc.name}</span>
                  </div>
                  <span className="font-medium shrink-0">{formatCurrency(fc.amount)}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">자산 구성</CardTitle>
          </CardHeader>
          <CardContent>
            {assetPieData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">등록된 자산이 없습니다.</p>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={assetPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={64}
                      innerRadius={34}
                    >
                      {assetPieData.map((_, idx) => (
                        <Cell key={idx} fill={assetColors[idx % assetColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {assetPieData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center gap-1 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: assetColors[idx] }} />
                      <span>{entry.name}</span>
                      <span className="text-muted-foreground">{formatCurrency(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">카테고리별 지출</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">지출 내역이 없습니다.</p>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={64}
                      innerRadius={34}
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
      </div>
    </div>
  )
}
