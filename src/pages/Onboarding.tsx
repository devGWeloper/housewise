import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCouple, joinCouple } from '@/lib/auth'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types'

export default function Onboarding() {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [role, setRole] = useState<UserRole>('husband')
  const [inviteCode, setInviteCode] = useState('')
  const [resultCode, setResultCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) return <Navigate to="/login" replace />
  if (profile?.coupleId) return <Navigate to="/" replace />

  const handleCreate = async () => {
    if (!displayName.trim()) { setError('이름을 입력해주세요.'); return }
    setLoading(true)
    setError('')
    try {
      const { inviteCode } = await createCouple(user.uid, displayName, role)
      setResultCode(inviteCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!displayName.trim()) { setError('이름을 입력해주세요.'); return }
    if (!inviteCode.trim()) { setError('초대 코드를 입력해주세요.'); return }
    setLoading(true)
    setError('')
    try {
      await joinCouple(user.uid, displayName, role, inviteCode.toUpperCase())
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (resultCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-card/90">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">커플 생성 완료!</CardTitle>
            <CardDescription>아래 초대 코드를 파트너에게 전달하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="rounded-2xl border border-border/70 bg-secondary/70 p-6">
              <p className="text-3xl font-mono font-bold tracking-widest text-primary">
                {resultCode}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              파트너가 이 코드로 참여하면 함께 가계부를 사용할 수 있습니다.
            </p>
            <Button className="w-full" onClick={() => navigate('/', { replace: true })}>
              대시보드로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-border/75 bg-card/85 backdrop-blur-md shadow-xl">
        <div className="absolute -top-32 right-5 h-64 w-64 rounded-full bg-primary/14 blur-3xl" />
        <div className="absolute -bottom-28 -left-8 h-72 w-72 rounded-full bg-chart-3/14 blur-3xl" />

        <div className="relative grid lg:grid-cols-[1fr_1.05fr]">
          <div className="hidden lg:flex flex-col justify-between border-r border-border/50 p-10">
            <div>
              <p className="text-xs tracking-[0.22em] text-primary/75 font-semibold">PARTNER SETUP</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight">
                함께 쓰는
                <br />
                재무 공간 만들기
              </h1>
              <p className="mt-4 text-muted-foreground">
                한 명이 커플을 생성하고, 다른 한 명이 코드를 입력하면 즉시
                연결됩니다.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/85 p-5 text-sm text-muted-foreground">
              연결 후에는 수입/지출, 예산, 자산 데이터가 자동으로 공유됩니다.
            </div>
          </div>

          <Card className="w-full border-none bg-transparent shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-primary">환영합니다!</CardTitle>
          <CardDescription>커플 계정을 설정해주세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-5 pb-8 sm:px-8 md:px-10">
          {mode === 'select' && (
            <div className="space-y-3 pt-2">
              <Button className="w-full h-14 text-base" onClick={() => setMode('create')}>
                새 커플 만들기
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 text-base bg-background/70"
                onClick={() => setMode('join')}
              >
                초대 코드로 참여하기
              </Button>
            </div>
          )}

          {(mode === 'create' || mode === 'join') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>이름</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div className="space-y-2">
                <Label>역할</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={role === 'husband' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setRole('husband')}
                  >
                    남편
                  </Button>
                  <Button
                    type="button"
                    variant={role === 'wife' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setRole('wife')}
                  >
                    아내
                  </Button>
                </div>
              </div>

              {mode === 'join' && (
                <div className="space-y-2">
                  <Label>초대 코드</Label>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="6자리 초대 코드"
                    maxLength={6}
                    className="text-center text-lg tracking-widest font-mono"
                  />
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setMode('select'); setError('') }}>
                  뒤로
                </Button>
                <Button
                  className="flex-1"
                  onClick={mode === 'create' ? handleCreate : handleJoin}
                  disabled={loading}
                >
                  {loading ? '처리중...' : mode === 'create' ? '커플 만들기' : '참여하기'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
