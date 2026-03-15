import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { desktopNavSections } from './navigation'

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:fixed md:inset-y-0 md:w-64 md:flex-col border-r border-sidebar-border/80 bg-sidebar/92 backdrop-blur-md">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border/80">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-sidebar-foreground/60">HOUSEWISE</p>
          <h1 className="text-xl font-semibold text-sidebar-primary">우리 가계부</h1>
        </div>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {desktopNavSections.map((section) => (
          <div key={section.id} className="space-y-1.5">
            <p className="px-3 text-[11px] font-medium tracking-[0.18em] text-sidebar-foreground/45 uppercase">
              {section.title}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'group flex items-start gap-3 rounded-xl px-3 py-3 text-sm transition-all',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary shadow-sm'
                      : 'text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  )
                }
              >
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 transition-transform group-hover:scale-105" />
                <div className="min-w-0">
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-0.5 text-xs text-sidebar-foreground/50">
                    {item.description}
                  </p>
                </div>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border/80 px-6 py-4 text-xs text-sidebar-foreground/55">
        설정과 로그아웃은 우측 상단 프로필 메뉴에서 이용할 수 있어요.
      </div>
    </aside>
  )
}
