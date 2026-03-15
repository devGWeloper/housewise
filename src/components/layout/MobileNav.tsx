import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { primaryNavItems, secondaryNavItems } from './navigation'

export function MobileNav() {
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const moreActive = useMemo(
    () => secondaryNavItems.some((item) => item.to === pathname),
    [pathname],
  )

  return (
    <>
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 rounded-2xl border border-border/70 bg-background/92 px-1 py-1.5 shadow-xl backdrop-blur-xl">
        <div className="grid h-14 grid-cols-5 gap-1">
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground',
                )
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span className="truncate max-w-[52px] text-center leading-tight">
                {item.label}
              </span>
            </NavLink>
          ))}

          <Button
            type="button"
            variant="ghost"
            className={cn(
              'h-auto min-w-0 flex-col gap-0.5 rounded-xl px-1 py-1 text-[10px] text-muted-foreground',
              moreActive && 'bg-primary/10 text-primary',
            )}
            onClick={() => setMoreOpen(true)}
          >
            <MoreHorizontal className="h-[18px] w-[18px]" />
            <span className="truncate max-w-[52px] text-center leading-tight">
              더보기
            </span>
          </Button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl px-4 pb-6"
        >
          <SheetHeader className="px-0 pb-3">
            <SheetTitle className="text-left text-base">추가 메뉴</SheetTitle>
            <p className="text-sm text-muted-foreground">
              자주 쓰는 메뉴는 아래 탭에 두고, 관리 메뉴는 여기서 열 수 있어요.
            </p>
          </SheetHeader>

          <div className="space-y-2">
            {secondaryNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl border border-border/70 bg-card/60 px-4 py-3 transition-colors',
                    isActive && 'border-primary/30 bg-primary/5',
                  )
                }
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </NavLink>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
