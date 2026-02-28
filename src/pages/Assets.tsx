import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAssets } from '@/hooks/useAssets'
import { formatCurrency } from '@/lib/format'
import type { Asset, AssetType } from '@/types'

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  deposit: '예금/적금',
  stock: '주식/ETF',
  pension: '연금',
  debt: '부채',
}

function AssetForm({
  assetType,
  onSubmit,
  onClose,
  initial,
}: {
  assetType: AssetType
  onSubmit: (data: Omit<Asset, 'id' | 'coupleId'>) => Promise<void>
  onClose: () => void
  initial?: Asset
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [balance, setBalance] = useState(initial?.balance?.toString() ?? '')
  const [bankName, setBankName] = useState(initial?.details?.bankName ?? '')
  const [maturityDate, setMaturityDate] = useState(initial?.details?.maturityDate ?? '')
  const [pensionType, setPensionType] = useState<'국민연금' | '개인연금'>(initial?.details?.pensionType ?? '국민연금')
  const [monthlyPayment, setMonthlyPayment] = useState(initial?.details?.monthlyPayment?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !balance) return
    setSaving(true)

    const details: Asset['details'] = {}
    if (assetType === 'deposit') {
      details.bankName = bankName
      details.maturityDate = maturityDate
    } else if (assetType === 'pension') {
      details.pensionType = pensionType
    } else if (assetType === 'debt') {
      details.monthlyPayment = monthlyPayment ? Number(monthlyPayment) : undefined
    }

    await onSubmit({ assetType, name, balance: Number(balance), details })
    setSaving(false)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{assetType === 'deposit' ? '계좌 별명' : assetType === 'stock' ? '종목명' : assetType === 'pension' ? '연금명' : '대출명'}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label>{assetType === 'stock' ? '평가금액' : assetType === 'pension' ? '납입 누계' : '잔액'}</Label>
        <Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} min="0" required />
      </div>

      {assetType === 'deposit' && (
        <>
          <div className="space-y-2">
            <Label>은행명</Label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="예: 국민은행" />
          </div>
          <div className="space-y-2">
            <Label>만기일</Label>
            <Input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} />
          </div>
        </>
      )}

      {assetType === 'pension' && (
        <div className="space-y-2">
          <Label>연금 유형</Label>
          <Select value={pensionType} onValueChange={(v) => setPensionType(v as '국민연금' | '개인연금')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="국민연금">국민연금</SelectItem>
              <SelectItem value="개인연금">개인연금</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {assetType === 'debt' && (
        <div className="space-y-2">
          <Label>월 상환액</Label>
          <Input type="number" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} placeholder="선택 입력" />
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">취소</Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? '저장 중...' : initial ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  )
}

function AssetList({
  assetType,
  assets,
  onEdit,
  onDelete,
}: {
  assetType: AssetType
  assets: Asset[]
  onEdit: (asset: Asset) => void
  onDelete: (id: string) => void
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
              <div key={asset.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{asset.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {asset.details?.bankName && `${asset.details.bankName} · `}
                    {asset.details?.pensionType && `${asset.details.pensionType} · `}
                    {asset.details?.monthlyPayment && `월 ${formatCurrency(asset.details.monthlyPayment)} 상환 · `}
                    {asset.details?.maturityDate && `만기 ${asset.details.maturityDate}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${assetType === 'debt' ? 'text-red-500' : ''}`}>
                    {formatCurrency(asset.balance)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(asset)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(asset.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
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
  const { assets, loading, addAsset, updateAsset, deleteAsset, totalAssets, totalDebt, netWorth } = useAssets()
  const [activeTab, setActiveTab] = useState<AssetType>('deposit')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <div className="rounded-2xl border border-border/70 bg-card/80 px-5 py-4 backdrop-blur">
        <h2>자산 관리</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">총 자산</p>
            <p className="text-lg font-bold">{formatCurrency(totalAssets)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">부채</p>
            <p className="text-lg font-bold text-red-500">{formatCurrency(totalDebt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">순자산</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(netWorth)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssetType)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            {(Object.entries(ASSET_TYPE_LABELS) as [AssetType, string][]).map(([type, label]) => (
              <TabsTrigger key={type} value={type}>{label}</TabsTrigger>
            ))}
          </TabsList>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditingAsset(null)}>
                <Plus className="h-4 w-4 mr-1" /> 추가
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

        {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map((type) => (
          <TabsContent key={type} value={type}>
            <AssetList
              assetType={type}
              assets={assets}
              onEdit={(asset) => { setEditingAsset(asset); setDialogOpen(true) }}
              onDelete={deleteAsset}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
