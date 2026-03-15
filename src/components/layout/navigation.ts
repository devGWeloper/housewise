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

export const desktopNavSections = [
  {
    id: 'overview',
    title: '둘러보기',
    items: [primaryNavItems[0], primaryNavItems[2], secondaryNavItems[2]],
  },
  {
    id: 'manage',
    title: '관리',
    items: [primaryNavItems[1], secondaryNavItems[0], secondaryNavItems[1], primaryNavItems[3]],
  },
] as const

export const allNavItems = [...primaryNavItems, ...secondaryNavItems, ...utilityNavItems]

export function getNavItem(pathname: string): NavItem | undefined {
  return allNavItems.find((item) => item.to === pathname)
}
