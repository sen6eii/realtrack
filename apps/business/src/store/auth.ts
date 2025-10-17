import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Business } from '@/types'

interface AuthState {
  user: any | null
  business: Business | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: any) => void
  setBusiness: (business: Business) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      business: null,
      isLoading: true,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setBusiness: (business) => set({ business }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, business: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        business: state.business,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)