import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, LayoutGrid, List, MapPin, SlidersHorizontal,
  Heart, HeartOff, ExternalLink, Star, Filter, X,
  ArrowUpDown, Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatArea, formatPricePerSqm, formatDistance, formatDate, getConditionLabel, cn } from '@/lib/utils'
import type { Comparable, ComparableFilters } from '@/types'
import { useUIStore } from '@/store/ui.store'
import { useComparableSearch, useFavoriteIds, useToggleFavorite } from '@/hooks/useComparables'

type SortKey = 'price' | 'area_sqm' | 'price_per_sqm' | 'similarity_score' | 'distance_km' | 'listing_date'

const SOURCE_BADGE: Record<string, { label: string; variant: 'brand' | 'blue' | 'emerald' | 'amber' | 'slate' }> = {
  'idealista': { label: 'Idealista', variant: 'brand' },
  'immobiliare.it': { label: 'Immobiliare.it', variant: 'blue' },
  'casa.it': { label: 'Casa.it', variant: 'emerald' },
  'wikicasa': { label: 'WikiCasa', variant: 'amber' },
  'omi': { label: 'OMI', variant: 'slate' },
  'agenzia': { label: 'Agenzia', variant: 'slate' },
  'altro': { label: 'Altro', variant: 'slate' },
}

function ComparableCard({
  comp,
  onFavorite,
  isFav,
  onSelect,
  isSelected,
}: {
  comp: Comparable
  onFavorite: (id: string) => void
  isFav: boolean
  onSelect: (id: string) => void
  isSelected: boolean
}) {
  const src = SOURCE_BADGE[comp.source] ?? SOURCE_BADGE.altro

  return (
    <Card
      className={cn(
        'overflow-hidden group cursor-pointer hover:shadow-card-hover transition-all duration-200',
        isSelected && 'ring-2 ring-brand-400'
      )}
    >
      {/* Cover image */}
      <div className="relative h-44 bg-muted overflow-hidden">
        {comp.image_url ? (
          <img
            src={comp.image_url}
            alt={comp.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
            <Building2 className="h-10 w-10" />
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant={src.variant} className="text-[10px]">{src.label}</Badge>
          {isSelected && (
            <Badge variant="brand" className="text-[10px]">Selezionato</Badge>
          )}
        </div>

        {/* Similarity score */}
        {comp.similarity_score && (
          <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-white">{Math.round(comp.similarity_score * 100)}%</span>
          </div>
        )}

        {/* Favorite button */}
        <button
          className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white transition-colors"
          onClick={(e) => { e.stopPropagation(); onFavorite(comp.id) }}
        >
          {isFav ? (
            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
          ) : (
            <Heart className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </div>

      <CardContent className="p-4" onClick={() => onSelect(comp.id)}>
        <div className="mb-3">
          <p className="text-sm font-semibold text-foreground line-clamp-1">{comp.address}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{comp.city}{comp.zone ? ` · ${comp.zone}` : ''}</p>
          </div>
        </div>

        {/* Price row */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(comp.price, true)}</p>
            <p className="text-xs text-muted-foreground">{formatPricePerSqm(comp.price_per_sqm)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">{formatArea(comp.area_sqm)}</p>
            {comp.rooms && <p className="text-xs text-muted-foreground">{comp.rooms} locali</p>}
          </div>
        </div>

        <Separator className="mb-3" />

        {/* Details */}
        <div className="flex flex-wrap gap-2">
          {comp.condition && (
            <Badge variant="slate" className="text-[10px]">{getConditionLabel(comp.condition)}</Badge>
          )}
          {comp.floor !== null && comp.floor !== undefined && (
            <Badge variant="slate" className="text-[10px]">Piano {comp.floor}</Badge>
          )}
          {comp.energy_class && (
            <Badge variant="slate" className="text-[10px]">Cl. {comp.energy_class}</Badge>
          )}
          {comp.distance_km && (
            <Badge variant="blue" className="text-[10px]">{formatDistance(comp.distance_km)}</Badge>
          )}
          {comp.listing_date && (
            <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(comp.listing_date)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ComparableRow({
  comp,
  onFavorite,
  isFav,
  onSelect,
  isSelected,
}: {
  comp: Comparable
  onFavorite: (id: string) => void
  isFav: boolean
  onSelect: (id: string) => void
  isSelected: boolean
}) {
  const src = SOURCE_BADGE[comp.source] ?? SOURCE_BADGE.altro

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border last:border-0',
        isSelected && 'bg-brand-50/60'
      )}
      onClick={() => onSelect(comp.id)}
    >
      {/* Image */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
        {comp.image_url && <img src={comp.image_url} alt="" className="w-full h-full object-cover" />}
      </div>

      {/* Address */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{comp.address}</p>
        <p className="text-xs text-muted-foreground">{comp.city} · {comp.zone}</p>
      </div>

      {/* Badges */}
      <div className="hidden md:flex items-center gap-2">
        <Badge variant={src.variant} className="text-[10px]">{src.label}</Badge>
        {comp.condition && <Badge variant="slate" className="text-[10px]">{getConditionLabel(comp.condition)}</Badge>}
      </div>

      {/* Price */}
      <div className="text-right hidden sm:block">
        <p className="text-sm font-bold">{formatCurrency(comp.price, true)}</p>
        <p className="text-xs text-muted-foreground">{formatPricePerSqm(comp.price_per_sqm)}</p>
      </div>

      {/* Area */}
      <div className="text-right hidden lg:block">
        <p className="text-sm font-semibold">{formatArea(comp.area_sqm)}</p>
        {comp.rooms && <p className="text-xs text-muted-foreground">{comp.rooms} loc.</p>}
      </div>

      {/* Similarity */}
      {comp.similarity_score && (
        <div className="hidden xl:flex h-8 w-8 items-center justify-center rounded-full bg-brand-50">
          <span className="text-[10px] font-bold text-brand-600">{Math.round(comp.similarity_score * 100)}%</span>
        </div>
      )}

      {/* Favorite */}
      <button
        className="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
        onClick={(e) => { e.stopPropagation(); onFavorite(comp.id) }}
      >
        {isFav
          ? <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          : <Heart className="h-4 w-4 text-muted-foreground" />}
      </button>
    </div>
  )
}

export function ComparabiliPage() {
  const { comparablesViewMode, setComparablesViewMode } = useUIStore()
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('similarity_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filterSource, setFilterSource] = useState<string>('all')

  // Costruiamo i filtri per il hook — debounceable in futuro
  const filters: ComparableFilters = useMemo(() => ({
    query: query || undefined,
    source: filterSource !== 'all' ? filterSource as import('@/types').ComparableSource : undefined,
  }), [query, filterSource])

  const { data: rawComparables = [], isLoading } = useComparableSearch(filters)
  const { data: favoriteIds = [] } = useFavoriteIds()
  const toggleFavoriteMutation = useToggleFavorite()

  const toggleFavorite = (id: string) => {
    const isFav = favoriteIds.includes(id)
    toggleFavoriteMutation.mutate({ comparableId: id, isFav })
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const filtered = useMemo(() => {
    const result = [...rawComparables]
    result.sort((a, b) => {
      const av = a[sortKey] ?? 0
      const bv = b[sortKey] ?? 0
      return sortDir === 'asc'
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number)
    })
    return result
  }, [rawComparables, sortKey, sortDir])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comparabili"
        description="Cerca e analizza immobili simili per supportare le tue valutazioni"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Comparabili' }]}
        actions={
          selected.size > 0 ? (
            <Button size="sm">
              <Star className="h-3.5 w-3.5" />
              Usa {selected.size} comparabili
            </Button>
          ) : null
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            startIcon={<Search className="h-4 w-4" />}
            placeholder="Cerca per indirizzo, zona, città..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le fonti</SelectItem>
            <SelectItem value="idealista">Idealista</SelectItem>
            <SelectItem value="immobiliare.it">Immobiliare.it</SelectItem>
            <SelectItem value="casa.it">Casa.it</SelectItem>
            <SelectItem value="omi">OMI</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-40">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="similarity_score">Similarità</SelectItem>
            <SelectItem value="price">Prezzo</SelectItem>
            <SelectItem value="price_per_sqm">€/m²</SelectItem>
            <SelectItem value="area_sqm">Superficie</SelectItem>
            <SelectItem value="distance_km">Distanza</SelectItem>
            <SelectItem value="listing_date">Data</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
        >
          <ArrowUpDown className={cn('h-4 w-4 transition-transform', sortDir === 'asc' && 'rotate-180')} />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-border p-0.5 gap-0.5">
          <Button
            variant={comparablesViewMode === 'card' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setComparablesViewMode('card')}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={comparablesViewMode === 'table' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setComparablesViewMode('table')}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={comparablesViewMode === 'map' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setComparablesViewMode('map')}
          >
            <MapPin className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Badge variant="slate">
          {filtered.length} risultati
        </Badge>
      </div>

      {/* Selected strip */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-brand-50 border border-brand-200 px-4 py-2">
          <p className="text-sm font-medium text-brand-700">{selected.size} comparabili selezionati</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="brand">Usa nella valutazione</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <Skeleton className="h-44 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nessun comparabile trovato"
          description="Prova a modificare i filtri di ricerca o la zona di riferimento."
          action={{ label: 'Rimuovi filtri', onClick: () => { setQuery(''); setFilterSource('all') } }}
        />
      ) : comparablesViewMode === 'card' ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
        >
          <AnimatePresence>
          {filtered.map((comp) => (
            <motion.div
              key={comp.id}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.22 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
            <ComparableCard
              comp={comp}
              onFavorite={toggleFavorite}
              isFav={favoriteIds.includes(comp.id)}
              onSelect={toggleSelect}
              isSelected={selected.has(comp.id)}
            />
            </motion.div>
          ))}
          </AnimatePresence>
        </motion.div>
      ) : comparablesViewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="grid grid-cols-12 gap-4 flex-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="col-span-4">Immobile</span>
              <span className="col-span-2 hidden md:block">Fonte</span>
              <span className="col-span-2 text-right">Prezzo</span>
              <span className="col-span-2 hidden lg:block text-right">Superficie</span>
              <span className="col-span-2 hidden xl:block text-center">Similarità</span>
            </div>
          </div>
          <div>
            {filtered.map((comp) => (
              <ComparableRow
                key={comp.id}
                comp={comp}
                onFavorite={toggleFavorite}
                isFav={favoriteIds.includes(comp.id)}
                onSelect={toggleSelect}
                isSelected={selected.has(comp.id)}
              />
            ))}
          </div>
        </Card>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 h-[500px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">Vista mappa</p>
            <p className="text-xs mt-1">Disponibile con Leaflet configurato in App</p>
          </div>
        </div>
      )}
    </div>
  )
}
