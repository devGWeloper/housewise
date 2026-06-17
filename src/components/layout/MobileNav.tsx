import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { primaryNavItems } from './navigation'

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 rounded-2xl border border-border/70 bg-background/92 px-1 py-1.5 shadow-xl backdrop-blur-xl">
      <div
        className="grid h-14 gap-1"
        style={{ gridTemplateColumns: `repeat(${primaryNavItems.length}, minmax(0, 1fr))` }}
      >
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[11px] transition-all',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            <span className="truncate max-w-[64px] text-center leading-tight">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
