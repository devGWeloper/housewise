import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { Header } from './Header'

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-60">
        <Header />
        <main className="px-3 pt-4 pb-24 sm:px-4 md:px-7 md:pt-6">
          <div className="mx-auto w-full max-w-7xl pb-3">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
