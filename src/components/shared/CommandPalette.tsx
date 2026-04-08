import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Building2, Users, BarChart3, Heart, FileText, ArrowRight, X } from 'lucide-react'
import { useUIStore } from '@/store/ui.store'
import { DEMO_CLIENTS, DEMO_PROPERTIES, DEMO_VALUATIONS, DEMO_COMPARABLES } from '@/lib/demo-data'
import { cn } from '@/lib/utils'
import type { SearchResult } from '@/types'

const QUICK_LINKS = [
  { label: 'Nuova Valutazione', href: '/valutazione/nuova', icon: BarChart3 },
  { label: 'Comparabili', href: '/comparabili', icon: Search },
  { label: 'Clienti', href: '/clienti', icon: Users },
  { label: 'Report di Zona', href: '/zone', icon: FileText },
]

function buildResults(query: string): SearchResult[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const results: SearchResult[] = []

  DEMO_CLIENTS.filter(
    (c) => `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
  ).slice(0, 3).forEach((c) =>
    results.push({
      type: 'client',
      id: c.id,
      title: `${c.first_name} ${c.last_name}`,
      subtitle: c.email ?? c.phone ?? 'Cliente',
      href: '/clienti',
    })
  )

  DEMO_PROPERTIES.filter(
    (p) => p.address.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.zone?.toLowerCase().includes(q)
  ).slice(0, 3).forEach((p) =>
    results.push({
      type: 'property',
      id: p.id,
      title: p.address,
      subtitle: `${p.city}${p.zone ? ' · ' + p.zone : ''} · ${p.commercial_area} m²`,
      href: `/valutazione/${p.id}`,
    })
  )

  DEMO_VALUATIONS.filter(
    (v) => {
      const prop = DEMO_PROPERTIES.find((p) => p.id === v.property_id)
      return prop?.address.toLowerCase().includes(q) || prop?.city.toLowerCase().includes(q)
    }
  ).slice(0, 2).forEach((v) => {
    const prop = DEMO_PROPERTIES.find((p) => p.id === v.property_id)
    results.push({
      type: 'valuation',
      id: v.id,
      title: `Valutazione · ${prop?.address ?? v.id}`,
      subtitle: v.estimated_avg ? `${(v.estimated_avg / 1000).toFixed(0)}k€ · ${v.status}` : v.status,
      href: `/archivio`,
    })
  })

  DEMO_COMPARABLES.filter(
    (c) => c.address.toLowerCase().includes(q) || c.zone?.toLowerCase().includes(q)
  ).slice(0, 2).forEach((c) =>
    results.push({
      type: 'comparable',
      id: c.id,
      title: c.address,
      subtitle: `${c.city} · ${c.price_per_sqm.toLocaleString('it-IT')} €/m²`,
      href: '/comparabili',
    })
  )

  return results
}

const TYPE_CONFIG: Record<SearchResult['type'], { icon: React.ElementType; label: string; color: string }> = {
  client: { icon: Users, label: 'Cliente', color: 'text-blue-500' },
  property: { icon: Building2, label: 'Immobile', color: 'text-brand-500' },
  valuation: { icon: BarChart3, label: 'Valutazione', color: 'text-emerald-500' },
  comparable: { icon: Search, label: 'Comparabile', color: 'text-amber-500' },
  report: { icon: FileText, label: 'Report', color: 'text-slate-500' },
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)

  const results = buildResults(query)
  const items = query ? results : []

  const close = useCallback(() => {
    setCommandPaletteOpen(false)
    setQuery('')
    setActiveIdx(0)
  }, [setCommandPaletteOpen])

  const handleSelect = useCallback((href: string) => {
    navigate(href)
    close()
  }, [navigate, close])

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [commandPaletteOpen, setCommandPaletteOpen, close])

  // Arrow navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!commandPaletteOpen) return
      const total = query ? items.length : QUICK_LINKS.length
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => (i + 1) % total) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => (i - 1 + total) % total) }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (query && items[activeIdx]) handleSelect(items[activeIdx].href)
        else if (!query && QUICK_LINKS[activeIdx]) handleSelect(QUICK_LINKS[activeIdx].href)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [commandPaletteOpen, query, items, activeIdx, handleSelect])

  if (!commandPaletteOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={close}
      />

      {/* Panel */}
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-2xl border border-border bg-popover shadow-2xl overflow-hidden animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0) }}
            placeholder="Cerca clienti, immobili, valutazioni..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {/* Quick links (no query) */}
          {!query && (
            <div>
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Accesso rapido
              </p>
              {QUICK_LINKS.map((link, i) => (
                <button
                  key={link.href}
                  onClick={() => handleSelect(link.href)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    i === activeIdx ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60'
                  )}
                >
                  <link.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{link.label}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {/* Search results */}
          {query && items.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Nessun risultato per "{query}"</p>
            </div>
          )}

          {query && items.length > 0 && (
            <div>
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Risultati ({items.length})
              </p>
              {items.map((item, i) => {
                const cfg = TYPE_CONFIG[item.type]
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.href)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      i === activeIdx ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60'
                    )}
                  >
                    <cfg.icon className={cn('h-4 w-4 shrink-0', cfg.color)} />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                      {cfg.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-2 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>↑↓ naviga</span>
          <span>↵ seleziona</span>
          <span>ESC chiudi</span>
          <kbd className="ml-auto flex items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </div>
      </div>
    </>
  )
}
