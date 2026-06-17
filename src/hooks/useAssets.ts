import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { ASSET_OWNERS, type Asset, type AssetType, type AssetOwner } from '@/types'

export interface OwnerTotal {
  owner: AssetOwner
  assets: number
  debt: number
  net: number
}

export function useAssets() {
  const { profile } = useAuthStore()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.coupleId) return

    const q = query(collection(db, 'couples', profile.coupleId, 'assets'))

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Asset))
      setAssets(data)
      setLoading(false)
    })

    return () => unsub()
  }, [profile?.coupleId])

  const addAsset = useCallback(
    async (data: Omit<Asset, 'id' | 'coupleId'>) => {
      if (!profile?.coupleId) return
      await addDoc(collection(db, 'couples', profile.coupleId, 'assets'), {
        ...data,
        coupleId: profile.coupleId,
      })
    },
    [profile],
  )

  const updateAsset = useCallback(
    async (id: string, data: Partial<Omit<Asset, 'id'>>) => {
      if (!profile?.coupleId) return
      await updateDoc(doc(db, 'couples', profile.coupleId, 'assets', id), data)
    },
    [profile],
  )

  const deleteAsset = useCallback(
    async (id: string) => {
      if (!profile?.coupleId) return
      await deleteDoc(doc(db, 'couples', profile.coupleId, 'assets', id))
    },
    [profile],
  )

  const getAssetsByType = useCallback(
    (type: AssetType) => assets.filter((a) => a.assetType === type),
    [assets],
  )

  const totalAssets = assets
    .filter((a) => a.assetType !== 'debt')
    .reduce((sum, a) => sum + a.balance, 0)

  const totalDebt = assets
    .filter((a) => a.assetType === 'debt')
    .reduce((sum, a) => sum + a.balance, 0)

  const netWorth = totalAssets - totalDebt

  // 명의별(남편/아내/공동) 합계
  const ownerTotals: OwnerTotal[] = ASSET_OWNERS.map((owner) => {
    const owned = assets.filter((a) => (a.owner ?? 'joint') === owner)
    const assetSum = owned
      .filter((a) => a.assetType !== 'debt')
      .reduce((sum, a) => sum + a.balance, 0)
    const debtSum = owned
      .filter((a) => a.assetType === 'debt')
      .reduce((sum, a) => sum + a.balance, 0)
    return { owner, assets: assetSum, debt: debtSum, net: assetSum - debtSum }
  })

  return {
    assets,
    loading,
    addAsset,
    updateAsset,
    deleteAsset,
    getAssetsByType,
    totalAssets,
    totalDebt,
    netWorth,
    ownerTotals,
  }
}
