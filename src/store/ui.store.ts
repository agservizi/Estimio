import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Notification, ViewMode } from '@/types'

export type AppLanguage = 'it' | 'en'
export type AppDensity = 'compact' | 'normal' | 'comfortable'

interface UIState {
  sidebarCollapsed: boolean
  sidebarMobileOpen: boolean
  commandPaletteOpen: boolean
  theme: 'light' | 'dark' | 'system'
  language: AppLanguage
  density: AppDensity
  comparablesViewMode: ViewMode
  notifications: Notification[]
  unreadCount: number

  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarMobileOpen: (open: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLanguage: (language: AppLanguage) => void
  setDensity: (density: AppDensity) => void
  setComparablesViewMode: (mode: ViewMode) => void
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'created_at'>) => void
  markAllRead: () => void
  clearNotifications: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      commandPaletteOpen: false,
      theme: 'light',
      language: 'it',
      density: 'normal',
      comparablesViewMode: 'card',
      notifications: [
        {
          id: 'n-001',
          type: 'success',
          title: 'Report generato',
          message: 'Il report di valutazione per Via Cola di Rienzo è pronto.',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: 'n-002',
          type: 'info',
          title: 'Visita imminente',
          message: 'Visita programmata per domani alle 10:30 con Giulia Rossi.',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        },
        {
          id: 'n-003',
          type: 'info',
          title: 'Nuovi comparabili',
          message: '3 nuovi comparabili disponibili per la zona Prati.',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        },
      ],
      unreadCount: 2,

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setDensity: (density) => set({ density }),
      setComparablesViewMode: (mode) => set({ comparablesViewMode: mode }),

      addNotification: (n) =>
        set((state) => ({
          notifications: [
            {
              ...n,
              id: `n-${Date.now()}`,
              read: false,
              created_at: new Date().toISOString(),
            },
            ...state.notifications,
          ],
          unreadCount: state.unreadCount + 1,
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),

      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: 'subitostima-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        language: state.language,
        density: state.density,
        comparablesViewMode: state.comparablesViewMode,
      }),
    }
  )
)
