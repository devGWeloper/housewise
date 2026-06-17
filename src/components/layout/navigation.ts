import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  BarChart3,
  CalendarClock,
  CalendarDays,
  Landmark,
  LayoutDashboard,
  Settings,
  Target,
  Wallet,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  description: string
  icon: LucideIcon
  section: 'overview' | 'analysis' | 'manage'
}

export const primaryNavItems: NavItem[] = [
  {
    to: '/',
    label: '홈',
    description: '이번 달 재정 현황을 한눈에 확인해요.',
    icon: LayoutDashboard,
    section: 'overview',
  },
  {
    to: '/transactions',
    label: '수입/지출',
    description: '거래를 기록하고 월별 내역을 관리해요.',
    icon: ArrowLeftRight,
    section: 'manage',
  },
  {
    to: '/calendar',
    label: '달력',
    description: '날짜별 거래와 고정비 일정을 확인해요.',
    icon: CalendarDays,
    section: 'overview',
  },
  {
    to: '/assets',
    label: '자산',
    description: '예금, 투자, 부채를 함께 관리해요.',
    icon: Landmark,
    section: 'manage',
  },
]

export const secondaryNavItems: NavItem[] = [
  {
    to: '/asset-update',
    label: '자산 업데이트',
    description: '한 달에 한 번, 자산·부채 잔액을 기록해요.',
    icon: Wallet,
    section: 'manage',
  },
  {
    to: '/fixed-costs',
    label: '고정비',
    description: '월세, 보험, 구독료처럼 반복 지출을 관리해요.',
    icon: CalendarClock,
    section: 'manage',
  },
  {
    to: '/budget',
    label: '예산',
    description: '월 예산과 카테고리별 목표를 설정해요.',
    icon: Target,
    section: 'analysis',
  },
  {
    to: '/monthly-history',
    label: '월 결산',
    description: '월별 흐름과 지출 패턴을 되돌아봐요.',
    icon: BarChart3,
    section: 'analysis',
  },
]

export const utilityNavItems: NavItem[] = [
  {
    to: '/settings',
    label: '설정',
    description: '계정과 앱 환경을 관리해요.',
    icon: Settings,
    section: 'manage',
  },
]

const navByPath = (to: string): NavItem =>
  [...primaryNavItems, ...secondaryNavItems].find((item) => item.to === to)!

export const desktopNavSections = [
  {
    id: 'overview',
    title: '둘러보기',
    items: [navByPath('/'), navByPath('/calendar'), navByPath('/monthly-history')],
  },
  {
    id: 'manage',
    title: '관리',
    items: [
      navByPath('/transactions'),
      navByPath('/assets'),
      navByPath('/asset-update'),
      navByPath('/fixed-costs'),
      navByPath('/budget'),
    ],
  },
] as const

export const allNavItems = [...primaryNavItems, ...secondaryNavItems, ...utilityNavItems]

export function getNavItem(pathname: string): NavItem | undefined {
  return allNavItems.find((item) => item.to === pathname)
}
