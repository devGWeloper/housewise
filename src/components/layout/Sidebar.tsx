import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  CalendarClock,
  Landmark,
  BarChart3,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/transactions', icon: ArrowLeftRight, label: '수입/지출' },
  { to: '/monthly-history', icon: BarChart3, label: '월 결산' },
  { to: '/budget', icon: Target, label: '예산' },
  { to: '/fixed-costs', icon: CalendarClock, label: '고정비' },
  { to: '/assets', icon: Landmark, label: '자산' },
  { to: '/settings', icon: Settings, label: '설정' },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-sidebar-border/80 bg-sidebar/90 backdrop-blur-md">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border/80">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-sidebar-foreground/60">HOUSEWISE</p>
          <h1 className="text-xl font-semibold text-sidebar-primary">우리 가계부</h1>
        </div>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              )
            }
          >
            <item.icon className="h-5 w-5 transition-transform group-hover:scale-105" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
