import { useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { CoupleSettings } from '@/types'

/**
 * 부부 공동 설정(순자산 목표 등)을 관리한다.
 * 문서: couples/{coupleId}/settings/main
 * (기존 와일드카드 규칙 couples/{coupleId}/{subcollection}/{docId} 로 권한 OK)
 */
export function useGoal() {
  const { profile } = useAuthStore()
  const [settings, setSettings] = useState<CoupleSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.coupleId) return
    const ref = doc(db, 'couples', profile.coupleId, 'settings', 'main')
    const unsub = onSnapshot(ref, (snap) => {
      setSettings(snap.exists() ? (snap.data() as CoupleSettings) : null)
      setLoading(false)
    })
    return () => unsub()
  }, [profile?.coupleId])

  const saveSettings = useCallback(
    async (data: CoupleSettings) => {
      if (!profile?.coupleId) return
      const ref = doc(db, 'couples', profile.coupleId, 'settings', 'main')
      await setDoc(ref, data, { merge: true })
    },
    [profile],
  )

  return { settings, loading, saveSettings }
}
