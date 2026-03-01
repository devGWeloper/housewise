import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Target,
  Landmark,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/transactions', icon: ArrowLeftRight, label: '수입/지출' },
  { to: '/monthly-history', icon: BarChart3, label: '월 결산' },
  { to: '/budget', icon: Target, label: '예산' },
  { to: '/assets', icon: Landmark, label: '자산' },
]

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 rounded-2xl border border-border/70 bg-background/90 px-1.5 py-1.5 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-col items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] transition-all',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
