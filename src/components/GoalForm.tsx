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
import { cn } from '@/lib/utils'
import type { GoalInput } from '@/hooks/useGoals'
import {
  GOAL_EMOJI_PRESETS,
  GOAL_TRACK_HINTS,
  GOAL_TRACK_LABELS,
  type Goal,
  type GoalTrack,
} from '@/types'

const TRACKS: GoalTrack[] = ['networth', 'assets', 'manual']

function parseAmount(v: string): number {
  const n = Number(v.replace(/[^\d]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function AmountInput({
  value,
  onChange,
  placeholder = '0',
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex items-center gap-1">
      <Input
        type="text"
        inputMode="numeric"
        value={value ? parseAmount(value).toLocaleString('ko-KR') : ''}
        onChange={(e) => onChange(String(parseAmount(e.target.value)))}
        placeholder={placeholder}
        className="text-right"
      />
      <span className="shrink-0 text-xs text-muted-foreground">원</span>
    </div>
  )
}

export function GoalForm({
  initial,
  onSubmit,
  onClose,
}: {
  initial?: Goal
  onSubmit: (data: GoalInput) => Promise<void>
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? GOAL_EMOJI_PRESETS[0])
  const [track, setTrack] = useState<GoalTrack>(initial?.track ?? 'networth')
  const [targetAmount, setTargetAmount] = useState(initial?.targetAmount?.toString() ?? '')
  const [currentAmount, setCurrentAmount] = useState(initial?.currentAmount?.toString() ?? '')
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const target = parseAmount(targetAmount)
    if (!name.trim() || target <= 0) return
    setSaving(true)

    const data: GoalInput = {
      name: name.trim(),
      emoji,
      track,
      targetAmount: target,
    }
    if (track === 'manual') data.currentAmount = parseAmount(currentAmount)
    if (targetDate) data.targetDate = targetDate

    await onSubmit(data)
    setSaving(false)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>아이콘</Label>
        <div className="flex flex-wrap gap-1.5">
          {GOAL_EMOJI_PRESETS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition',
                emoji === e ? 'border-primary bg-primary/10' : 'border-border/70 hover:bg-muted',
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>목표 이름</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 내 집 마련, 비상금, 신혼여행"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>진행 기준</Label>
        <Select value={track} onValueChange={(v) => setTrack(v as GoalTrack)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TRACKS.map((t) => (
              <SelectItem key={t} value={t}>{GOAL_TRACK_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{GOAL_TRACK_HINTS[track]}</p>
      </div>

      <div className="space-y-2">
        <Label>목표 금액</Label>
        <AmountInput value={targetAmount} onChange={setTargetAmount} />
      </div>

      {track === 'manual' && (
        <div className="space-y-2">
          <Label>현재 모은 금액</Label>
          <AmountInput value={currentAmount} onChange={setCurrentAmount} />
        </div>
      )}

      <div className="space-y-2">
        <Label>목표 시점 <span className="font-normal text-muted-foreground">(선택)</span></Label>
        <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
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
