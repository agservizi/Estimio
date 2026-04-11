import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  LayoutGrid,
  List,
  MapPin,
  Heart,
  Star,
  X,
  ArrowUpDown,
  Building2,
  LocateFixed,
  Loader2,
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
import { haversineKm, useGeolocation } from '@/hooks/useGeolocation'

type SortKey = 'price' | 'area_sqm' | 'price_per_sqm' | 'similarity_score' | 'distance_km' | 'listing_date'

type SearchLocation = {
  label: string
  city: string | null
  zone: string | null
  latitude: number | null
  longitude: number | null
  source: 'typed' | 'device'
}

type NominatimSearchResult = {
  lat: string
  lon: string
  display_name?: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    suburb?: string
    neighbourhood?: string
    quarter?: string
  }
}

const SOURCE_BADGE: Record<string, { label: string; variant: 'brand' | 'blue' | 'emerald' | 'amber' | 'slate' }> = {
  idealista: { label: 'Idealista', variant: 'brand' },
  'immobiliare.it': { label: 'Immobiliare.it', variant: 'blue' },
  'casa.it': { label: 'Casa.it', variant: 'emerald' },
  wikicasa: { label: 'WikiCasa', variant: 'amber' },
  omi: { label: 'OMI', variant: 'slate' },
  agenzia: { label: 'Agenzia', variant: 'slate' },
  altro: { label: 'Altro', variant: 'slate' },
}

async function geocodeSearchLocation(query: string): Promise<SearchLocation | null> {
  const trimmed = query.trim()
  if (!trimmed) return null

  const url =
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}` +
    '&format=jsonv2&limit=1&addressdetails=1&accept-language=it&countrycodes=it'

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'SubitoStima/1.0 (app immobiliare italiana)',
      Accept: 'application/json',
    },
  })

  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)

  const [result] = await res.json() as NominatimSearchResult[]
  if (!result) return null

  const city =
    result.address?.city ??
    result.address?.town ??
    result.address?.village ??
    result.address?.municipality ??
    null

  const zone =
    result.address?.suburb ??
    result.address?.neighbourhood ??
    result.address?.quarter ??
    null

  return {
    label: result.display_name ?? trimmed,
    city,
    zone,
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    source: 'typed',
  }
}

function getSortValue(comp: Comparable, sortKey: SortKey): number {
  if (sortKey === 'listing_date') {
    return comp.listing_date ? new Date(comp.listing_date).getTime() : 0
  }

  return Number(comp[sortKey] ?? 0)
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

        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant={src.variant} className="text-[10px]">{src.label}</Badge>
          {isSelected && (
            <Badge variant="brand" className="text-[10px]">Selezionato</Badge>
          )}
        </div>

        {comp.similarity_score && (
          <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-white">{Math.round(comp.similarity_score * 100)}%</span>
          </div>
        )}

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
          {comp.distance_km != null && (
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
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
        {comp.image_url && <img src={comp.image_url} alt="" className="w-full h-full object-cover" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{comp.address}</p>
        <p className="text-xs text-muted-foreground">{comp.city}{comp.zone ? ` · ${comp.zone}` : ''}</p>
      </div>

      <div className="hidden md:flex items-center gap-2">
        <Badge variant={src.variant} className="text-[10px]">{src.label}</Badge>
        {comp.condition && <Badge variant="slate" className="text-[10px]">{getConditionLabel(comp.condition)}</Badge>}
      </div>

      <div className="text-right hidden sm:block">
        <p className="text-sm font-bold">{formatCurrency(comp.price, true)}</p>
        <p className="text-xs text-muted-foreground">{formatPricePerSqm(comp.price_per_sqm)}</p>
      </div>

      <div className="text-right hidden lg:block">
        <p className="text-sm font-semibold">{formatArea(comp.area_sqm)}</p>
        {comp.rooms && <p className="text-xs text-muted-foreground">{comp.rooms} loc.</p>}
      </div>

      {comp.similarity_score && (
        <div className="hidden xl:flex h-8 w-8 items-center justify-center rounded-full bg-brand-50">
          <span className="text-[10px] font-bold text-brand-600">{Math.round(comp.similarity_score * 100)}%</span>
        </div>
      )}

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
  const [committedQuery, setCommittedQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('similarity_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filterSource, setFilterSource] = useState<string>('all')
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(null)
  const [isSubmittingSearch, setIsSubmittingSearch] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [pendingDeviceLocation, setPendingDeviceLocation] = useState(false)

  const isWikicasa = filterSource === 'wikicasa'
  const geo = useGeolocation()

  const submitSearch = useCallback(async () => {
    const trimmed = query.trim()

    if (!trimmed) {
      setCommittedQuery('')
      setSearchLocation(null)
      setSearchError(null)
      return
    }

    setIsSubmittingSearch(true)
    setSearchError(null)

    try {
      const resolvedLocation = await geocodeSearchLocation(trimmed)
      setCommittedQuery(trimmed)
      setSearchLocation(resolvedLocation)

      if (resolvedLocation?.latitude != null && resolvedLocation?.longitude != null) {
        setSortKey('distance_km')
        setSortDir('asc')
      }
    } catch (err) {
      console.warn('[comparabili] geocoding fallito:', err)
      setCommittedQuery(trimmed)
      setSearchLocation(null)
      setSearchError('Indirizzo non riconosciuto con precisione. Ho usato comunque il testo inserito.')
    } finally {
      setIsSubmittingSearch(false)
    }
  }, [query])

  const applyCurrentLocation = useCallback(() => {
    setSearchError(null)

    if (geo.status === 'granted' && geo.position && geo.location) {
      setPendingDeviceLocation(false)
      setCommittedQuery('')
      setQuery(geo.location.displayName)
      setSearchLocation({
        label: geo.location.displayName,
        city: geo.location.city,
        zone: geo.location.zone,
        latitude: geo.position.latitude,
        longitude: geo.position.longitude,
        source: 'device',
      })
      setSortKey('distance_km')
      setSortDir('asc')
      return
    }

    setPendingDeviceLocation(true)
    geo.request()
  }, [geo])

  useEffect(() => {
    if (!pendingDeviceLocation) return

    if (geo.status === 'granted' && geo.position && geo.location) {
      applyCurrentLocation()
      return
    }

    if (geo.status === 'denied' || geo.status === 'error' || geo.status === 'unavailable') {
      setPendingDeviceLocation(false)
    }
  }, [applyCurrentLocation, geo.location, geo.position, geo.status, pendingDeviceLocation])

  const filters: ComparableFilters = useMemo(() => {
    const resolvedCity = searchLocation?.city ?? undefined
    const resolvedZone = searchLocation?.zone ?? undefined

    if (isWikicasa) {
      return {
        city: resolvedCity ?? (committedQuery || 'roma'),
        zone: resolvedZone,
        query: committedQuery || undefined,
        source: 'wikicasa',
      }
    }

    return {
      query: committedQuery || undefined,
      city: resolvedCity,
      zone: resolvedZone,
      source: filterSource !== 'all' ? filterSource as import('@/types').ComparableSource : undefined,
    }
  }, [committedQuery, filterSource, isWikicasa, searchLocation])

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
    const targetLat = searchLocation?.latitude
    const targetLon = searchLocation?.longitude

    const result = rawComparables.map((comp) => {
      if (
        targetLat == null ||
        targetLon == null ||
        comp.latitude == null ||
        comp.longitude == null
      ) {
        return comp
      }

      return {
        ...comp,
        distance_km: haversineKm(targetLat, targetLon, comp.latitude, comp.longitude),
      }
    })

    result.sort((a, b) => {
      const av = getSortValue(a, sortKey)
      const bv = getSortValue(b, sortKey)
      return sortDir === 'asc' ? av - bv : bv - av
    })

    return result
  }, [rawComparables, searchLocation, sortDir, sortKey])

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

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] flex gap-2">
          <Input
            startIcon={<Search className="h-4 w-4" />}
            placeholder={isWikicasa ? 'Inserisci indirizzo o citta (es. Via Roma 12, Castellammare)...' : 'Cerca per indirizzo, zona o localizzazione...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void submitSearch()}
            className="flex-1"
          />
          <Button onClick={() => void submitSearch()} size="sm" disabled={!query.trim() || isSubmittingSearch}>
            {isSubmittingSearch ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1.5" />
            )}
            Cerca
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={applyCurrentLocation}
            disabled={geo.status === 'requesting' || pendingDeviceLocation}
          >
            {geo.status === 'requesting' || pendingDeviceLocation ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <LocateFixed className="h-3.5 w-3.5 mr-1.5" />
            )}
            La mia posizione
          </Button>
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
            <SelectItem value="wikicasa">Wikicasa</SelectItem>
            <SelectItem value="omi">OMI</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
          <SelectTrigger className="w-40">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="similarity_score">Similarita</SelectItem>
            <SelectItem value="price">Prezzo</SelectItem>
            <SelectItem value="price_per_sqm">Euro/mq</SelectItem>
            <SelectItem value="area_sqm">Superficie</SelectItem>
            <SelectItem value="distance_km">Distanza</SelectItem>
            <SelectItem value="listing_date">Data</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))}
        >
          <ArrowUpDown className={cn('h-4 w-4 transition-transform', sortDir === 'asc' && 'rotate-180')} />
        </Button>

        <Separator orientation="vertical" className="h-6" />

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

      {(searchLocation || committedQuery || searchError || (pendingDeviceLocation && geo.error)) && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
          {searchLocation && (
            <Badge variant="blue" className="gap-1.5">
              <MapPin className="h-3 w-3" />
              {searchLocation.source === 'device' ? 'Vicino a te' : 'Localizzazione attiva'}
            </Badge>
          )}
          {searchLocation && (
            <p className="text-sm text-muted-foreground">
              {searchLocation.label}
              {searchLocation.zone ? ` · ${searchLocation.zone}` : ''}
            </p>
          )}
          {!searchLocation && committedQuery && (
            <p className="text-sm text-muted-foreground">
              Ricerca testuale: <span className="font-medium text-foreground">{committedQuery}</span>
            </p>
          )}
          {searchError && <p className="text-sm text-amber-600">{searchError}</p>}
          {!searchError && pendingDeviceLocation && geo.error && (
            <p className="text-sm text-amber-600">{geo.error}</p>
          )}
          {(searchLocation || committedQuery) && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => {
                setQuery('')
                setCommittedQuery('')
                setSearchLocation(null)
                setSearchError(null)
                setPendingDeviceLocation(false)
              }}
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Reset ricerca
            </Button>
          )}
        </div>
      )}

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

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border bg-card p-4 space-y-3">
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
          action={{
            label: 'Rimuovi filtri',
            onClick: () => {
              setQuery('')
              setCommittedQuery('')
              setSearchLocation(null)
              setSearchError(null)
              setPendingDeviceLocation(false)
              setFilterSource('all')
            },
          }}
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
              <span className="col-span-2 hidden xl:block text-center">Similarita</span>
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
