import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Search, Menu, Plus, Command,
  LogOut, Settings, User, ChevronDown, Check, PanelLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { initials, formatRelativeDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  success: 'text-emerald-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
}

export function Topbar() {
  const navigate = useNavigate()
  const { setSidebarMobileOpen, setSidebarCollapsed, sidebarCollapsed, notifications, unreadCount, markAllRead, setCommandPaletteOpen } = useUIStore()
  const { profile, logout } = useAuthStore()
  const [notifOpen, setNotifOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/95 backdrop-blur-sm px-4 shadow-topbar">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={() => setSidebarMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:flex shrink-0"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        <PanelLeft className="h-5 w-5" />
      </Button>

      {/* Global Search */}
      <div className="flex-1 max-w-md">
        <div
          className="flex items-center gap-2 h-8 w-full rounded-lg border border-input bg-muted/50 px-3 cursor-pointer hover:bg-muted transition-colors"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground flex-1">Cerca clienti, immobili, valutazioni...</span>
          <div className="flex items-center gap-0.5">
            <kbd className="flex h-5 items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Quick new valuation */}
        <Button
          size="sm"
          className="hidden sm:flex gap-1.5"
          onClick={() => navigate('/valutazione/nuova')}
        >
          <Plus className="h-3.5 w-3.5" />
          Nuova Valutazione
        </Button>

        {/* Notifications */}
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold">Notifiche</span>
              {unreadCount > 0 && (
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={markAllRead}
                >
                  Segna tutte come lette
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  Nessuna notifica
                </p>
              ) : (
                notifications.slice(0, 6).map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'flex gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer',
                      !n.read && 'bg-brand-50/50'
                    )}
                  >
                    <div className={cn('mt-0.5 shrink-0', NOTIFICATION_TYPE_COLORS[n.type])}>
                      {!n.read ? (
                        <div className="h-2 w-2 rounded-full bg-brand-600 mt-1" />
                      ) : (
                        <Check className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeDate(n.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[11px]">
                  {profile ? initials(profile.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-xs font-medium max-w-[100px] truncate">
                {profile?.full_name}
              </span>
              <ChevronDown className="hidden md:block h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-semibold">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profilo')}>
              <User className="h-4 w-4" />
              Profilo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/impostazioni')}>
              <Settings className="h-4 w-4" />
              Impostazioni
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Esci
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
