import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Skeleton } from '@/components/ui/skeleton'

const Login = lazy(() => import('@/pages/Login'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const AssetsPage = lazy(() => import('@/pages/Assets'))
const MonthlyEntryPage = lazy(() => import('@/pages/MonthlyEntry'))
const SetupPage = lazy(() => import('@/pages/Setup'))
const SettingsPage = lazy(() => import('@/pages/Settings'))

function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth()
  return <>{children}</>
}

function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/monthly" element={<MonthlyEntryPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/setup" element={<SetupPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  )
}
