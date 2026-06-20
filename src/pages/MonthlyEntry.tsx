import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ClipboardList, Check, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OwnerBadge } from '@/components/OwnerBadge'
import { AmountInput } from '@/components/AmountInput'
import { useAssets } from '@/hooks/useAssets'
import { useMonthlyRecords } from '@/hooks/useMonthlyRecords'
import { incomeByOwner, sumIncomeItems } from '@/lib/income'
import {
  formatCurrency,
  getCurrentMonth,
  getMonthLabel,
  getPrevMonth,
  getNextMonth,
  parseAmount,
} from '@/lib/format'
import {
  ASSET_OWNERS,
  ASSET_OWNER_LABELS,
  ASSET_OWNER_COLORS,
  ASSET_TYPE_LABELS,
  INCOME_LABEL_PRESETS,
  type AssetType,
  type AssetOwner,
  type IncomeItem,
  type IncomeOwner,
} from '@/types'

const ASSET_TYPE_ORDER: AssetType[] = ['deposit', 'stock', 'pension', 'debt']
const INCOME_LABEL_LIST_ID = 'income-label-presets'

// 편집용 수입 행 (금액은 문자열로 다룬다)
interface IncomeRow {
  owner: IncomeOwner
  label: string
  amount: string
}

function defaultIncomeRows(): IncomeRow[] {
  return [
    { owner: 'husband', label: '월급', amount: '' },
    { owner: 'wife', label: '월급', amount: '' },
  ]
}

export default function MonthlyEntryPage() {
  const currentMonth = getCurrentMonth()
  const [month, setMonth] = useState(currentMonth)
  const [saving, setSaving] = useState(false)
  const [incomeRows, setIncomeRows] = useState<IncomeRow[]>(defaultIncomeRows())
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

    // 수입: 이 달 기록이 있으면 그 항목, 없으면 직전 달 구조를 가져와 부담을 줄인다.
    const sourceItems = thisRecord?.incomeItems ?? prevRecord?.incomeItems
    if (sourceItems && sourceItems.length > 0) {
      setIncomeRows(sourceItems.map((it) => ({ owner: it.owner, label: it.label, amount: String(it.amount) })))
    } else {
      setIncomeRows(defaultIncomeRows())
    }
    // 지출은 그 달 기록이 있으면 그 값, 없으면 비워둔다 (매달 달라지므로)
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

  // 수입 실시간 집계 (총합 + 명의별)
  const liveIncomeItems: IncomeItem[] = incomeRows.map((r) => ({
    owner: r.owner,
    label: r.label,
    amount: parseAmount(r.amount),
  }))
  const monthIncome = sumIncomeItems(liveIncomeItems)
  const incomeOwnerTotals = incomeByOwner(liveIncomeItems)

  const liveNetWorth = liveAssets - liveDebt
  const monthExpense = parseAmount(expense)
  const monthSavings = monthIncome - monthExpense

  const existingRecord = getRecord(month)
  const hasAssets = assets.length > 0

  const updateRow = (idx: number, patch: Partial<IncomeRow>) =>
    setIncomeRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  const addRow = () =>
    setIncomeRows((prev) => [...prev, { owner: 'husband', label: '부수입', amount: '' }])
  const removeRow = (idx: number) =>
    setIncomeRows((prev) => prev.filter((_, i) => i !== idx))

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
      const incomeItems: IncomeItem[] = incomeRows
        .map((r) => ({ owner: r.owner, label: r.label.trim() || '수입', amount: parseAmount(r.amount) }))
        .filter((it) => it.amount > 0)
      await saveRecord(month, { incomeItems, expense: monthExpense, entries }, isCurrentMonth)
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
      <datalist id={INCOME_LABEL_LIST_ID}>
        {INCOME_LABEL_PRESETS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">월간 입력</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          그 달의 수입·지출과 통장·자산 잔액을 기록해요. 한 달에 한 번이면 충분하지만,
          <b className="text-foreground"> 언제든 다시 열어 정산·수정</b>할 수 있어요.
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

      {/* 그 달의 수입 (명의별·항목별) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-medium text-muted-foreground">이 달의 수입</p>
          {monthIncome > 0 && (
            <p className="text-[11px] text-muted-foreground">
              남편 {formatCurrency(incomeOwnerTotals.husband)} · 아내 {formatCurrency(incomeOwnerTotals.wife)}
            </p>
          )}
        </div>
        <Card>
          <CardContent className="space-y-2.5 py-4">
            {incomeRows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Select value={row.owner} onValueChange={(v) => updateRow(idx, { owner: v as IncomeOwner })}>
                  <SelectTrigger className="h-9 w-[72px] shrink-0 px-2 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="husband">{ASSET_OWNER_LABELS.husband}</SelectItem>
                    <SelectItem value="wife">{ASSET_OWNER_LABELS.wife}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={row.label}
                  onChange={(e) => updateRow(idx, { label: e.target.value })}
                  list={INCOME_LABEL_LIST_ID}
                  placeholder="월급"
                  className="h-9 min-w-0 flex-1"
                />
                <div className="flex w-[40%] max-w-[150px] shrink-0 items-center gap-1">
                  <AmountInput
                    value={row.amount}
                    onChange={(next) => updateRow(idx, { amount: next })}
                    className="h-9 text-right text-emerald-600"
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">원</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground"
                  onClick={() => removeRow(idx)}
                  disabled={incomeRows.length === 1}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-full border-dashed" onClick={addRow}>
              <Plus className="mr-1 h-3.5 w-3.5" /> 수입 항목 추가 (부수입·보너스 등)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 그 달의 지출 (공동 합계) */}
      <div className="space-y-2">
        <p className="px-1 text-xs font-medium text-muted-foreground">이 달의 지출 (가구 합계)</p>
        <Card>
          <CardContent className="py-4">
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
              <Link to="/setup">통장·자산 등록하기</Link>
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
