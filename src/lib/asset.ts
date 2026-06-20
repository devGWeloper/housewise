import type { Asset, AssetType } from '@/types'

// 자산 타입별 교육/안내 콘텐츠 — 온보딩 위저드·자산 폼·자산 탭이 공용으로 쓰는 단일 출처.
export interface AssetTypeGuide {
  emoji: string
  title: string
  /** 한 줄 설명: "이게 뭔가요" */
  summary: string
  /** 실제 예시 (칩으로 표시) */
  examples: string[]
  /** 초보자용 도움말 (입력 화면 하단 등) */
  tips: string[]
  /** 입력 필드 라벨/힌트 */
  fields: {
    name: { label: string; hint: string }
    balance: { label: string; hint: string }
  }
}

export const ASSET_TYPE_GUIDE: Record<AssetType, AssetTypeGuide> = {
  deposit: {
    emoji: '💳',
    title: '예금·적금·통장',
    summary: '현금이 들어있는 은행 계좌예요. 월급통장, 비상금, 청약·적금 등이 여기 해당해요.',
    examples: ['주거래 월급통장', '비상금 통장(CMA)', '주택청약저축', '여행 적금'],
    tips: [
      '통장은 "용도"별로 나눠 등록하면 어떤 돈이 어디에 있는지 한눈에 보여요.',
      '적금·예금은 만기일을 적어두면 만기 예정 알림을 받을 수 있어요.',
      '비상금은 보통 생활비 3~6개월치를 따로 모아두는 통장이에요.',
    ],
    fields: {
      name: { label: '계좌 별명', hint: '예: 우리 월급통장, 비상금 CMA' },
      balance: { label: '현재 잔액', hint: '지금 통장에 들어있는 금액' },
    },
  },
  stock: {
    emoji: '📈',
    title: '주식·ETF·펀드',
    summary: '증권 계좌에서 굴리는 투자 자산이에요. 지금의 평가금액(현재 가치)을 기록해요.',
    examples: ['삼성전자 등 국내주식', 'S&P500·나스닥 ETF', '해외주식', '펀드'],
    tips: [
      '"평가금액"은 지금 팔면 받는 현재 가치예요. 오르내려도 매달 그 시점 금액만 적으면 돼요.',
      '"투자 원금"을 함께 적으면 수익률(몇 % 올랐는지)이 자동으로 계산돼요.',
      '아직 투자 안 한 예수금(현금)은 "계좌 내 현금"에 따로 적을 수 있어요.',
    ],
    fields: {
      name: { label: '계좌·종목 이름', hint: '예: OO증권 주식계좌, 삼성전자' },
      balance: { label: '평가금액 (현재 가치)', hint: '지금 계좌에 찍힌 총 평가금액' },
    },
  },
  pension: {
    emoji: '🏦',
    title: '연금 (노후 자산)',
    summary: '국민연금·퇴직연금(IRP)·개인연금처럼 노후를 위해 쌓는 자산이에요.',
    examples: ['국민연금', '퇴직연금 IRP', '연금저축펀드', '개인연금'],
    tips: [
      '연금저축·IRP는 ETF·펀드로 굴리기도 해요. 현재 평가금액을 적으면 돼요.',
      '"납입 원금"을 적으면 운용 수익률을 함께 볼 수 있어요.',
      '연말정산 때 세액공제가 되는 대표적인 절세 계좌예요.',
    ],
    fields: {
      name: { label: '연금 이름', hint: '예: OO연금저축, 회사 퇴직연금 IRP' },
      balance: { label: '평가금액 (현재 가치)', hint: '지금까지 쌓인 평가금액' },
    },
  },
  debt: {
    emoji: '💸',
    title: '대출·부채',
    summary: '갚아야 할 빚이에요. 주택담보대출, 전세자금대출, 신용대출 등이 여기 해당해요.',
    examples: ['주택담보대출', '전세자금대출', '신용대출', '자동차 할부'],
    tips: [
      '"현재 잔액"은 지금 남은 갚을 금액이에요. 갚을수록 줄어들어요.',
      '"최초 대출금"을 적으면 얼마나 갚았는지 상환율이 보여요.',
      '월 상환액을 적으면 매달 빠져나가는 고정 지출을 파악할 수 있어요.',
    ],
    fields: {
      name: { label: '대출 이름', hint: '예: 우리집 주택담보대출' },
      balance: { label: '현재 남은 잔액', hint: '아직 갚지 않은 금액' },
    },
  },
}

export const ASSET_TYPE_ORDER: AssetType[] = ['deposit', 'stock', 'pension', 'debt']

// 통장 용도 프리셋 — 6개쯤 되는 통장을 일관된 용도로 구분하기 위한 빠른 선택지.
// 타입별로 자주 쓰는 용도를 제안한다 (자유 입력도 허용).
export const PURPOSE_PRESETS: Record<AssetType, string[]> = {
  deposit: ['월급통장', '생활비', '비상금', '저축', '투자대기', '모임/회비', '청약', '용돈'],
  stock: ['장기투자', '연금 외 투자', '배당', '단기'],
  pension: ['노후 준비', '세액공제'],
  debt: ['내 집 마련', '전세 보증금', '생활자금', '자동차'],
}

// 투자/연금 자산의 수익률·평가손익 (투자 원금이 있어야 계산 가능)
export function computeAssetReturn(asset: Asset): { profit: number; rate: number } | null {
  if (asset.assetType !== 'stock' && asset.assetType !== 'pension') return null
  const principal = asset.details?.principal
  if (!principal || principal <= 0) return null
  const profit = asset.balance - principal
  return { profit, rate: (profit / principal) * 100 }
}
