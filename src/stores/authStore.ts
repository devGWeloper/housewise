import { create } from 'zustand'
import type { User } from 'firebase/auth'
import type { UserProfile, Couple } from '@/types'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  couple: Couple | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setCouple: (couple: Couple | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  couple: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setCouple: (couple) => set({ couple }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ user: null, profile: null, couple: null, loading: false }),
}))
