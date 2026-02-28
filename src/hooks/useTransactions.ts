import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { Transaction, TransactionType, Category } from '@/types'

export function useTransactions(month?: string) {
  const { profile } = useAuthStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.coupleId) return

    let q = query(
      collection(db, 'couples', profile.coupleId, 'transactions'),
      orderBy('date', 'desc'),
    )

    if (month) {
      const [year, mon] = month.split('-').map(Number)
      const start = Timestamp.fromDate(new Date(year, mon - 1, 1))
      const end = Timestamp.fromDate(new Date(year, mon, 1))
      q = query(
        collection(db, 'couples', profile.coupleId, 'transactions'),
        where('date', '>=', start),
        where('date', '<', end),
        orderBy('date', 'desc'),
      )
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction))
      setTransactions(data)
      setLoading(false)
    })

    return () => unsub()
  }, [profile?.coupleId, month])

  const addTransaction = useCallback(
    async (data: {
      type: TransactionType
      amount: number
      category: Category
      memo: string
      date: Date
    }) => {
      if (!profile?.coupleId) return
      await addDoc(collection(db, 'couples', profile.coupleId, 'transactions'), {
        ...data,
        date: Timestamp.fromDate(data.date),
        createdBy: profile.uid,
        createdByName: profile.displayName,
        coupleId: profile.coupleId,
        createdAt: serverTimestamp(),
      })
    },
    [profile],
  )

  const updateTransaction = useCallback(
    async (id: string, data: Partial<Omit<Transaction, 'id'>>) => {
      if (!profile?.coupleId) return
      const updateData = { ...data } as Record<string, unknown>
      if (data.date && data.date instanceof Date) {
        updateData.date = Timestamp.fromDate(data.date as unknown as Date)
      }
      await updateDoc(doc(db, 'couples', profile.coupleId, 'transactions', id), updateData)
    },
    [profile],
  )

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!profile?.coupleId) return
      await deleteDoc(doc(db, 'couples', profile.coupleId, 'transactions', id))
    },
    [profile],
  )

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction }
}
