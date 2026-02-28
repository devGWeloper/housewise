import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { auth as firebaseAuth } from '@/lib/firebase'
import { signUpWithEmail, signInWithEmail, signInWithGoogle, checkUserProfile } from '@/lib/auth'
import { useAuthStore } from '@/stores/authStore'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuthStore()

  if (user) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setError('이름을 입력해주세요.')
          setLoading(false)
          return
        }
        await signUpWithEmail(email, password, displayName)
      } else {
        await signInWithEmail(email, password)
      }

      const profile = await checkUserProfile(firebaseAuth.currentUser!.uid)
      if (profile?.coupleId) {
        navigate('/', { replace: true })
      } else {
        navigate('/onboarding', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      const user = await signInWithGoogle()
      const profile = await checkUserProfile(user.uid)
      if (profile?.coupleId) {
        navigate('/', { replace: true })
      } else {
        navigate('/onboarding', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-3xl border border-border/75 bg-card/85 backdrop-blur-md shadow-xl">
        <div className="absolute -top-32 -left-10 h-72 w-72 rounded-full bg-primary/14 blur-3xl" />
        <div className="absolute -bottom-36 right-0 h-80 w-80 rounded-full bg-chart-2/14 blur-3xl" />

        <div className="relative grid lg:grid-cols-[1.05fr_1fr]">
          <div className="hidden lg:flex flex-col justify-between p-10 border-r border-border/50">
            <div>
              <p className="text-xs tracking-[0.22em] text-primary/75 font-semibold">HOUSEWISE</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight">
                돈 걱정 대신
                <br />
                함께하는 계획
              </h1>
              <p className="mt-4 text-muted-foreground">
                신혼부부를 위한 공유 가계부. 수입/지출, 예산, 고정비, 자산을
                한 화면에서 깔끔하게 관리하세요.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/85 p-5">
              <p className="text-sm text-muted-foreground">이번 달 목표 체크</p>
              <p className="mt-2 text-lg font-semibold">예산 80% 이내 유지하기</p>
              <p className="mt-2 text-sm text-muted-foreground">
                둘이 함께 같은 데이터를 보면서 빠르게 의사결정할 수 있어요.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-8 md:p-10">
            <Card className="w-full border-none bg-transparent shadow-none">
              <CardHeader className="px-0 text-center lg:text-left">
                <CardTitle className="text-3xl font-bold text-primary">우리 가계부</CardTitle>
                <CardDescription>공유 재무 습관을 시작해보세요</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="name">이름</Label>
                      <Input
                        id="name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="이름을 입력하세요"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="이메일을 입력하세요"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      required
                      minLength={6}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? '처리중...' : isSignUp ? '회원가입' : '로그인'}
                  </Button>
                </form>

                <Separator className="my-5" />

                <Button
                  variant="outline"
                  className="w-full bg-background/70"
                  onClick={handleGoogle}
                  disabled={loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google로 로그인
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-5">
                  {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}{' '}
                  <button
                    type="button"
                    className="text-primary font-medium hover:underline"
                    onClick={() => { setIsSignUp(!isSignUp); setError('') }}
                  >
                    {isSignUp ? '로그인' : '회원가입'}
                  </button>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
