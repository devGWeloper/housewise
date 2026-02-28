import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { Copy, Check, LogOut, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { db } from '@/lib/firebase'
import { signOut } from '@/lib/auth'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types'

export default function SettingsPage() {
  const { profile, couple, user } = useAuthStore()
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [role, setRole] = useState<UserRole>(profile?.role ?? 'husband')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSave = async () => {
    if (!user || !displayName.trim()) return
    setSaving(true)
    await updateDoc(doc(db, 'users', user.uid), { displayName, role })
    setSaving(false)
  }

  const copyInviteCode = () => {
    if (couple?.inviteCode) {
      navigator.clipboard.writeText(couple.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-xl space-y-7">
      <div className="rounded-2xl border border-border/70 bg-card/80 px-5 py-4 backdrop-blur">
        <h2>설정</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">프로필</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>이메일</Label>
            <Input value={profile?.email ?? ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>이름</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
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
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? '저장 중...' : '프로필 저장'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            파트너 연동
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">연동 상태</span>
            <Badge variant={couple && couple.members.length >= 2 ? 'default' : 'secondary'}>
              {couple && couple.members.length >= 2 ? '연동 완료' : '대기 중'}
            </Badge>
          </div>
          {couple && (
            <div>
              <Label className="text-sm">초대 코드</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="bg-muted px-4 py-2 rounded-md font-mono text-lg tracking-widest flex-1 text-center">
                  {couple.inviteCode}
                </div>
                <Button variant="outline" size="icon" onClick={copyInviteCode}>
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                이 코드를 파트너에게 공유하세요.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Button variant="destructive" className="w-full" onClick={() => signOut()}>
        <LogOut className="h-4 w-4 mr-2" />
        로그아웃
      </Button>
    </div>
  )
}
