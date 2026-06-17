import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ASSET_OWNERS,
  ASSET_OWNER_LABELS,
  ASSET_TYPE_LABELS,
  ASSET_TYPE_ORDER,
  INVESTMENT_TYPES,
  type Asset,
  type AssetType,
  type AssetOwner,
} from '@/types'

const NAME_LABELS: Record<AssetType, string> = {
  deposit: '계좌 별명',
  cash: '현금 이름',
  stock: '종목명',
  crypto: '코인명',
  pension: '연금명',
  realestate: '부동산명',
  debt: '대출명',
}

const BALANCE_LABELS: Record<AssetType, string> = {
  deposit: '잔액',
  cash: '금액',
  stock: '평가금액',
  crypto: '평가금액',
  pension: '납입 누계',
  realestate: '현재 시세',
  debt: '잔액',
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
  const [pensionType, setPensionType] = useState<'국민연금' | '개인연금'>(initial?.details?.pensionType ?? '국민연금')
  const [monthlyPayment, setMonthlyPayment] = useState(initial?.details?.monthlyPayment?.toString() ?? '')
  const [originalAmount, setOriginalAmount] = useState(initial?.details?.originalAmount?.toString() ?? '')
  const [principal, setPrincipal] = useState(initial?.details?.principal?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  const isInvestment = INVESTMENT_TYPES.includes(assetType)

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
      details.originalAmount = originalAmount ? Number(originalAmount) : undefined
      details.monthlyPayment = monthlyPayment ? Number(monthlyPayment) : undefined
    } else if (isInvestment) {
      details.principal = principal ? Number(principal) : undefined
    }

    const data: Omit<Asset, 'id' | 'coupleId'> = { assetType, name, owner, balance: Number(balance), details }
    if (purpose.trim()) data.purpose = purpose.trim()

    await onSubmit(data)
    setSaving(false)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {allowTypeSelect && (
        <div className="space-y-2">
          <Label>종류</Label>
          <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ASSET_TYPE_ORDER.map((t) => (
                <SelectItem key={t} value={t}>{ASSET_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>{NAME_LABELS[assetType]}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label>명의</Label>
        <Select value={owner} onValueChange={(v) => setOwner(v as AssetOwner)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ASSET_OWNERS.map((o) => (
              <SelectItem key={o} value={o}>{ASSET_OWNER_LABELS[o]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>용도 <span className="text-muted-foreground font-normal">(선택)</span></Label>
        <Input
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder={assetType === 'debt' ? '예: 주택담보대출' : '예: 투자용, 공과금 자동이체, 비상금'}
        />
      </div>

      <div className="space-y-2">
        <Label>{BALANCE_LABELS[assetType]}</Label>
        <Input type="number" inputMode="numeric" value={balance} onChange={(e) => setBalance(e.target.value)} min="0" required />
      </div>

      {isInvestment && (
        <div className="space-y-2">
          <Label>투자원금 <span className="text-muted-foreground font-normal">(선택)</span></Label>
          <Input
            type="number"
            inputMode="numeric"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="원금을 넣으면 수익률이 계산돼요"
            min="0"
          />
        </div>
      )}

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
        <>
          <div className="space-y-2">
            <Label>최초 대출금</Label>
            <Input type="number" inputMode="numeric" value={originalAmount} onChange={(e) => setOriginalAmount(e.target.value)} placeholder="선택 입력" min="0" />
          </div>
          <div className="space-y-2">
            <Label>월 상환액</Label>
            <Input type="number" inputMode="numeric" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} placeholder="선택 입력" min="0" />
          </div>
        </>
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
