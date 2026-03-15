import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionType,
  type Category,
  type Transaction,
} from '@/types'

interface TransactionFormProps {
  onSubmit: (data: {
    type: TransactionType
    amount: number
    category: Category
    memo: string
    date: Date
  }) => Promise<void>
  onClose: () => void
  initial?: Transaction
  initialDate?: Date
  initialType?: TransactionType
}

export function TransactionForm({
  onSubmit,
  onClose,
  initial,
  initialDate,
  initialType,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(
    initial?.type ?? initialType ?? 'expense',
  )
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '')
  const [category, setCategory] = useState<Category | ''>(initial?.category ?? '')
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const defaultDate = initial?.date
    ? format(initial.date.toDate(), 'yyyy-MM-dd')
    : initialDate
      ? format(initialDate, 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(defaultDate)
  const [saving, setSaving] = useState(false)

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !category) return
    setSaving(true)
    await onSubmit({
      type,
      amount: Number(amount),
      category: category as Category,
      memo,
      date: new Date(date),
    })
    setSaving(false)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs
        value={type}
        onValueChange={(v) => {
          setType(v as TransactionType)
          setCategory('')
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="expense" className="flex-1">
            지출
          </TabsTrigger>
          <TabsTrigger value="income" className="flex-1">
            수입
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        <Label>날짜</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>금액</Label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="금액을 입력하세요"
          min="0"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>카테고리</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
          <SelectTrigger>
            <SelectValue placeholder="카테고리 선택" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>메모</Label>
        <Input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모 (선택)"
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          취소
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={saving || !amount || !category}
        >
          {saving ? '저장 중...' : initial ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  )
}
