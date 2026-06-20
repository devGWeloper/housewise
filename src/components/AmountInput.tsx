import { Input } from '@/components/ui/input'
import { parseAmount } from '@/lib/format'

// 콤마가 자동으로 들어가는 금액 입력 필드 (숫자만 파싱).
// 빈 값은 빈 문자열을 그대로 유지해 placeholder가 보이게 한다.
export function AmountInput({
  value,
  onChange,
  className,
  placeholder = '0',
  id,
}: {
  value: string
  onChange: (next: string) => void
  className?: string
  placeholder?: string
  id?: string
}) {
  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      value={value ? parseAmount(value).toLocaleString('ko-KR') : ''}
      onChange={(e) => onChange(String(parseAmount(e.target.value)))}
      placeholder={placeholder}
      className={className}
    />
  )
}
