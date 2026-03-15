import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { Header } from './Header'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Sidebar />
      <div className="md:pl-64">
        <Header />
        <main className="px-3 pb-28 pt-4 sm:px-4 md:px-8 md:pb-10 md:pt-6">
          <div className="mx-auto w-full max-w-[1320px] pb-3">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
