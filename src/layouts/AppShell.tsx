import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { useUIStore } from '@/store/ui.store'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { pageVariants } from '@/lib/motion'

const DENSITY_PADDING: Record<string, string> = {
  compact: 'p-4',
  normal: 'p-6',
  comfortable: 'p-8',
}

export function AppShell() {
  const { theme, language, density } = useUIStore()
  const location = useLocation()

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(isDark ? 'dark' : 'light')
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={DENSITY_PADDING[density] ?? 'p-6'}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {/* Global overlays */}
      <CommandPalette />
    </div>
  )
}
