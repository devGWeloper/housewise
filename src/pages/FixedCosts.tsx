import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Info, CheckCircle2, Clock, Circle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useFixedCosts } from '@/hooks/useFixedCosts'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency, getCurrentMonth } from '@/lib/format'
import { EXPENSE_CATEGORIES, type ExpenseCategory, type FixedCost } from '@/types'

function FixedCostForm({
  onSubmit,
  onClose,
  initial,
}: {
  onSubmit: (data: { name: string; amount: number; payDay: number; category: ExpenseCategory }) => Promise<void>
  onClose: () => void
  initial?: FixedCost
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '')
  const [payDay, setPayDay] = useState(initial?.payDay?.toString() ?? '')
  const [category, setCategory] = useState<ExpenseCategory | ''>(initial?.category ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !amount || !payDay || !category) return
    setSaving(true)
    await onSubmit({ name, amount: Number(amount), payDay: Number(payDay), category: category as ExpenseCategory })
    setSaving(false)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>항목명</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 월세, 보험료, 넷플릭스" required />
      </div>
      <div className="space-y-2">
        <Label>금액</Label>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="금액" min="0" required />
      </div>
      <div className="space-y-2">
        <Label>매월 결제일</Label>
        <Input type="number" value={payDay} onChange={(e) => setPayDay(e.target.value)} placeholder="1~31" min="1" max="31" required />
        <p className="text-xs text-muted-foreground">설정한 날짜에 자동으로 지출로 기록돼요</p>
      </div>
      <div className="space-y-2">
        <Label>카테고리</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
          <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">취소</Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? '저장 중...' : initial ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  )
}

type PayDayStatus = 'paid' | 'today' | 'upcoming'

export default function FixedCostsPage() {
  const currentMonth = getCurrentMonth()
  const { fixedCosts, loading, addFixedCost, updateFixedCost, deleteFixedCost, applyFixedCosts } = useFixedCosts()
  const { transactions: currentMonthTransactions } = useTransactions(currentMonth)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCost, setEditingCost] = useState<FixedCost | null>(null)

  useEffect(() => {
    applyFixedCosts(currentMonth)
  }, [applyFixedCosts, currentMonth])

  const today = new Date()
  const todayDay = today.getDate()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const recordedFixedCostIds = new Set(
    currentMonthTransactions
      .filter((tx) => tx.isFixedCost && tx.fixedCostId)
      .map((tx) => tx.fixedCostId),
  )

  const totalMonthly = fixedCosts.filter((fc) => fc.isActive).reduce((sum, fc) => sum + fc.amount, 0)

  const getStatus = (payDay: number): PayDayStatus => {
    const day = Math.min(payDay, daysInMonth)
    if (day < todayDay) return 'paid'
    if (day === todayDay) return 'today'
    return 'upcoming'
  }

  const getRelativeDayText = (payDay: number): string => {
    const day = Math.min(payDay, daysInMonth)
    const diff = day - todayDay
    if (diff < 0) return `${Math.abs(diff)}일 전 결제`
    if (diff === 0) return '오늘 결제일'
    if (diff === 1) return '내일 결제'
    return `${diff}일 후 결제`
  }

  const activeCosts = fixedCosts.filter((fc) => fc.isActive).sort((a, b) => a.payDay - b.payDay)
  const inactiveCosts = fixedCosts.filter((fc) => !fc.isActive)

  const getPaymentState = (fc: FixedCost): PayDayStatus => {
    if (recordedFixedCostIds.has(fc.id)) return 'paid'
    return getStatus(fc.payDay)
  }

  const paidCount = activeCosts.filter((fc) => getPaymentState(fc) === 'paid').length
  const remainingAmount = activeCosts
    .filter((fc) => getPaymentState(fc) !== 'paid')
    .reduce((sum, fc) => sum + fc.amount, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
      </div>
    )
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 backdrop-blur">
        <div>
          <h2 className="text-lg font-semibold">고정비 관리</h2>
          <p className="text-sm text-muted-foreground">
            반복 지출을 등록해 두면 매달 자동으로 반영돼요.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={() => setEditingCost(null)}>
              <Plus className="h-4 w-4 mr-1" /> 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCost ? '고정비 수정' : '고정비 추가'}</DialogTitle>
            </DialogHeader>
            <FixedCostForm
              initial={editingCost ?? undefined}
              onSubmit={async (data) => {
                if (editingCost) {
                  await updateFixedCost(editingCost.id, data)
                } else {
                  await addFixedCost(data)
                }
              }}
              onClose={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Explanation banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200/70 bg-blue-50/60 dark:border-blue-800/40 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium mb-0.5">고정비란?</p>
          <p className="text-xs opacity-80">
            월세, 보험료, 구독료처럼 매달 같은 날 나가는 돈이에요. 한 번 등록해두면 매달 설정한 날짜에
            자동으로 지출로 기록되어 가계부를 따로 입력하지 않아도 돼요.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">월 고정비 합계</p>
            <p className="text-xl font-bold">{formatCurrency(totalMonthly)}</p>
          </CardContent>
        </Card>
        {activeCosts.length > 0 && (
          <>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">이번 달 완료</p>
                <p className="text-xl font-bold text-emerald-600">{paidCount}건</p>
              </CardContent>
            </Card>
            <Card className="col-span-2 sm:col-span-1">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">이번 달 남은 결제</p>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(remainingAmount)}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* This month's payment schedule */}
      {activeCosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">이번 달 결제 일정</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {activeCosts.map((fc) => {
              const status = getPaymentState(fc)
              const day = Math.min(fc.payDay, daysInMonth)
              return (
                <div
                  key={fc.id}
                  className={`flex flex-col gap-3 px-4 py-3 ${
                    status === 'today' ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <div className="shrink-0 pt-0.5">
                      {status === 'paid' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                      {status === 'today' && <Clock className="h-5 w-5 text-primary animate-pulse" />}
                      {status === 'upcoming' && <Circle className="h-5 w-5 text-muted-foreground/40" />}
                    </div>

                    {/* Date */}
                    <div className="w-10 shrink-0 text-center">
                      <p className={`text-lg font-bold leading-none ${status === 'paid' ? 'text-muted-foreground/50' : status === 'today' ? 'text-primary' : ''}`}>
                        {day}
                      </p>
                      <p className="text-xs text-muted-foreground">일</p>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-medium text-sm ${status === 'paid' ? 'text-muted-foreground/60 line-through' : ''}`}>
                          {fc.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">{fc.category}</Badge>
                        {status === 'today' && (
                          <Badge className="text-xs bg-primary/15 text-primary border-0">오늘</Badge>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${status === 'paid' ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                        {getRelativeDayText(fc.payDay)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-border/70 pt-3 sm:border-0 sm:pt-0">
                    <p className={`font-semibold text-sm ${status === 'paid' ? 'text-muted-foreground/50' : ''}`}>
                      {formatCurrency(fc.amount)}
                    </p>
                    <div className="flex w-full items-center gap-1 sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs sm:flex-none"
                        onClick={() => updateFixedCost(fc.id, { isActive: false })}
                      >
                        일시중지
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setEditingCost(fc); setDialogOpen(true) }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteFixedCost(fc.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {fixedCosts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-2">등록된 고정비가 없어요</p>
            <p className="text-xs text-muted-foreground mb-4">
              월세, 보험료, 관리비 등을 등록해보세요
            </p>
            <Button onClick={() => { setEditingCost(null); setDialogOpen(true) }}>
              <Plus className="h-4 w-4 mr-1" /> 첫 고정비 추가하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Inactive costs */}
      {inactiveCosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">일시 중지된 고정비</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {inactiveCosts.map((fc) => (
              <div key={fc.id} className="flex flex-col gap-3 px-4 py-3 opacity-50 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{fc.name}</span>
                    <Badge variant="outline" className="text-xs">{fc.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">매월 {fc.payDay}일 · 자동 기록 꺼짐</p>
                </div>
                <div className="flex items-center justify-between gap-2 shrink-0 sm:justify-end">
                  <span className="font-semibold text-sm">{formatCurrency(fc.amount)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => updateFixedCost(fc.id, { isActive: true })}
                  >
                    다시 켜기
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteFixedCost(fc.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active costs management (pause option) */}
      {activeCosts.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          특정 고정비를 일시 중지하려면 수정에서 변경할 수 있어요
        </p>
      )}
    </div>
  )
}
