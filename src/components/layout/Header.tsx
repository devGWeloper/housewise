import { useAuthStore } from '@/stores/authStore'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getNavItem } from './navigation'

export function Header() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const initials = profile?.displayName?.slice(0, 1) ?? '?'
  const currentNavItem = getNavItem(pathname)

  return (
    <header className="sticky top-0 z-30 border-b border-border/75 bg-background/88 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-3 sm:px-4 md:px-8">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/75 md:hidden">
            Housewise
          </p>
          <h1 className="truncate text-base font-semibold text-primary sm:text-lg">
            {currentNavItem?.label ?? '우리 가계부'}
          </h1>
          <p className="hidden truncate text-sm text-muted-foreground md:block">
            {currentNavItem?.description ?? '오늘도 함께 만드는 건강한 가계 습관'}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 shrink-0 rounded-full border border-border/80 bg-background/90">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/90 text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5 text-sm">
              <p className="font-medium">{profile?.displayName}</p>
              <p className="text-muted-foreground text-xs">{profile?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              설정
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
