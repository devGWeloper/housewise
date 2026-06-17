import { useState } from 'react'
import { Link } from 'react-router-dom'
import { differenceInDays, isValid, parseISO } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Landmark,
  CalendarClock,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  PiggyBank,
  Target,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useAssets } from '@/hooks/useAssets'
import { useMonthlyRecords } from '@/hooks/useMonthlyRecords'
import {
  formatCurrency,
  getCurrentMonth,
  getMonthLabel,
  getPrevMonth,
  getNextMonth,
  getShortMonthLabel,
  formatAxisAmount,
} from '@/lib/format'
import { ASSET_OWNER_LABELS, ASSET_OWNER_COLORS } from '@/types'

const assetPieColors = ['#3b82f6', '#8b5cf6', '#f59e0b']

export default function Dashboard() {
  const currentMonth = getCurrentMonth()
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  const { totalAssets, totalDebt, netWorth, loading: assetsLoading, assets, ownerTotals } = useAssets()
  const { records, getRecord, loading: recordsLoading } = useMonthlyRecords()

  const loading = assetsLoading || recordsLoading

  // 선택한 달의 수입/지출
  const monthRecord = getRecord(selectedMonth)
  const monthIncome = monthRecord?.income ?? 0
  const monthExpense = monthRecord?.expense ?? 0
  const monthSavings = monthIncome - monthExpense
  const savingsRate = monthIncome > 0 ? Math.round((monthSavings / monthIncome) * 100) : null

  // 최근 12개월 추이
  const trendData = records.slice(-12).map((r) => ({
    label: getShortMonthLabel(r.month),
    netWorth: r.netWorth,
    totalAssets: r.totalAssets,
    totalDebt: r.totalDebt,
    income: r.income ?? 0,
    expense: r.expense ?? 0,
    savings: (r.income ?? 0) - (r.expense ?? 0),
  }))
  const hasDebtHistory = trendData.some((d) => d.totalDebt > 0)
  const hasCashflow = trendData.some((d) => d.income > 0 || d.expense > 0)

  // 자산 구성
  const depositTotal = assets.filter((a) => a.assetType === 'deposit').reduce((s, a) => s + a.balance, 0)
  const stockTotal = assets.filter((a) => a.assetType === 'stock').reduce((s, a) => s + a.balance, 0)
  const pensionTotal = assets.filter((a) => a.assetType === 'pension').reduce((s, a) => s + a.balance, 0)
  const assetPieData = [
    { name: '예금/적금', value: depositTotal },
    { name: '주식/ETF', value: stockTotal },
    { name: '연금', value: pensionTotal },
  ].filter((d) => d.value > 0)

  // 용도(목적)가 지정된 통장
  const purposedAssets = assets.filter((a) => a.purpose && a.purpose.trim().length > 0)

  // 부채
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
  const debtRatio = totalAssets > 0 ? Math.round((totalDebt / totalAssets) * 100) : null

  // 만기 예정 예금/적금
  const today = new Date()
  const upcomingDeposits = assets
    .filter((a) => a.assetType === 'deposit' && a.details?.maturityDate)
    .map((a) => {
      const parsed = parseISO(a.details.maturityDate!)
      if (!isValid(parsed)) return null
      return { ...a, daysLeft: differenceInDays(parsed, today) }
    })
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .filter((a) => a.daysLeft >= 0 && a.daysLeft <= 180)
    .sort((a, b) => a.daysLeft - b.daysLeft)

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

  const noData = assets.length === 0 && records.length === 0

  if (noData) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/70 bg-card/85 px-4 py-3">
          <h2 className="text-lg font-semibold">우리 부부 자산 현황</h2>
        </div>
        <Card className="border-primary/25 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <PiggyBank className="h-12 w-12 text-primary" />
            <div>
              <p className="font-semibold">아직 자산 정보가 없어요</p>
              <p className="mt-1 text-sm text-muted-foreground">
                먼저 우리 부부의 통장·자산·부채를 등록하면<br />
                매달 5분 입력만으로 전체 현황과 추이가 한눈에 보여요.
              </p>
            </div>
            <Button asChild>
              <Link to="/assets">
                <Landmark className="mr-1 h-4 w-4" /> 자산 등록 시작하기
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-7">
      {/* 월 선택 */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/70 bg-card/85 px-3 py-3 shadow-sm backdrop-blur md:px-4">
        <p className="text-xs sm:text-sm text-muted-foreground">우리 부부 자산 현황</p>
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

      {/* 순자산 + 자산/부채 */}
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

      {/* 명의별 자산 */}
      {(totalAssets > 0 || totalDebt > 0) && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              명의별 자산
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {ownerTotals.map((ot) => (
                <div
                  key={ot.owner}
                  className="rounded-xl border border-border/70 px-3 py-3"
                  style={{ borderLeft: `3px solid ${ASSET_OWNER_COLORS[ot.owner]}` }}
                >
                  <p className="text-xs font-medium" style={{ color: ASSET_OWNER_COLORS[ot.owner] }}>
                    {ASSET_OWNER_LABELS[ot.owner]}
                  </p>
                  <p className="mt-1 text-lg font-bold break-all">{formatCurrency(ot.net)}</p>
                  <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>자산 {formatCurrency(ot.assets)}</span>
                    {ot.debt > 0 && <span className="text-red-500">부채 {formatCurrency(ot.debt)}</span>}
                  </div>
                </div>
              ))}
            </div>
            {netWorth > 0 && (
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                {ownerTotals
                  .filter((ot) => ot.net > 0)
                  .map((ot) => (
                    <div
                      key={ot.owner}
                      style={{
                        width: `${(ot.net / netWorth) * 100}%`,
                        backgroundColor: ASSET_OWNER_COLORS[ot.owner],
                      }}
                      title={`${ASSET_OWNER_LABELS[ot.owner]}: ${formatCurrency(ot.net)}`}
                    />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 이 달 수입/지출/저축 */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> 수입
            </div>
            <p className="text-base font-bold text-emerald-600 break-all">{formatCurrency(monthIncome)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" /> 지출
            </div>
            <p className="text-base font-bold text-red-500 break-all">{formatCurrency(monthExpense)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <PiggyBank className="h-3.5 w-3.5 text-primary" /> 저축
            </div>
            <p className="text-base font-bold break-all">{formatCurrency(monthSavings)}</p>
            {savingsRate !== null && <p className="text-[11px] text-muted-foreground">저축률 {savingsRate}%</p>}
          </CardContent>
        </Card>
      </div>
      {!monthRecord && (
        <div className="flex items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
          <p className="text-sm text-muted-foreground">{getMonthLabel(selectedMonth)} 기록이 아직 없어요.</p>
          <Button asChild size="sm" variant="outline">
            <Link to="/monthly"><ClipboardList className="mr-1 h-4 w-4" /> 입력하기</Link>
          </Button>
        </div>
      )}

      {/* 순자산 추이 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" /> 순자산 추이
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trendData.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                매달 자산을 기록하면 순자산 변화가 그래프로 쌓여요.
              </p>
              <Button asChild size="sm">
                <Link to="/monthly"><ClipboardList className="mr-1 h-4 w-4" /> 월간 입력</Link>
              </Button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={formatAxisAmount} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area type="monotone" dataKey="netWorth" name="순자산" stroke="#6366f1" strokeWidth={2} fill="url(#netWorthFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 수입/지출/저축 추이 */}
      {hasCashflow && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PiggyBank className="h-4 w-4" /> 수입·지출·저축 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={trendData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={formatAxisAmount} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="수입" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expense" name="지출" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="savings" name="저축" stroke="#6366f1" strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 부채 잔액 추이 */}
      {hasDebtHistory && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" /> 부채 잔액 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={formatAxisAmount} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="totalDebt" name="부채 잔액" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 자산 구성 + 통장 용도 */}
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
                    <Pie data={assetPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={64} innerRadius={34}>
                      {assetPieData.map((_, idx) => (
                        <Cell key={idx} fill={assetPieColors[idx % assetPieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {assetPieData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center gap-1 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: assetPieColors[idx] }} />
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
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" /> 통장 용도
            </CardTitle>
          </CardHeader>
          <CardContent>
            {purposedAssets.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                자산에 용도를 적어두면 어떤 통장이 무슨 목적인지 한눈에 보여요.
              </p>
            ) : (
              <div className="space-y-2">
                {purposedAssets.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: `${ASSET_OWNER_COLORS[a.owner ?? 'joint']}1a`, color: ASSET_OWNER_COLORS[a.owner ?? 'joint'] }}
                      >
                        {ASSET_OWNER_LABELS[a.owner ?? 'joint']}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{a.purpose}</p>
                        <p className="truncate text-xs text-muted-foreground">{a.name}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 font-semibold ${a.assetType === 'debt' ? 'text-red-500' : ''}`}>
                      {formatCurrency(a.balance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 대출 상환 현황 */}
      {debtAssets.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-4 w-4" /> 대출 상환 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl bg-muted/40 px-4 py-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">총 대출 원금</p>
                  <p className="font-bold text-sm break-all">{totalOriginalDebt > 0 ? formatCurrency(totalOriginalDebt) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">상환 완료</p>
                  <p className="font-bold text-sm text-emerald-600 break-all">{totalRepaidDebt > 0 ? formatCurrency(totalRepaidDebt) : '—'}</p>
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
                  상환 진행률을 보려면 자산 관리에서 대출별 "최초 대출금"을 입력해 주세요.
                </p>
              )}
            </div>
            {debtRatio !== null && (
              <p className="text-center text-xs text-muted-foreground">총자산 대비 부채 비율 {debtRatio}%</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 만기 예정 예금/적금 */}
      {upcomingDeposits.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" /> 만기 예정 예금/적금
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingDeposits.map((dep) => (
              <div key={dep.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <Badge variant={dep.daysLeft <= 30 ? 'destructive' : dep.daysLeft <= 90 ? 'default' : 'secondary'} className="text-xs">
                    {dep.daysLeft === 0 ? '오늘' : `${dep.daysLeft}일 후`}
                  </Badge>
                  <span className="truncate">{dep.name}</span>
                </div>
                <span className="font-semibold shrink-0">{formatCurrency(dep.balance)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
