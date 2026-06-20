import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, PiggyBank, Check, Sparkles, Pencil, ArrowLeft, ArrowRight, PartyPopper } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AssetForm } from '@/components/AssetForm'
import { OwnerBadge } from '@/components/OwnerBadge'
import { useAssets } from '@/hooks/useAssets'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency, formatPercent } from '@/lib/format'
import { ASSET_TYPE_GUIDE, ASSET_TYPE_ORDER, computeAssetReturn } from '@/lib/asset'
import { ASSET_TYPE_LABELS, type Asset, type AssetType, type AssetOwner } from '@/types'

// 단계별 질문 카피 (자산관리 맥락의 안내 — 별도 강의가 아니라 입력 가이드)
const STEP_QUESTION: Record<AssetType, { q: string; sub: string }> = {
  deposit: {
    q: '통장은 몇 개 있나요?',
    sub: '월급통장·비상금·청약·적금 등 현금이 들어있는 계좌를 모두 추가해요.',
  },
  stock: {
    q: '투자하고 있나요?',
    sub: '주식·ETF·펀드 등 증권 계좌를 추가해요. 투자 원금을 적으면 수익률이 자동 계산돼요.',
  },
  pension: {
    q: '노후 준비 자산이 있나요?',
    sub: '국민연금·퇴직연금(IRP)·연금저축 등을 추가해요.',
  },
  debt: {
    q: '갚고 있는 대출이 있나요?',
    sub: '주택담보·전세자금·신용대출 등을 추가해요. 없으면 건너뛰어도 돼요.',
  },
}

function AssetRow({ asset, onEdit, onDelete }: { asset: Asset; onEdit: () => void; onDelete: () => void }) {
  const ret = computeAssetReturn(asset)
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate font-medium">{asset.name}</p>
          <OwnerBadge owner={asset.owner ?? 'joint'} />
        </div>
        {asset.purpose && <p className="mt-0.5 text-xs text-primary/80">{asset.purpose}</p>}
        {asset.details?.holdings && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{asset.details.holdings}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="text-right">
          <p className={`font-semibold ${asset.assetType === 'debt' ? 'text-red-500' : ''}`}>
            {formatCurrency(asset.balance)}
          </p>
          {ret && (
            <p className={`text-[11px] font-medium ${ret.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {formatPercent(ret.rate)}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

export default function SetupPage() {
  const navigate = useNavigate()
  const { assets, loading, addAsset, updateAsset, deleteAsset, totalAssets, totalDebt, netWorth } = useAssets()
  const { profile } = useAuthStore()
  const defaultOwner: AssetOwner = profile?.role ?? 'joint'

  // -1 = 인트로, 0~3 = 타입별 단계, 4 = 완료 요약
  const [step, setStep] = useState(-1)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const totalSteps = ASSET_TYPE_ORDER.length // 4
  const byType = (t: AssetType) => assets.filter((a) => a.assetType === t)

  if (loading) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  // ── 인트로 ──
  if (step === -1) {
    return (
      <div className="mx-auto flex min-h-[72vh] max-w-lg flex-col justify-center">
        <Card className="border-primary/25 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="space-y-5 py-8 text-center">
            <PiggyBank className="mx-auto h-12 w-12 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">우리 부부 자산 등록을 시작해요</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                통장·투자·연금·부채를 한 번만 등록해두면, 앞으로는
                <b className="text-foreground"> 매달 잔액만</b> 업데이트해서 순자산과 추이를 한눈에 볼 수 있어요.
              </p>
            </div>
            <div className="space-y-2 rounded-2xl border border-border/60 bg-background/70 p-4 text-left text-sm">
              {ASSET_TYPE_ORDER.map((t, i) => {
                const g = ASSET_TYPE_GUIDE[t]
                return (
                  <div key={t} className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-lg leading-none">{g.emoji}</span>
                    <span className="font-medium">{g.title}</span>
                  </div>
                )
              })}
            </div>
            <Button size="lg" className="w-full" onClick={() => setStep(0)}>
              <Sparkles className="mr-1.5 h-4 w-4" /> 단계별로 등록 시작
            </Button>
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              나중에 할게요
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── 완료 요약 ──
  if (step >= totalSteps) {
    return (
      <div className="mx-auto max-w-xl space-y-6 pb-8">
        <Card className="border-primary/25 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="space-y-3 py-8 text-center">
            <PartyPopper className="mx-auto h-12 w-12 text-primary" />
            <h2 className="text-xl font-semibold">등록 완료!</h2>
            <p className="text-sm text-muted-foreground">
              자산 {assets.length}개를 등록했어요. 이제 매달 잔액만 업데이트하면 돼요.
            </p>
            <div className="mt-2 grid grid-cols-3 gap-3 rounded-2xl border border-border/60 bg-background/70 py-4 text-center">
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
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setStep(totalSteps - 1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> 이전
          </Button>
          <Button className="flex-1" onClick={() => navigate('/', { replace: true })}>
            <Check className="mr-1 h-4 w-4" /> 시작하기
          </Button>
        </div>
      </div>
    )
  }

  // ── 타입별 단계 ──
  const type = ASSET_TYPE_ORDER[step]
  const guide = ASSET_TYPE_GUIDE[type]
  const question = STEP_QUESTION[type]
  const items = byType(type)
  // 통장(1단계)은 최소 1개를 권장 — 입력해야 '다음'이 활성화된다.
  const gated = type === 'deposit'
  const canProceed = !gated || items.length > 0
  const isLastTypeStep = step === totalSteps - 1

  const goNext = () => setStep(step + 1)
  const goPrev = () => setStep(step - 1)

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-8">
      {/* 진행률 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{step + 1} / {totalSteps} 단계</span>
          <span>{guide.emoji} {ASSET_TYPE_LABELS[type]}</span>
        </div>
        <Progress value={((step + 1) / totalSteps) * 100} className="h-1.5" />
      </div>

      {/* 질문 */}
      <div>
        <h2 className="text-xl font-semibold">{question.q}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{question.sub}</p>
      </div>

      {/* 도움말 (입력 힌트) */}
      <div className="rounded-xl border border-border/60 bg-muted/30 px-3.5 py-3">
        <ul className="space-y-1">
          {guide.tips.map((tip) => (
            <li key={tip} className="flex gap-1.5 text-xs leading-relaxed text-muted-foreground">
              <span className="text-primary">·</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 추가된 항목 */}
      {items.length > 0 && (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {items.map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                onEdit={() => { setEditing(asset); setFormOpen(true) }}
                onDelete={() => deleteAsset(asset.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* 추가 버튼 */}
      <Button
        variant="outline"
        className="h-12 w-full border-dashed"
        onClick={() => { setEditing(null); setFormOpen(true) }}
      >
        <Plus className="mr-1 h-4 w-4" />
        {ASSET_TYPE_LABELS[type]} {items.length > 0 ? '더 추가' : '추가하기'}
      </Button>

      {/* 이동 */}
      <div className="flex items-center gap-2 pt-2">
        {step > 0 && (
          <Button variant="ghost" onClick={goPrev}>
            <ArrowLeft className="mr-1 h-4 w-4" /> 이전
          </Button>
        )}
        <Button className="flex-1" onClick={goNext} disabled={!canProceed}>
          {isLastTypeStep ? '완료하기' : items.length > 0 ? '다음' : '건너뛰기'}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      {gated && !canProceed && (
        <button
          type="button"
          onClick={goNext}
          className="mx-auto block text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          통장이 없어요, 건너뛸게요
        </button>
      )}

      {/* 입력 폼 (현재 단계 타입으로 고정) */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null) }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? `${ASSET_TYPE_LABELS[type]} 수정` : `${ASSET_TYPE_LABELS[type]} 추가`}
            </DialogTitle>
          </DialogHeader>
          <AssetForm
            assetType={type}
            initial={editing ?? undefined}
            defaultOwner={defaultOwner}
            onSubmit={async (data) => {
              if (editing) await updateAsset(editing.id, data)
              else await addAsset(data)
            }}
            onClose={() => { setFormOpen(false); setEditing(null) }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
