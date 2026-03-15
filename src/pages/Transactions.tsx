import { useEffect, useState } from 'react'
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
import { useTransactions } from '@/hooks/useTransactions'
import { useFixedCosts } from '@/hooks/useFixedCosts'
import { formatCurrency, getCurrentMonth, getMonthLabel, getPrevMonth, getNextMonth } from '@/lib/format'
import { TransactionForm } from '@/components/TransactionForm'
import type { Transaction } from '@/types'

export default function Transactions() {
  const [month, setMonth] = useState(getCurrentMonth())
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions(month)
  const { applyFixedCosts } = useFixedCosts()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

  useEffect(() => {
    applyFixedCosts(month)
  }, [applyFixedCosts, month])

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
                    date: data.date as unknown as import('firebase/firestore').Timestamp,
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
