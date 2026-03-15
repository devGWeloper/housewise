import { useEffect, useMemo, useState } from 'react'
import { format, getDaysInMonth, getDay, startOfMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import type { Timestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useTransactions } from '@/hooks/useTransactions'
import { useFixedCosts } from '@/hooks/useFixedCosts'
import { TransactionForm } from '@/components/TransactionForm'
import { formatCurrency, getCurrentMonth, getPrevMonth, getNextMonth } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Transaction, TransactionType } from '@/types'

// 금액을 달력 셀에 간결하게 표시
function shortAmount(n: number): string {
  if (n >= 100000000) return `${parseFloat((n / 100000000).toFixed(1))}억`
  if (n >= 10000) return `${parseFloat((n / 10000).toFixed(1))}만`
  return n.toLocaleString('ko-KR')
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarPage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [sheetMode, setSheetMode] = useState<'detail' | 'form'>('detail')
  const [addType, setAddType] = useState<TransactionType>('expense')
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

  const { transactions, addTransaction, updateTransaction, deleteTransaction } =
    useTransactions(month)
  const { fixedCosts, applyFixedCosts } = useFixedCosts()

  useEffect(() => {
    applyFixedCosts(month)
  }, [applyFixedCosts, month])

  const [year, mon] = month.split('-').map(Number)
  const daysInMonth = getDaysInMonth(new Date(year, mon - 1))
  const firstDayOfWeek = getDay(startOfMonth(new Date(year, mon - 1)))

  const today = new Date()
  const isCurrentMonth = month === getCurrentMonth()
  const todayDay = isCurrentMonth ? today.getDate() : null

  // 날짜별 트랜잭션 그룹핑
  const txByDay = useMemo(() => {
    const map: Record<number, Transaction[]> = {}
    for (const tx of transactions) {
      const d = tx.date.toDate().getDate()
      if (!map[d]) map[d] = []
      map[d].push(tx)
    }
    return map
  }, [transactions])

  const activeFixedCosts = fixedCosts.filter((fc) => fc.isActive)

  // 달력 셀 배열 생성 (null = 빈 칸)
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  // 월 합계
  const monthIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const monthExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  // 선택된 날짜 데이터
  const selectedDate = selectedDay ? new Date(year, mon - 1, selectedDay) : null
  const selectedTxs: Transaction[] = selectedDay
    ? [...(txByDay[selectedDay] ?? [])].sort((a, b) => b.amount - a.amount)
    : []
  const selectedFixedCosts = selectedDay
    ? activeFixedCosts.filter(
        (fc) => Math.min(fc.payDay, daysInMonth) === selectedDay,
      )
    : []

  const selectedIncome = selectedTxs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const selectedExpense = selectedTxs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  function handleAddClick(type: TransactionType) {
    setEditingTx(null)
    setAddType(type)
    setSheetMode('form')
  }

  function handleEditClick(tx: Transaction) {
    setEditingTx(tx)
    setSheetMode('form')
  }

  function handleSelectDay(day: number) {
    setSelectedDay(day)
    setEditingTx(null)
    setSheetMode('detail')
  }

  function closeForm() {
    setEditingTx(null)
    setSheetMode('detail')
  }

  function closeSheet() {
    setSelectedDay(null)
    setSheetMode('detail')
    setEditingTx(null)
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {/* 월 네비게이션 + 합계 */}
      <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-4 py-3 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMonth(getPrevMonth(month))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <h2 className="text-base font-semibold">
            {format(new Date(year, mon - 1), 'yyyy년 M월')}
          </h2>
          <div className="mt-0.5 flex flex-wrap justify-center gap-3 text-xs">
            <span className="text-emerald-600">
              수입 {formatCurrency(monthIncome)}
            </span>
            <span className="text-red-500">
              지출 {formatCurrency(monthExpense)}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMonth(getNextMonth(month))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7">
        {DAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(
              'py-1.5 text-center text-xs font-medium',
              i === 0 && 'text-red-500',
              i === 6 && 'text-blue-500',
              i > 0 && i < 6 && 'text-muted-foreground',
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border/50 bg-border/40">
        {cells.map((day, idx) => {
          if (!day) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[76px] bg-background/30 sm:min-h-[92px] lg:min-h-[110px]"
              />
            )
          }

          const dayTxs = txByDay[day] ?? []
          const income = dayTxs
            .filter((t) => t.type === 'income')
            .reduce((s, t) => s + t.amount, 0)
          const expense = dayTxs
            .filter((t) => t.type === 'expense')
            .reduce((s, t) => s + t.amount, 0)
          const dayFixedCosts = activeFixedCosts.filter(
            (fc) => Math.min(fc.payDay, daysInMonth) === day,
          )
          // 아직 트랜잭션으로 반영되지 않은 고정비가 있는지 체크
          const hasUnrecordedFixed = dayFixedCosts.some(
            (fc) => !dayTxs.some((tx) => tx.fixedCostId === fc.id),
          )

          const isToday = day === todayDay
          const colIdx = idx % 7 // 0=일, 6=토

          return (
            <button
              key={day}
              onClick={() => handleSelectDay(day)}
              className={cn(
                'relative flex min-h-[76px] flex-col gap-0.5 p-1.5 text-left transition-colors sm:min-h-[92px] lg:min-h-[110px]',
                'bg-background hover:bg-muted/40 active:bg-muted/60',
                isToday && 'bg-primary/5',
              )}
            >
              {/* 날짜 숫자 */}
              <span
                className={cn(
                  'h-6 w-6 flex items-center justify-center rounded-full text-xs font-semibold leading-none',
                  isToday && 'bg-primary text-primary-foreground',
                  !isToday && colIdx === 0 && 'text-red-500',
                  !isToday && colIdx === 6 && 'text-blue-500',
                )}
              >
                {day}
              </span>

              {/* 지출 금액 */}
              {expense > 0 && (
                <span className="text-[10px] text-red-500 font-medium leading-tight w-full truncate">
                  -{shortAmount(expense)}
                </span>
              )}

              {/* 수입 금액 */}
              {income > 0 && (
                <span className="text-[10px] text-emerald-600 font-medium leading-tight w-full truncate">
                  +{shortAmount(income)}
                </span>
              )}

              {/* 고정비 예정 (미반영) */}
              {hasUnrecordedFixed && (
                <span className="text-[10px] text-orange-500 font-medium leading-tight">
                  고정비
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="flex gap-4 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
          지출
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          수입
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500" />
          고정비 예정
        </span>
      </div>

      {/* 날짜 상세 바텀 시트 */}
      <Sheet
        open={!!selectedDay}
        onOpenChange={(open) => !open && closeSheet()}
      >
        <SheetContent
          side="bottom"
          className="max-h-[85vh] flex flex-col rounded-t-2xl px-4 pb-6 sm:inset-x-auto sm:right-auto sm:bottom-4 sm:left-1/2 sm:w-[min(48rem,calc(100%-2rem))] sm:-translate-x-1/2 sm:rounded-2xl sm:border lg:w-[min(56rem,calc(100%-3rem))]"
        >
          {selectedDay && selectedDate && (
            <>
              {sheetMode === 'detail' ? (
                <>
                  <SheetHeader className="pb-2 shrink-0">
                    <SheetTitle className="text-left text-base">
                      {format(selectedDate, 'M월 d일 (EEE)', { locale: ko })}
                    </SheetTitle>
                    {/* 당일 수입/지출 합계 */}
                    {(selectedIncome > 0 || selectedExpense > 0) && (
                      <div className="flex flex-wrap gap-3 text-sm">
                        {selectedIncome > 0 && (
                          <span className="text-emerald-600 font-medium">
                            +{formatCurrency(selectedIncome)}
                          </span>
                        )}
                        {selectedExpense > 0 && (
                          <span className="text-red-500 font-medium">
                            -{formatCurrency(selectedExpense)}
                          </span>
                        )}
                        {selectedIncome > 0 && selectedExpense > 0 && (
                          <span
                            className={cn(
                              'font-medium',
                              selectedIncome - selectedExpense >= 0
                                ? 'text-emerald-600'
                                : 'text-red-500',
                            )}
                          >
                            순{' '}
                            {selectedIncome - selectedExpense >= 0 ? '+' : ''}
                            {formatCurrency(selectedIncome - selectedExpense)}
                          </span>
                        )}
                      </div>
                    )}
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto space-y-3 py-1 pb-2">
                    {/* 트랜잭션 목록 */}
                    {selectedTxs.length > 0 && (
                      <div className="space-y-2">
                        {selectedTxs.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2.5 bg-card/60"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {tx.category}
                              </Badge>
                              <div className="min-w-0">
                                {tx.memo && (
                                  <p className="text-sm truncate">{tx.memo}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {tx.createdByName}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <span
                                className={cn(
                                  'font-semibold text-sm mr-1',
                                  tx.type === 'income'
                                    ? 'text-emerald-600'
                                    : 'text-red-500',
                                )}
                              >
                                {tx.type === 'income' ? '+' : '-'}
                                {formatCurrency(tx.amount)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleEditClick(tx)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => deleteTransaction(tx.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 고정비 결제 예정일 */}
                    {selectedFixedCosts.length > 0 && (
                      <div>
                        {selectedTxs.length > 0 && (
                          <Separator className="my-3" />
                        )}
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          고정비 결제 예정일
                        </p>
                        <div className="space-y-1.5">
                          {selectedFixedCosts.map((fc) => {
                            const recorded = selectedTxs.some(
                              (tx) => tx.fixedCostId === fc.id,
                            )
                            return (
                              <div
                                key={fc.id}
                                className={cn(
                                  'flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm',
                                  recorded && 'opacity-50',
                                )}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                                  <span className="truncate">{fc.name}</span>
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    {fc.category}
                                  </Badge>
                                  {recorded && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-emerald-600 border-emerald-600/30 shrink-0"
                                    >
                                      완료
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-muted-foreground font-medium shrink-0 ml-2">
                                  {formatCurrency(fc.amount)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* 빈 상태 */}
                    {selectedTxs.length === 0 && selectedFixedCosts.length === 0 && (
                      <div className="py-8 text-center text-muted-foreground text-sm">
                        이날의 기록이 없어요.
                        <br />
                        아래 버튼으로 추가해 보세요.
                      </div>
                    )}
                  </div>

                  {/* 추가 버튼 */}
                  <div className="flex gap-2 pt-3 shrink-0">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleAddClick('income')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      수입 추가
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleAddClick('expense')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      지출 추가
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <SheetHeader className="pb-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="-ml-2 h-8 w-8"
                        onClick={closeForm}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div className="min-w-0">
                        <SheetTitle className="text-left text-base">
                          {editingTx ? '거래 수정' : '거래 추가'}
                        </SheetTitle>
                        <p className="text-sm text-muted-foreground">
                          {format(selectedDate, 'M월 d일 (EEE)', { locale: ko })}
                        </p>
                      </div>
                    </div>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto py-1 pb-2">
                    <TransactionForm
                      initial={editingTx ?? undefined}
                      initialDate={selectedDate}
                      initialType={editingTx ? undefined : addType}
                      onSubmit={async (data) => {
                        if (editingTx) {
                          await updateTransaction(editingTx.id, {
                            type: data.type,
                            amount: data.amount,
                            category: data.category,
                            memo: data.memo,
                            date: data.date as unknown as Timestamp,
                          })
                        } else {
                          await addTransaction(data)
                        }
                        closeForm()
                      }}
                      onClose={closeForm}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
