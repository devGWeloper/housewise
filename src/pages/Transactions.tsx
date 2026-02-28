import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency, getCurrentMonth, getMonthLabel, getPrevMonth, getNextMonth } from '@/lib/format'
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionType,
  type Category,
  type Transaction,
} from '@/types'

function TransactionForm({
  onSubmit,
  onClose,
  initial,
}: {
  onSubmit: (data: { type: TransactionType; amount: number; category: Category; memo: string; date: Date }) => Promise<void>
  onClose: () => void
  initial?: Transaction
}) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '')
  const [category, setCategory] = useState<Category | ''>(initial?.category ?? '')
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const [date, setDate] = useState(
    initial?.date ? format(initial.date.toDate(), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
  )
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
      <Tabs value={type} onValueChange={(v) => { setType(v as TransactionType); setCategory('') }}>
        <TabsList className="w-full">
          <TabsTrigger value="expense" className="flex-1">지출</TabsTrigger>
          <TabsTrigger value="income" className="flex-1">수입</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        <Label>날짜</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
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
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
        <Button type="submit" className="flex-1" disabled={saving || !amount || !category}>
          {saving ? '저장 중...' : initial ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  )
}

export default function Transactions() {
  const [month, setMonth] = useState(getCurrentMonth())
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions(month)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const dateKey = format(tx.date.toDate(), 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(tx)
    return acc
  }, {})

  const monthIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const monthExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setMonth(getPrevMonth(month))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">{getMonthLabel(month)}</h2>
          <Button variant="ghost" size="icon" onClick={() => setMonth(getNextMonth(month))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTx(null)}>
              <Plus className="h-4 w-4 mr-1" /> 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTx ? '거래 수정' : '새 거래 추가'}</DialogTitle>
            </DialogHeader>
            <TransactionForm
              initial={editingTx ?? undefined}
              onSubmit={async (data) => {
                if (editingTx) {
                  await updateTransaction(editingTx.id, {
                    type: data.type,
                    amount: data.amount,
                    category: data.category,
                    memo: data.memo,
                  })
                } else {
                  await addTransaction(data)
                }
              }}
              onClose={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">수입</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(monthIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">지출</p>
            <p className="text-lg font-bold text-red-500">{formatCurrency(monthExpense)}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            이번 달 거래 내역이 없습니다.
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([dateKey, txs]) => (
          <div key={dateKey} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {format(new Date(dateKey), 'M월 d일 (EEE)', { locale: ko })}
            </h3>
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {txs.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {tx.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {tx.createdByName}
                          </span>
                        </div>
                        {tx.memo && (
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {tx.memo}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setEditingTx(tx); setDialogOpen(true) }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteTransaction(tx.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))
      )}
    </div>
  )
}
