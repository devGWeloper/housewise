export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount)
}

// 콤마/단위가 섞인 입력 문자열에서 숫자만 추출 (금액 입력 필드 공용)
export function parseAmount(v: string): number {
  const n = Number(v.replace(/[^\d-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// 수익률 표기 (예: +12.3%, -4.0%)
export function formatPercent(rate: number): string {
  const sign = rate > 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthLabel(month: string): string {
  const [year, mon] = month.split('-')
  return `${year}년 ${parseInt(mon)}월`
}

export function getPrevMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number)
  const date = new Date(year, mon - 2, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getNextMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number)
  const date = new Date(year, mon, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// 'YYYY-MM' -> 'N월' (차트 축/짧은 라벨용)
export function getShortMonthLabel(month: string): string {
  const mon = month.split('-')[1]
  return `${parseInt(mon)}월`
}

// 큰 금액을 차트 축에 짧게 표기 (예: 12,000,000 -> '1천2백만' 수준의 근사)
export function formatAxisAmount(v: number): string {
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 100000000) return `${sign}${(abs / 100000000).toFixed(1).replace(/\.0$/, '')}억`
  if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(0)}천만`
  if (abs >= 1000000) return `${sign}${(abs / 1000000).toFixed(0)}백만`
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(0)}만`
  return `${sign}${abs}`
}
