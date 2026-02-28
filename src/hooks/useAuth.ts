import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import {
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { UserProfile, Couple } from '@/types'

export function useAuth() {
  const { setUser, setProfile, setCouple, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (!firebaseUser) {
        setProfile(null)
        setCouple(null)
        setLoading(false)
        return
      }

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (userDoc.exists()) {
        const profile = { uid: firebaseUser.uid, ...userDoc.data() } as UserProfile
        setProfile(profile)

        if (profile.coupleId) {
          const unsubCouple = onSnapshot(
            doc(db, 'couples', profile.coupleId),
            (coupleDoc) => {
              if (coupleDoc.exists()) {
                setCouple({ id: coupleDoc.id, ...coupleDoc.data() } as Couple)
              }
            },
          )
          setLoading(false)
          return () => unsubCouple()
        }
      }

      setLoading(false)
    })

    return () => unsubAuth()
  }, [setUser, setProfile, setCouple, setLoading])
}
