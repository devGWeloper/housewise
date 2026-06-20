import { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AmountInput } from '@/components/AmountInput'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ASSET_TYPE_GUIDE, ASSET_TYPE_ORDER, PURPOSE_PRESETS } from '@/lib/asset'
import { formatCurrency, formatPercent, parseAmount } from '@/lib/format'
import {
  ASSET_OWNERS,
  ASSET_OWNER_LABELS,
  ASSET_TYPE_LABELS,
  type Asset,
  type AssetType,
  type AssetOwner,
} from '@/types'

// 라벨 + 작은 힌트를 함께 보여주는 필드 래퍼
function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string
  hint?: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-baseline gap-1.5">
        {label}
        {optional && <span className="text-xs font-normal text-muted-foreground">(선택)</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function AssetForm({
  assetType: fixedType,
  onSubmit,
  onClose,
  initial,
  defaultOwner,
  allowTypeSelect = false,
}: {
  assetType: AssetType
  onSubmit: (data: Omit<Asset, 'id' | 'coupleId'>) => Promise<void>
  onClose: () => void
  initial?: Asset
  defaultOwner: AssetOwner
  allowTypeSelect?: boolean
}) {
  const [assetType, setAssetType] = useState<AssetType>(initial?.assetType ?? fixedType)
  const [name, setName] = useState(initial?.name ?? '')
  const [owner, setOwner] = useState<AssetOwner>(initial?.owner ?? defaultOwner)
  const [purpose, setPurpose] = useState(initial?.purpose ?? '')
  const [balance, setBalance] = useState(initial?.balance?.toString() ?? '')
  const [bankName, setBankName] = useState(initial?.details?.bankName ?? '')
  const [maturityDate, setMaturityDate] = useState(initial?.details?.maturityDate ?? '')
  const [pensionType, setPensionType] = useState<'국민연금' | '개인연금'>(initial?.details?.pensionType ?? '개인연금')
  const [monthlyPayment, setMonthlyPayment] = useState(initial?.details?.monthlyPayment?.toString() ?? '')
  const [originalAmount, setOriginalAmount] = useState(initial?.details?.originalAmount?.toString() ?? '')
  const [principal, setPrincipal] = useState(initial?.details?.principal?.toString() ?? '')
  const [accountCash, setAccountCash] = useState(initial?.details?.accountCash?.toString() ?? '')
  const [holdings, setHoldings] = useState(initial?.details?.holdings ?? '')
  const [saving, setSaving] = useState(false)

  const guide = ASSET_TYPE_GUIDE[assetType]
  const isInvestment = assetType === 'stock' || assetType === 'pension'

  // 입력 중 실시간 수익률 (투자/연금 + 원금 입력 시)
  const balanceNum = parseAmount(balance)
  const principalNum = parseAmount(principal)
  const liveReturn =
    isInvestment && principalNum > 0
      ? { profit: balanceNum - principalNum, rate: ((balanceNum - principalNum) / principalNum) * 100 }
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !balance) return
    setSaving(true)

    const details: Asset['details'] = {}
    if (assetType === 'deposit') {
      if (bankName.trim()) details.bankName = bankName.trim()
      if (maturityDate) details.maturityDate = maturityDate
    } else if (assetType === 'stock') {
      if (principalNum > 0) details.principal = principalNum
      if (parseAmount(accountCash) > 0) details.accountCash = parseAmount(accountCash)
      if (holdings.trim()) details.holdings = holdings.trim()
    } else if (assetType === 'pension') {
      details.pensionType = pensionType
      if (principalNum > 0) details.principal = principalNum
      if (holdings.trim()) details.holdings = holdings.trim()
    } else if (assetType === 'debt') {
      if (parseAmount(originalAmount) > 0) details.originalAmount = parseAmount(originalAmount)
      if (parseAmount(monthlyPayment) > 0) details.monthlyPayment = parseAmount(monthlyPayment)
    }

    const data: Omit<Asset, 'id' | 'coupleId'> = {
      assetType,
      name: name.trim(),
      owner,
      balance: balanceNum,
      details,
    }
    if (purpose.trim()) data.purpose = purpose.trim()

    await onSubmit(data)
    setSaving(false)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {allowTypeSelect && (
        <Field label="어떤 자산인가요?">
          <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ASSET_TYPE_ORDER.map((t) => (
                <SelectItem key={t} value={t}>
                  {ASSET_TYPE_GUIDE[t].emoji} {ASSET_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {/* 타입 안내 (한 줄 설명 + 예시) */}
      <div className="rounded-xl border border-border/70 bg-muted/40 px-3.5 py-3">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <span>{guide.emoji}</span>
          {guide.title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{guide.summary}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {guide.examples.map((ex) => (
            <span key={ex} className="rounded-full bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
              {ex}
            </span>
          ))}
        </div>
      </div>

      <Field label={guide.fields.name.label} hint={guide.fields.name.hint}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={guide.fields.name.hint.replace('예: ', '')} required />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="명의">
          <Select value={owner} onValueChange={(v) => setOwner(v as AssetOwner)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ASSET_OWNERS.map((o) => (
                <SelectItem key={o} value={o}>{ASSET_OWNER_LABELS[o]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label={guide.fields.balance.label}
          hint={guide.fields.balance.hint}
        >
          <div className="flex items-center gap-1">
            <AmountInput value={balance} onChange={setBalance} className={assetType === 'debt' ? 'text-red-500' : ''} />
            <span className="shrink-0 text-xs text-muted-foreground">원</span>
          </div>
        </Field>
      </div>

      <Field
        label="용도"
        optional
        hint={assetType === 'debt' ? '이 대출의 목적' : '이 자산을 어디에 쓰는 돈인지 적어두면 한눈에 보여요.'}
      >
        <Input
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder={assetType === 'debt' ? '예: 내 집 마련' : '예: 투자용, 공과금 자동이체, 비상금'}
        />
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {PURPOSE_PRESETS[assetType].map((p) => {
            const active = purpose === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPurpose(active ? '' : p)}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/70 text-muted-foreground hover:border-primary/40'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>
      </Field>

      {assetType === 'deposit' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="은행명" optional>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="예: 국민은행" />
          </Field>
          <Field label="만기일" optional hint="적금·예금이면 만기 알림을 받아요">
            <Input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} />
          </Field>
        </div>
      )}

      {isInvestment && (
        <>
          <Field
            label={assetType === 'pension' ? '납입 원금' : '투자 원금'}
            optional
            hint="지금까지 넣은 원금을 적으면 수익률이 자동 계산돼요."
          >
            <div className="flex items-center gap-1">
              <AmountInput value={principal} onChange={setPrincipal} />
              <span className="shrink-0 text-xs text-muted-foreground">원</span>
            </div>
          </Field>

          {liveReturn && (
            <div
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm ${
                liveReturn.profit >= 0 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-600'
              }`}
            >
              <span className="flex items-center gap-1.5 font-medium">
                {liveReturn.profit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                수익률 {formatPercent(liveReturn.rate)}
              </span>
              <span className="font-semibold">
                {liveReturn.profit >= 0 ? '+' : ''}{formatCurrency(liveReturn.profit)}
              </span>
            </div>
          )}

          {assetType === 'stock' && (
            <Field label="계좌 내 현금" optional hint="아직 투자하지 않은 예수금(현금)이 있다면">
              <div className="flex items-center gap-1">
                <AmountInput value={accountCash} onChange={setAccountCash} />
                <span className="shrink-0 text-xs text-muted-foreground">원</span>
              </div>
            </Field>
          )}

          <Field label="보유 종목" optional hint="어떤 종목을 담고 있는지 메모해두세요.">
            <Input value={holdings} onChange={(e) => setHoldings(e.target.value)} placeholder="예: 삼성전자, S&P500 ETF" />
          </Field>
        </>
      )}

      {assetType === 'pension' && (
        <Field label="연금 유형">
          <Select value={pensionType} onValueChange={(v) => setPensionType(v as '국민연금' | '개인연금')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="개인연금">개인연금 (연금저축·IRP)</SelectItem>
              <SelectItem value="국민연금">국민연금</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}

      {assetType === 'debt' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="최초 대출금" optional hint="처음 빌린 금액 → 상환율 계산">
            <div className="flex items-center gap-1">
              <AmountInput value={originalAmount} onChange={setOriginalAmount} />
              <span className="shrink-0 text-xs text-muted-foreground">원</span>
            </div>
          </Field>
          <Field label="월 상환액" optional hint="매달 갚는 금액">
            <div className="flex items-center gap-1">
              <AmountInput value={monthlyPayment} onChange={setMonthlyPayment} />
              <span className="shrink-0 text-xs text-muted-foreground">원</span>
            </div>
          </Field>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">취소</Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? '저장 중...' : initial ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  )
}
