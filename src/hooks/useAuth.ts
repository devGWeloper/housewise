import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { UserProfile, Couple } from '@/types'

export function useAuth() {
  const { setUser, setProfile, setCouple, setLoading } = useAuthStore()

  useEffect(() => {
    let unsubProfile: (() => void) | null = null
    let unsubCouple: (() => void) | null = null

    const clearProfileSub = () => {
      if (unsubProfile) { unsubProfile(); unsubProfile = null }
    }
    const clearCoupleSub = () => {
      if (unsubCouple) { unsubCouple(); unsubCouple = null }
    }

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      clearProfileSub()
      clearCoupleSub()

      if (!firebaseUser) {
        setProfile(null)
        setCouple(null)
        setLoading(false)
        return
      }

      // 프로필을 실시간 구독해서 온보딩(커플 생성/참여)으로 user 문서가
      // 생성/변경되는 즉시 반영되도록 한다.
      unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (userDoc) => {
        if (userDoc.exists()) {
          const profile = { uid: firebaseUser.uid, ...userDoc.data() } as UserProfile
          setProfile(profile)

          // 커플 구독은 coupleId 변경 시에만 다시 건다.
          clearCoupleSub()
          if (profile.coupleId) {
            unsubCouple = onSnapshot(doc(db, 'couples', profile.coupleId), (coupleDoc) => {
              if (coupleDoc.exists()) {
                setCouple({ id: coupleDoc.id, ...coupleDoc.data() } as Couple)
              }
            })
          } else {
            setCouple(null)
          }
        } else {
          setProfile(null)
          setCouple(null)
        }
        setLoading(false)
      })
    })

    return () => {
      unsubAuth()
      clearProfileSub()
      clearCoupleSub()
    }
  }, [setUser, setProfile, setCouple, setLoading])
}
