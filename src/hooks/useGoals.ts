import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { Goal } from '@/types'

export type GoalInput = Omit<Goal, 'id' | 'coupleId' | 'createdAt'>

export function useGoals() {
  const { profile } = useAuthStore()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.coupleId) return

    const q = query(collection(db, 'couples', profile.coupleId, 'goals'))

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Goal))
      // createdAt 오름차순 (먼저 만든 목표가 위로) — 인덱스 없이 클라이언트 정렬
      data.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))
      setGoals(data)
      setLoading(false)
    })

    return () => unsub()
  }, [profile?.coupleId])

  const addGoal = useCallback(
    async (data: GoalInput) => {
      if (!profile?.coupleId) return
      await addDoc(collection(db, 'couples', profile.coupleId, 'goals'), {
        ...data,
        coupleId: profile.coupleId,
        createdAt: serverTimestamp(),
      })
    },
    [profile],
  )

  const updateGoal = useCallback(
    async (id: string, data: Partial<GoalInput>) => {
      if (!profile?.coupleId) return
      await updateDoc(doc(db, 'couples', profile.coupleId, 'goals', id), data)
    },
    [profile],
  )

  const deleteGoal = useCallback(
    async (id: string) => {
      if (!profile?.coupleId) return
      await deleteDoc(doc(db, 'couples', profile.coupleId, 'goals', id))
    },
    [profile],
  )

  return { goals, loading, addGoal, updateGoal, deleteGoal }
}
