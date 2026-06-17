import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Wallet, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAssets } from '@/hooks/useAssets'
import { useAssetRecords } from '@/hooks/useAssetRecords'
import {
  formatCurrency,
  getCurrentMonth,
  getMonthLabel,
  getPrevMonth,
  getNextMonth,
} from '@/lib/format'
import type { AssetType } from '@/types'

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  deposit: '예금/적금',
  stock: '주식/ETF',
  pension: '연금',
  debt: '부채',
}

const ASSET_TYPE_ORDER: AssetType[] = ['deposit', 'stock', 'pension', 'debt']

function parseAmount(v: string): number {
  const n = Number(v.replace(/[^\d-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export default function AssetUpdatePage() {
  const currentMonth = getCurrentMonth()
  const [month, setMonth] = useState(currentMonth)
  const [saving, setSaving] = useState(false)
  // assetId -> 입력 문자열
  const [values, setValues] = useState<Record<string, string>>({})

  const { assets, loading: assetsLoading } = useAssets()
  const { records, loading: recordsLoading, getRecord, getLatestBefore, saveRecord } =
    useAssetRecords()

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
    // month 또는 데이터가 바뀔 때만 재계산
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

  const { liveAssets, liveDebt } = useMemo(() => {
    let assetSum = 0
    let debtSum = 0
    for (const asset of assets) {
      const amount = parseAmount(values[asset.id] ?? '0')
      if (asset.assetType === 'debt') debtSum += amount
      else assetSum += amount
    }
    return { liveAssets: assetSum, liveDebt: debtSum }
  }, [assets, values])
  const liveNetWorth = liveAssets - liveDebt

  const existingRecord = getRecord(month)

  const handleSave = async () => {
    if (assets.length === 0) return
    setSaving(true)
    try {
      const entries = assets.map((asset) => ({
        assetId: asset.id,
        name: asset.name,
        assetType: asset.assetType,
        balance: parseAmount(values[asset.id] ?? '0'),
      }))
      await saveRecord(month, entries, isCurrentMonth)
      toast.success(`${getMonthLabel(month)} 자산 기록을 저장했어요.`)
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
          <Wallet className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">월간 자산 업데이트</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          한 달에 한 번, 각 자산·부채의 현재 잔액만 입력하면 순자산과 추이가 바로 정리돼요.
        </p>
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-muted-foreground">아직 등록된 자산이 없어요.</p>
            <Button asChild>
              <Link to="/assets">자산 먼저 등록하기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 월 선택 + 실시간 순자산 (상단 고정) */}
          <div className="sticky top-2 z-20">
            <Card className="border-primary/25 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMonth(getPrevMonth(month))}
                  >
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
                  <div className="mt-1 flex justify-center gap-4 text-xs">
                    <span className="text-muted-foreground">
                      자산 <span className="font-semibold text-foreground">{formatCurrency(liveAssets)}</span>
                    </span>
                    <span className="text-muted-foreground">
                      부채 <span className="font-semibold text-red-500">{formatCurrency(liveDebt)}</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 타입별 입력 리스트 */}
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
                        <div
                          key={asset.id}
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{asset.name}</p>
                            {asset.details?.bankName && (
                              <p className="text-xs text-muted-foreground truncate">
                                {asset.details.bankName}
                              </p>
                            )}
                          </div>
                          <div className="flex w-[55%] max-w-[200px] items-center gap-1">
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={
                                values[asset.id]
                                  ? Number(parseAmount(values[asset.id])).toLocaleString('ko-KR')
                                  : ''
                              }
                              onChange={(e) =>
                                setValues((prev) => ({
                                  ...prev,
                                  [asset.id]: String(parseAmount(e.target.value)),
                                }))
                              }
                              placeholder="0"
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
        </>
      )}

      {/* 저장 버튼 (하단 고정) */}
      {assets.length > 0 && (
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
      )}
    </div>
  )
}
