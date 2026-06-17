import type { LucideIcon } from 'lucide-react'
import {
  ClipboardList,
  Landmark,
  LayoutDashboard,
  Settings,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  description: string
  icon: LucideIcon
  section: 'overview' | 'manage'
}

export const primaryNavItems: NavItem[] = [
  {
    to: '/',
    label: '홈',
    description: '우리 부부 자산 현황을 한눈에 확인해요.',
    icon: LayoutDashboard,
    section: 'overview',
  },
  {
    to: '/monthly',
    label: '월간 입력',
    description: '이 달 수입·지출과 통장·자산 잔액을 기록해요.',
    icon: ClipboardList,
    section: 'manage',
  },
  {
    to: '/assets',
    label: '자산',
    description: '통장·투자·연금·부채를 용도별로 관리해요.',
    icon: Landmark,
    section: 'manage',
  },
]

export const utilityNavItems: NavItem[] = [
  {
    to: '/settings',
    label: '설정',
    description: '계정과 파트너 연동을 관리해요.',
    icon: Settings,
    section: 'manage',
  },
]

export const allNavItems = [...primaryNavItems, ...utilityNavItems]

const navByPath = (to: string): NavItem => allNavItems.find((item) => item.to === to)!

export const desktopNavSections = [
  {
    id: 'overview',
    title: '둘러보기',
    items: [navByPath('/')],
  },
  {
    id: 'manage',
    title: '관리',
    items: [navByPath('/monthly'), navByPath('/assets')],
  },
] as const

export function getNavItem(pathname: string): NavItem | undefined {
  return allNavItems.find((item) => item.to === pathname)
}
