import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ClipboardList, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { OwnerBadge } from '@/components/OwnerBadge'
import { useAssets } from '@/hooks/useAssets'
import { useMonthlyRecords } from '@/hooks/useMonthlyRecords'
import {
  formatCurrency,
  getCurrentMonth,
  getMonthLabel,
  getPrevMonth,
  getNextMonth,
} from '@/lib/format'
import {
  ASSET_OWNERS,
  ASSET_OWNER_LABELS,
  ASSET_OWNER_COLORS,
  ASSET_TYPE_LABELS,
  type AssetType,
  type AssetOwner,
} from '@/types'

const ASSET_TYPE_ORDER: AssetType[] = ['deposit', 'stock', 'pension', 'debt']

function parseAmount(v: string): number {
  const n = Number(v.replace(/[^\d-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// 콤마가 들어간 금액 입력 필드
function AmountInput({
  value,
  onChange,
  className,
  placeholder = '0',
}: {
  value: string
  onChange: (next: string) => void
  className?: string
  placeholder?: string
}) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      value={value ? Number(parseAmount(value)).toLocaleString('ko-KR') : ''}
      onChange={(e) => onChange(String(parseAmount(e.target.value)))}
      placeholder={placeholder}
      className={className}
    />
  )
}

export default function MonthlyEntryPage() {
  const currentMonth = getCurrentMonth()
  const [month, setMonth] = useState(currentMonth)
  const [saving, setSaving] = useState(false)
  const [income, setIncome] = useState('')
  const [expense, setExpense] = useState('')
  // assetId -> 입력 문자열
  const [values, setValues] = useState<Record<string, string>>({})

  const { assets, loading: assetsLoading } = useAssets()
  const { records, loading: recordsLoading, getRecord, getLatestBefore, saveRecord } =
    useMonthlyRecords()

  const loading = assetsLoading || recordsLoading
  const isCurrentMonth = month === currentMonth

  // 선택한 월/자산/기록이 준비되면 입력값을 미리 채운다.
  useEffect(() => {
    if (assetsLoading || recordsLoading) return
    const thisRecord = getRecord(month)
    const prevRecord = getLatestBefore(month)

    const next: Record<string, string> = {}
    for (const asset of assets) {
      const fromThis = thisRecord?.entries.find((e) => e.assetId === asset.id)
      const fromPrev = prevRecord?.entries.find((e) => e.assetId === asset.id)
      const value = fromThis?.balance ?? fromPrev?.balance ?? asset.balance
      next[asset.id] = String(value ?? 0)
    }
    setValues(next)
    // 수입/지출은 그 달 기록이 있으면 그 값, 없으면 비워둔다 (매달 달라지므로)
    setIncome(thisRecord ? String(thisRecord.income ?? 0) : '')
    setExpense(thisRecord ? String(thisRecord.expense ?? 0) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, assetsLoading, recordsLoading, assets.length, records.length])

  const sortedAssets = useMemo(
    () =>
      [...assets].sort(
        (a, b) =>
          ASSET_TYPE_ORDER.indexOf(a.assetType) - ASSET_TYPE_ORDER.indexOf(b.assetType),
      ),
    [assets],
  )

  const { liveAssets, liveDebt, ownerNet } = useMemo(() => {
    let assetSum = 0
    let debtSum = 0
    const net: Record<AssetOwner, number> = { husband: 0, wife: 0, joint: 0 }
    for (const asset of assets) {
      const amount = parseAmount(values[asset.id] ?? '0')
      const owner = asset.owner ?? 'joint'
      if (asset.assetType === 'debt') {
        debtSum += amount
        net[owner] -= amount
      } else {
        assetSum += amount
        net[owner] += amount
      }
    }
    return { liveAssets: assetSum, liveDebt: debtSum, ownerNet: net }
  }, [assets, values])

  const liveNetWorth = liveAssets - liveDebt
  const monthIncome = parseAmount(income)
  const monthExpense = parseAmount(expense)
  const monthSavings = monthIncome - monthExpense

  const existingRecord = getRecord(month)
  const hasAssets = assets.length > 0

  const handleSave = async () => {
    setSaving(true)
    try {
      const entries = assets.map((asset) => ({
        assetId: asset.id,
        name: asset.name,
        assetType: asset.assetType,
        owner: asset.owner ?? 'joint',
        balance: parseAmount(values[asset.id] ?? '0'),
      }))
      await saveRecord(
        month,
        { income: monthIncome, expense: monthExpense, entries },
        isCurrentMonth,
      )
      toast.success(`${getMonthLabel(month)} 기록을 저장했어요.`)
    } catch {
      toast.error('저장에 실패했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-7 pb-24">
      <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">월간 입력</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          한 달에 한 번, 그 달의 수입·지출과 각 통장·자산·부채 잔액만 기입하면 현황과 추이가 정리돼요.
        </p>
      </div>

      {/* 월 선택 + 실시간 요약 (상단 고정) */}
      <div className="sticky top-2 z-20">
        <Card className="border-primary/25 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setMonth(getPrevMonth(month))}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="text-center">
                <p className="text-base font-semibold">{getMonthLabel(month)}</p>
                {existingRecord && (
                  <p className="text-[11px] text-muted-foreground">저장된 기록 수정 중</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMonth(getNextMonth(month))}
                disabled={month >= currentMonth}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-2 text-center">
              <p className="text-xs text-muted-foreground">예상 순자산</p>
              <p className="text-2xl font-bold text-primary break-all sm:text-3xl">
                {formatCurrency(liveNetWorth)}
              </p>
              {hasAssets && (
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {ASSET_OWNERS.map((o) => (
                    <span
                      key={o}
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${ASSET_OWNER_COLORS[o]}1a`,
                        color: ASSET_OWNER_COLORS[o],
                      }}
                    >
                      {ASSET_OWNER_LABELS[o]} {formatCurrency(ownerNet[o])}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center text-xs">
              <div>
                <p className="text-muted-foreground">이 달 수입</p>
                <p className="font-semibold text-emerald-600 break-all">{formatCurrency(monthIncome)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">이 달 지출</p>
                <p className="font-semibold text-red-500 break-all">{formatCurrency(monthExpense)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">저축</p>
                <p className={`font-semibold break-all ${monthSavings >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                  {formatCurrency(monthSavings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 그 달의 수입/지출 */}
      <div className="space-y-2">
        <p className="px-1 text-xs font-medium text-muted-foreground">이 달의 수입·지출</p>
        <Card>
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center justify-between gap-3">
              <Label className="shrink-0">수입</Label>
              <div className="flex w-[55%] max-w-[200px] items-center gap-1">
                <AmountInput value={income} onChange={setIncome} className="text-right text-emerald-600" />
                <span className="text-xs text-muted-foreground shrink-0">원</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label className="shrink-0">지출</Label>
              <div className="flex w-[55%] max-w-[200px] items-center gap-1">
                <AmountInput value={expense} onChange={setExpense} className="text-right text-red-500" />
                <span className="text-xs text-muted-foreground shrink-0">원</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 통장·자산·부채 잔액 */}
      {!hasAssets ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-muted-foreground">아직 등록된 통장·자산이 없어요.</p>
            <Button asChild>
              <Link to="/assets">통장·자산 등록하기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {ASSET_TYPE_ORDER.map((type) => {
            const group = sortedAssets.filter((a) => a.assetType === type)
            if (group.length === 0) return null
            return (
              <div key={type} className="space-y-2">
                <p className="px-1 text-xs font-medium text-muted-foreground">
                  {ASSET_TYPE_LABELS[type]}
                </p>
                <Card>
                  <CardContent className="divide-y divide-border p-0">
                    {group.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-medium">{asset.name}</p>
                            <OwnerBadge owner={asset.owner ?? 'joint'} />
                          </div>
                          {asset.purpose && (
                            <p className="text-xs text-muted-foreground truncate">{asset.purpose}</p>
                          )}
                        </div>
                        <div className="flex w-[55%] max-w-[200px] items-center gap-1">
                          <AmountInput
                            value={values[asset.id] ?? ''}
                            onChange={(next) =>
                              setValues((prev) => ({ ...prev, [asset.id]: next }))
                            }
                            className={`text-right ${type === 'debt' ? 'text-red-500' : ''}`}
                          />
                          <span className="text-xs text-muted-foreground shrink-0">원</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {/* 저장 버튼 (하단 고정) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">순자산</p>
            <p className="truncate font-bold text-primary">{formatCurrency(liveNetWorth)}</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="shrink-0">
            <Check className="mr-1 h-4 w-4" />
            {saving ? '저장 중...' : `${getMonthLabel(month)} 저장`}
          </Button>
        </div>
      </div>
    </div>
  )
}
