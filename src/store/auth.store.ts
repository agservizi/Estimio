import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '@/types'
import { DEMO_PROFILE } from '@/lib/demo-data'

interface AuthState {
  profile: Profile | null
  isAuthenticated: boolean
  isDemoMode: boolean
  isLoading: boolean

  login: (email: string, password: string) => Promise<void>
  loginDemo: () => void
  logout: () => void
  setProfile: (profile: Profile) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      isAuthenticated: false,
      isDemoMode: false,
      isLoading: false,

      login: async (email: string, _password: string) => {
        set({ isLoading: true })
        // In production: call supabase auth
        await new Promise((resolve) => setTimeout(resolve, 800))
        set({
          profile: { ...DEMO_PROFILE, email },
          isAuthenticated: true,
          isDemoMode: false,
          isLoading: false,
        })
      },

      loginDemo: () => {
        set({
          profile: DEMO_PROFILE,
          isAuthenticated: true,
          isDemoMode: true,
          isLoading: false,
        })
      },

      logout: () => {
        set({ profile: null, isAuthenticated: false, isDemoMode: false })
      },

      setProfile: (profile) => set({ profile }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'estimio-auth',
      partialize: (state) => ({
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        isDemoMode: state.isDemoMode,
      }),
    }
  )
)
