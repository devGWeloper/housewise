import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AssetForm } from '@/components/AssetForm'
import { OwnerBadge } from '@/components/OwnerBadge'
import { useAssets } from '@/hooks/useAssets'
import { useMonthlyRecords } from '@/hooks/useMonthlyRecords'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency } from '@/lib/format'
import {
  ASSET_TYPE_LABELS,
  ASSET_TYPE_ORDER,
  INVESTMENT_TYPES,
  type Asset,
  type AssetType,
  type AssetOwner,
} from '@/types'

function AssetSparkline({ values, isDebt }: { values: number[]; isDebt: boolean }) {
  if (values.length < 2) return null
  const data = values.map((v, i) => ({ i, v }))
  return (
    <div className="mt-1 h-7 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={isDebt ? '#ef4444' : '#6366f1'}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function AssetList({
  assetType,
  assets,
  onEdit,
  onDelete,
  getSeries,
}: {
  assetType: AssetType
  assets: Asset[]
  onEdit: (asset: Asset) => void
  onDelete: (id: string) => void
  getSeries: (assetId: string) => number[]
}) {
  const filtered = assets.filter((a) => a.assetType === assetType)
  const total = filtered.reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">합계</span>
        <span className={`font-bold text-lg ${assetType === 'debt' ? 'text-red-500' : ''}`}>
          {formatCurrency(total)}
        </span>
      </div>
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">등록된 항목이 없습니다.</p>
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {filtered.map((asset) => (
              <div key={asset.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{asset.name}</p>
                    <OwnerBadge owner={asset.owner ?? 'joint'} />
                  </div>
                  {asset.purpose && (
                    <p className="mt-0.5 text-xs font-medium text-primary/80">{asset.purpose}</p>
                  )}
                  <p className="mt-0.5 break-words text-xs text-muted-foreground">
                    {asset.details?.bankName && `${asset.details.bankName} · `}
                    {asset.details?.pensionType && `${asset.details.pensionType} · `}
                    {asset.details?.originalAmount && `원금 ${formatCurrency(asset.details.originalAmount)} · `}
                    {asset.details?.monthlyPayment && `월 ${formatCurrency(asset.details.monthlyPayment)} 상환 · `}
                    {asset.details?.maturityDate && `만기 ${asset.details.maturityDate}`}
                  </p>
                  {INVESTMENT_TYPES.includes(assetType) && (asset.details?.principal ?? 0) > 0 && (() => {
                    const principal = asset.details.principal!
                    const profit = asset.balance - principal
                    const roi = (profit / principal) * 100
                    return (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        원금 {formatCurrency(principal)} · 수익률{' '}
                        <span className={`font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                        </span>
                      </p>
                    )
                  })()}
                  <AssetSparkline values={getSeries(asset.id)} isDebt={assetType === 'debt'} />
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className={`font-semibold text-sm sm:text-base ${assetType === 'debt' ? 'text-red-500' : ''}`}>
                    {formatCurrency(asset.balance)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(asset)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(asset.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function AssetsPage() {
  const { assets, loading, addAsset, updateAsset, deleteAsset, totalAssets, totalDebt, netWorth, ownerTotals } = useAssets()
  const { records } = useMonthlyRecords()
  const { profile } = useAuthStore()
  const defaultOwner: AssetOwner = profile?.role ?? 'joint'
  const [activeTab, setActiveTab] = useState<AssetType>('deposit')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)

  // 자산별 최근 12개월 잔액 시계열 (기록이 있는 달만)
  const getSeries = (assetId: string): number[] =>
    records
      .slice(-12)
      .map((r) => r.entries.find((e) => e.assetId === assetId)?.balance)
      .filter((v): v is number => v !== undefined)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 backdrop-blur">
        <div>
          <h2 className="text-lg font-semibold">자산 관리</h2>
          <p className="text-sm text-muted-foreground">
            통장·투자·연금·부채를 용도와 명의별로 관리해요.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/monthly">
              <ClipboardList className="h-4 w-4 mr-1" /> 월간 입력
            </Link>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" onClick={() => setEditingAsset(null)}>
                <Plus className="h-4 w-4 mr-1" /> 항목 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAsset ? `${ASSET_TYPE_LABELS[activeTab]} 수정` : `${ASSET_TYPE_LABELS[activeTab]} 추가`}
                </DialogTitle>
              </DialogHeader>
              <AssetForm
                assetType={editingAsset?.assetType ?? activeTab}
                initial={editingAsset ?? undefined}
                defaultOwner={defaultOwner}
                onSubmit={async (data) => {
                  if (editingAsset) {
                    await updateAsset(editingAsset.id, data)
                  } else {
                    await addAsset(data)
                  }
                }}
                onClose={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">총 자산</p>
            <p className="text-lg font-bold break-all">{formatCurrency(totalAssets)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">부채</p>
            <p className="text-lg font-bold break-all text-red-500">{formatCurrency(totalDebt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">순자산</p>
            <p className="text-lg font-bold break-all text-primary">{formatCurrency(netWorth)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="mb-3 text-xs text-muted-foreground">명의별 순자산</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {ownerTotals.map((ot) => (
              <div key={ot.owner} className="rounded-xl border border-border/70 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <OwnerBadge owner={ot.owner} />
                  <span className="text-sm font-bold break-all">{formatCurrency(ot.net)}</span>
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                  <span>자산 {formatCurrency(ot.assets)}</span>
                  {ot.debt > 0 && <span className="text-red-500">부채 {formatCurrency(ot.debt)}</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AssetType)}
        className="gap-4"
      >
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 sm:grid-cols-4">
          {ASSET_TYPE_ORDER.map((type) => (
            <TabsTrigger key={type} value={type} className="min-h-10 whitespace-normal text-xs sm:text-sm">
              {ASSET_TYPE_LABELS[type]}
            </TabsTrigger>
          ))}
        </TabsList>

        {ASSET_TYPE_ORDER.map((type) => (
          <TabsContent key={type} value={type}>
            <AssetList
              assetType={type}
              assets={assets}
              onEdit={(asset) => { setEditingAsset(asset); setActiveTab(asset.assetType); setDialogOpen(true) }}
              onDelete={deleteAsset}
              getSeries={getSeries}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
