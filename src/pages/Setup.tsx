import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, PiggyBank, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency } from '@/lib/format'
import { ASSET_TYPE_LABELS, type AssetOwner } from '@/types'

export default function SetupPage() {
  const navigate = useNavigate()
  const { assets, loading, addAsset, deleteAsset, totalAssets, totalDebt, netWorth } = useAssets()
  const { profile } = useAuthStore()
  const defaultOwner: AssetOwner = profile?.role ?? 'joint'
  const [dialogOpen, setDialogOpen] = useState(false)

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <Card className="border-primary/25 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="py-6 text-center">
          <PiggyBank className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 text-xl font-semibold">우리 부부 자산 등록</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            지금 가지고 있는 통장·투자·연금·부채를 등록해두면
            <br />
            앞으로는 매달 잔액만 입력해 현황과 추이를 한눈에 볼 수 있어요.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          등록한 항목 {assets.length}개
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> 자산 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>자산 추가</DialogTitle>
            </DialogHeader>
            <AssetForm
              assetType="deposit"
              defaultOwner={defaultOwner}
              allowTypeSelect
              onSubmit={async (data) => { await addAsset(data) }}
              onClose={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            아직 등록된 자산이 없어요.<br />
            '자산 추가'로 통장·투자·부채를 하나씩 등록해 주세요.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {assets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">{ASSET_TYPE_LABELS[asset.assetType]}</span>
                      <p className="truncate font-medium">{asset.name}</p>
                      <OwnerBadge owner={asset.owner ?? 'joint'} />
                    </div>
                    {asset.purpose && <p className="text-xs text-primary/80">{asset.purpose}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${asset.assetType === 'debt' ? 'text-red-500' : ''}`}>
                      {formatCurrency(asset.balance)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAsset(asset.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid grid-cols-3 gap-3 py-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">총 자산</p>
                <p className="font-bold break-all">{formatCurrency(totalAssets)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">부채</p>
                <p className="font-bold text-red-500 break-all">{formatCurrency(totalDebt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">순자산</p>
                <p className="font-bold text-primary break-all">{formatCurrency(netWorth)}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button className="w-full sm:flex-1" onClick={() => navigate('/', { replace: true })}>
          {assets.length > 0 ? '완료하고 시작하기' : '나중에 등록하기'}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
