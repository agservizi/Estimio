import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, Search, BarChart3, Building2, Users, Calendar,
  FileText, Heart, Settings, ChevronLeft, ChevronRight, X, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { initials } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { sidebarVariants, sidebarTransition, staggerContainer, staggerItem, fadeIn } from '@/lib/motion'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Nuova Valutazione', href: '/valutazione/nuova', icon: PlusCircle },
  { label: 'Comparabili', href: '/comparabili', icon: Search },
  { label: 'Report di Zona', href: '/zone', icon: TrendingUp },
  { label: 'Archivio', href: '/archivio', icon: Building2 },
  { label: 'Clienti', href: '/clienti', icon: Users },
  { label: 'Visite', href: '/visite', icon: Calendar },
  { label: 'Report', href: '/report', icon: FileText },
  { label: 'Preferiti', href: '/preferiti', icon: Heart },
]

const BOTTOM_ITEMS: NavItem[] = [
  { label: 'Impostazioni', href: '/impostazioni', icon: Settings },
]

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation()
  const isActive = item.href === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(item.href)

  const content = (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 group relative',
        isActive
          ? 'bg-brand-600 text-white shadow-sm'
          : 'text-slate-400 hover:bg-white/8 hover:text-white'
      )}
    >
      <item.icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
        )}
      />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            key="label"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {!collapsed && item.badge !== undefined && item.badge > 0 && (
          <motion.span
            key="badge"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white"
          >
            {item.badge}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return content
}

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const { profile } = useAuthStore()

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-white/10', collapsed && 'justify-center px-2')}>
        <img src="/logo.png" alt="SubitoStima" className="h-8 w-8 shrink-0 rounded-full object-contain" />
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-white tracking-tight">SubitoStima</p>
            <p className="text-[10px] text-slate-400 font-medium">Valutazione Istantanea</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4 sidebar-scroll">
        <motion.nav
          className="flex flex-col gap-1"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {NAV_ITEMS.map((item) => (
            <motion.div key={item.href} variants={staggerItem}>
              <NavLink item={item} collapsed={collapsed} />
            </motion.div>
          ))}
        </motion.nav>

        <Separator className="my-4 bg-white/10" />

        <nav className="flex flex-col gap-1">
          {BOTTOM_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </nav>
      </ScrollArea>

      {/* User profile */}
      {profile && (
        <div className={cn(
          'border-t border-white/10 p-3',
          collapsed ? 'flex justify-center' : ''
        )}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger>
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold', profile.avatar_color ?? 'bg-brand-600')}>
                  {initials(profile.full_name)}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{profile.full_name}</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/8 transition-colors cursor-pointer">
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold', profile.avatar_color ?? 'bg-brand-600')}>
                {initials(profile.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{profile.full_name}</p>
                <p className="text-[10px] text-slate-400 truncate">{profile.agency_name ?? profile.email}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore()

  return (
    <TooltipProvider delayDuration={0}>
      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden lg:flex flex-col shrink-0 h-screen sticky top-0 bg-[hsl(224,71.4%,4.1%)] z-30 overflow-hidden"
        variants={sidebarVariants}
        animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
        transition={sidebarTransition}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
      </motion.aside>

      {/* Mobile Drawer */}
      {sidebarMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[220px] bg-[hsl(224,71.4%,4.1%)] lg:hidden flex flex-col shadow-2xl">
            <SidebarContent collapsed={false} />
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-4 text-slate-400 hover:text-white"
              onClick={() => setSidebarMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </aside>
        </>
      )}
    </TooltipProvider>
  )
}
