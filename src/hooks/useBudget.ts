import { useState, useEffect, useCallback } from 'react'
import {
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { Budget, CategoryBudget } from '@/types'

export function useBudget(month: string) {
  const { profile } = useAuthStore()
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.coupleId) return

    const unsub = onSnapshot(
      doc(db, 'couples', profile.coupleId, 'budgets', month),
      (snapshot) => {
        if (snapshot.exists()) {
          setBudget({ id: snapshot.id, ...snapshot.data() } as Budget)
        } else {
          setBudget(null)
        }
        setLoading(false)
      },
    )

    return () => unsub()
  }, [profile?.coupleId, month])

  const saveBudget = useCallback(
    async (totalBudget: number, categoryBudgets: CategoryBudget[]) => {
      if (!profile?.coupleId) return
      await setDoc(doc(db, 'couples', profile.coupleId, 'budgets', month), {
        month,
        totalBudget,
        categoryBudgets,
        coupleId: profile.coupleId,
      })
    },
    [profile, month],
  )

  return { budget, loading, saveBudget }
}
