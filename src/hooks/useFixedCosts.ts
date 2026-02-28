import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { FixedCost, ExpenseCategory } from '@/types'

export function useFixedCosts() {
  const { profile } = useAuthStore()
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.coupleId) return

    const q = query(
      collection(db, 'couples', profile.coupleId, 'fixedCosts'),
      orderBy('payDay', 'asc'),
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FixedCost))
      setFixedCosts(data)
      setLoading(false)
    })

    return () => unsub()
  }, [profile?.coupleId])

  const addFixedCost = useCallback(
    async (data: { name: string; amount: number; payDay: number; category: ExpenseCategory }) => {
      if (!profile?.coupleId) return
      await addDoc(collection(db, 'couples', profile.coupleId, 'fixedCosts'), {
        ...data,
        isActive: true,
        coupleId: profile.coupleId,
        createdBy: profile.uid,
      })
    },
    [profile],
  )

  const updateFixedCost = useCallback(
    async (id: string, data: Partial<Omit<FixedCost, 'id'>>) => {
      if (!profile?.coupleId) return
      await updateDoc(doc(db, 'couples', profile.coupleId, 'fixedCosts', id), data)
    },
    [profile],
  )

  const deleteFixedCost = useCallback(
    async (id: string) => {
      if (!profile?.coupleId) return
      await deleteDoc(doc(db, 'couples', profile.coupleId, 'fixedCosts', id))
    },
    [profile],
  )

  const applyFixedCosts = useCallback(
    async (yearMonth: string) => {
      if (!profile?.coupleId) return

      const [year, month] = yearMonth.split('-').map(Number)
      const txCol = collection(db, 'couples', profile.coupleId, 'transactions')
      const start = Timestamp.fromDate(new Date(year, month - 1, 1))
      const end = Timestamp.fromDate(new Date(year, month, 1))

      const existing = await getDocs(
        query(txCol, where('isFixedCost', '==', true), where('date', '>=', start), where('date', '<', end)),
      )
      const appliedNames = new Set(existing.docs.map((d) => d.data().fixedCostId))

      const activeCosts = fixedCosts.filter((fc) => fc.isActive && !appliedNames.has(fc.id))

      for (const cost of activeCosts) {
        const day = Math.min(cost.payDay, new Date(year, month, 0).getDate())
        await addDoc(txCol, {
          type: 'expense',
          amount: cost.amount,
          category: cost.category,
          memo: `[고정비] ${cost.name}`,
          date: Timestamp.fromDate(new Date(year, month - 1, day)),
          createdBy: profile.uid,
          createdByName: profile.displayName,
          coupleId: profile.coupleId,
          createdAt: serverTimestamp(),
          isFixedCost: true,
          fixedCostId: cost.id,
        })
      }
    },
    [profile, fixedCosts],
  )

  return { fixedCosts, loading, addFixedCost, updateFixedCost, deleteFixedCost, applyFixedCosts }
}
