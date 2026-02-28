import { useAuthStore } from '@/stores/authStore'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Header() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()

  const initials = profile?.displayName?.slice(0, 1) ?? '?'

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border/75 bg-background/88 backdrop-blur-md flex items-center justify-between px-4 md:px-7">
      <div>
        <h1 className="text-xl font-semibold text-primary md:hidden">우리 가계부</h1>
        <p className="hidden md:block text-sm text-muted-foreground">오늘도 함께 만드는 건강한 가계 습관</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-border/80 bg-background/90">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/90 text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-sm">
            <p className="font-medium">{profile?.displayName}</p>
            <p className="text-muted-foreground text-xs">{profile?.email}</p>
          </div>
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
    </header>
  )
}
