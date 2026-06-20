import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { IncomeItem, MonthlyRecord, MonthlyRecordEntry } from '@/types'
import { sumIncomeItems } from '@/lib/income'

export interface MonthlyRecordInput {
  incomeItems: IncomeItem[] // 명의별·항목별 수입 (income 합계는 여기서 파생)
  expense: number
  entries: MonthlyRecordEntry[]
}

/**
 * 월별 입력 기록을 관리한다.
 * 컬렉션: couples/{coupleId}/monthlyRecords/{YYYY-MM} (월별 1문서)
 * 그 달의 수입/지출 + 각 자산/부채/주식 잔액을 함께 저장한다.
 */
export function useMonthlyRecords() {
  const { profile } = useAuthStore()
  const [records, setRecords] = useState<MonthlyRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.coupleId) return

    const q = query(
      collection(db, 'couples', profile.coupleId, 'monthlyRecords'),
      orderBy('month', 'asc'),
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MonthlyRecord))
      setRecords(data)
      setLoading(false)
    })

    return () => unsub()
  }, [profile?.coupleId])

  const getRecord = useCallback(
    (month: string) => records.find((r) => r.month === month),
    [records],
  )

  // 해당 월 이전 가장 최근 기록
  const getLatestBefore = useCallback(
    (month: string) =>
      [...records]
        .filter((r) => r.month < month)
        .sort((a, b) => (a.month < b.month ? 1 : -1))[0],
    [records],
  )

  const latestRecord = records.length > 0 ? records[records.length - 1] : undefined

  /**
   * 한 달치 기록을 저장(upsert)한다.
   * - syncAssetBalances=true 이면 각 자산의 현재 balance도 입력값으로 갱신한다.
   *   (이번 달을 업데이트할 때 사용 → 자산/대시보드의 "현재값"이 최신과 일치)
   */
  const saveRecord = useCallback(
    async (month: string, input: MonthlyRecordInput, syncAssetBalances: boolean) => {
      if (!profile?.coupleId) return
      const { incomeItems, expense, entries } = input
      const income = sumIncomeItems(incomeItems)

      const totalAssets = entries
        .filter((e) => e.assetType !== 'debt')
        .reduce((sum, e) => sum + e.balance, 0)
      const totalDebt = entries
        .filter((e) => e.assetType === 'debt')
        .reduce((sum, e) => sum + e.balance, 0)

      const recordRef = doc(db, 'couples', profile.coupleId, 'monthlyRecords', month)
      await setDoc(recordRef, {
        month,
        coupleId: profile.coupleId,
        income,
        incomeItems,
        expense,
        entries,
        totalAssets,
        totalDebt,
        netWorth: totalAssets - totalDebt,
        updatedBy: profile.uid,
        updatedByName: profile.displayName ?? '',
        updatedAt: serverTimestamp(),
      })

      if (syncAssetBalances) {
        const batch = writeBatch(db)
        entries.forEach((e) => {
          const assetRef = doc(db, 'couples', profile.coupleId!, 'assets', e.assetId)
          batch.update(assetRef, { balance: e.balance })
        })
        await batch.commit()
      }
    },
    [profile],
  )

  return {
    records,
    loading,
    getRecord,
    getLatestBefore,
    latestRecord,
    saveRecord,
  }
}
