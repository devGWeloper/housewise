import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { getPrevMonth } from '@/lib/format'

export interface MonthlyData {
  month: string   // 'YYYY-MM'
  label: string   // 'N월'
  income: number
  expense: number
  savings: number
  savingsRate: number // %
}

export function useMonthlyTrend(endMonth: string, count: number = 6) {
  const { profile } = useAuthStore()
  const [data, setData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.coupleId) return

    const fetchData = async () => {
      setLoading(true)
      const monthsList: string[] = []
      let m = endMonth
      for (let i = 0; i < count; i++) {
        monthsList.unshift(m)
        m = getPrevMonth(m)
      }

      const results: MonthlyData[] = []
      for (const month of monthsList) {
        const [year, mon] = month.split('-').map(Number)
        const start = Timestamp.fromDate(new Date(year, mon - 1, 1))
        const end = Timestamp.fromDate(new Date(year, mon, 1))

        const coupleId = profile.coupleId as string
        const q = query(
          collection(db, 'couples', coupleId, 'transactions'),
          where('date', '>=', start),
          where('date', '<', end),
        )

        const snapshot = await getDocs(q)
        let income = 0
        let expense = 0
        snapshot.docs.forEach((doc) => {
          const d = doc.data()
          if (d.type === 'income') income += d.amount
          else expense += d.amount
        })

        const savings = income - expense
        const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0
        const label = `${mon}월`

        results.push({ month, label, income, expense, savings, savingsRate })
      }

      setData(results)
      setLoading(false)
    }

    fetchData()
  }, [profile?.coupleId, endMonth, count])

  return { data, loading }
}
