import { useNavigate } from 'react-router-dom'
import {
  MapPin, Navigation, NavigationOff, Loader2,
  TrendingUp, TrendingDown, Building2, X, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useGeolocation, haversineKm } from '@/hooks/useGeolocation'
import { useZoneInsightsByCity } from '@/hooks/useZoneInsights'
import { useValuations } from '@/hooks/useValuations'
import { formatCurrency, formatPercent, formatRelativeDate, cn } from '@/lib/utils'
import type { ZoneInsight } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface GeoZonePanelProps {
  /** Mostra solo il banner compatto senza le valutazioni vicine */
  compact?: boolean
  /** Raggio in km per filtrare le valutazioni vicine */
  radiusKm?: number
  className?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ZoneStatChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn(
      'text-center px-3 py-1.5 rounded-lg',
      highlight ? 'bg-brand-100 dark:bg-brand-900/30' : 'bg-muted/60'
    )}>
      <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{label}</p>
      <p className={cn('text-sm font-bold', highlight ? 'text-brand-700 dark:text-brand-300' : 'text-foreground')}>
        {value}
      </p>
    </div>
  )
}

// ─── Sub-component: zona OMI card ─────────────────────────────────────────────

function ZoneCard({ zone }: { zone: ZoneInsight }) {
  const navigate = useNavigate()
  const isPositive = zone.trend_delta >= 0
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={cn(
            'h-2 w-2 rounded-full shrink-0',
            isPositive ? 'bg-emerald-500' : 'bg-red-400'
          )}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{zone.zone}</p>
          <p className="text-[10px] text-muted-foreground">{zone.period_label}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-sm font-bold text-foreground">
            {zone.avg_price_sqm.toLocaleString('it-IT')} €/m²
          </p>
          <p className="text-[10px] text-muted-foreground">
            {zone.min_price_sqm.toLocaleString('it-IT')} – {zone.max_price_sqm.toLocaleString('it-IT')}
          </p>
        </div>
        <Badge
          variant={isPositive ? 'emerald' : 'destructive'}
          className="text-[10px] gap-0.5"
        >
          {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
          {formatPercent(zone.trend_delta)}
        </Badge>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GeoZonePanel({ compact = false, radiusKm = 2, className }: GeoZonePanelProps) {
  const navigate = useNavigate()
  const { status, location, position, isResolving, error, request, clear } = useGeolocation()

  // Zone OMI per la città rilevata
  const { data: zoneInsights = [], isLoading: zonesLoading } = useZoneInsightsByCity(
    location?.city ?? ''
  )

  // Valutazioni con proprietà con coordinate
  const { data: valuationsWithData = [] } = useValuations()

  // Filtra valutazioni vicine: solo quelle con lat/lon entro radiusKm
  const nearbyValuations = position
    ? valuationsWithData
        .filter((v) => {
          const lat = v.property?.latitude
          const lon = v.property?.longitude
          if (!lat || !lon) return false
          return haversineKm(position.latitude, position.longitude, lat, lon) <= radiusKm
        })
        .sort((a, b) => {
          const distA = haversineKm(
            position.latitude, position.longitude,
            a.property!.latitude!, a.property!.longitude!
          )
          const distB = haversineKm(
            position.latitude, position.longitude,
            b.property!.latitude!, b.property!.longitude!
          )
          return distA - distB
        })
        .slice(0, 5)
    : []

  // ── Stato: idle ───────────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="flex items-center justify-between gap-4 py-4 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/40 shrink-0">
              <Navigation className="h-4 w-4 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Geolocalizzazione</p>
              <p className="text-xs text-muted-foreground">
                Attiva per vedere valutazioni e prezzi OMI nella tua zona
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={request}>
            <Navigation className="h-3.5 w-3.5" />
            Attiva
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ── Stato: requesting ─────────────────────────────────────────────────────
  if (status === 'requesting' || isResolving) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center gap-3 py-4 px-5">
          <Loader2 className="h-4 w-4 animate-spin text-brand-600 shrink-0" />
          <p className="text-sm text-muted-foreground">
            {status === 'requesting' ? 'Rilevamento posizione…' : 'Identificazione zona…'}
          </p>
        </CardContent>
      </Card>
    )
  }

  // ── Stato: negato / errore ────────────────────────────────────────────────
  if (status === 'denied' || status === 'unavailable' || status === 'error') {
    return (
      <Card className={cn('border-amber-200 bg-amber-50/40 dark:bg-amber-900/10', className)}>
        <CardContent className="flex items-center gap-3 py-4 px-5">
          <NavigationOff className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // ── Stato: granted ────────────────────────────────────────────────────────
  if (!location) return null

  if (compact) {
    // Versione compatta: solo badge con città/zona
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge variant="emerald" className="gap-1.5 pl-2">
          <MapPin className="h-3 w-3" />
          {location.city}
          {location.zone ? ` · ${location.zone}` : ''}
        </Badge>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={clear}
          aria-label="Disattiva geolocalizzazione"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  // Versione completa
  return (
    <Card className={cn('shadow-card', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="relative">
              <MapPin className="h-4 w-4 text-brand-600" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-background animate-pulse" />
            </div>
            Zona rilevata: <span className="text-brand-600">{location.city}</span>
            {location.zone && (
              <span className="text-muted-foreground font-normal">· {location.zone}</span>
            )}
          </CardTitle>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
            onClick={clear}
            aria-label="Disattiva geolocalizzazione"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Zone OMI nella città ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Prezzi OMI · {location.city}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-brand-600 hover:text-brand-700"
              onClick={() => navigate('/zone')}
            >
              Vedi tutto
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>

          {zonesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : zoneInsights.length > 0 ? (
            <div className="divide-y divide-border">
              {zoneInsights.slice(0, 4).map((zone) => (
                <ZoneCard key={zone.id} zone={zone} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2">
              Nessun dato OMI disponibile per {location.city}.
            </p>
          )}
        </div>

        {/* ── Valutazioni vicine ─────────────────────────────────────────── */}
        {nearbyValuations.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Valutazioni entro {radiusKm} km
                </p>
                <Badge variant="slate" className="text-[10px]">{nearbyValuations.length}</Badge>
              </div>

              <div className="space-y-2">
                {nearbyValuations.map((v) => {
                  const dist = position && v.property?.latitude && v.property?.longitude
                    ? haversineKm(
                        position.latitude, position.longitude,
                        v.property.latitude, v.property.longitude
                      )
                    : null
                  return (
                    <div
                      key={v.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/valutazione/${v.id}`)}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                          <p className="text-xs font-semibold truncate">
                            {v.property?.address ?? 'Indirizzo non disponibile'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{v.property?.zone ?? v.property?.city}</span>
                          {dist !== null && (
                            <span>· {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {v.estimated_avg ? (
                          <p className="text-xs font-bold text-brand-600">
                            {formatCurrency(v.estimated_avg, true)}
                          </p>
                        ) : (
                          <Badge variant="slate" className="text-[9px]">Bozza</Badge>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {formatRelativeDate(v.updated_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 h-8 text-xs"
                onClick={() => navigate('/archivio')}
              >
                Tutte le valutazioni
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </>
        )}

        {/* ── Statistiche riepilogative ─────────────────────────────────── */}
        {zoneInsights.length > 0 && (
          <>
            <Separator />
            <div className="grid grid-cols-3 gap-2">
              <ZoneStatChip
                label="Prezzo medio"
                value={`${Math.round(
                  zoneInsights.reduce((a, z) => a + z.avg_price_sqm, 0) / zoneInsights.length
                ).toLocaleString('it-IT')} €/m²`}
                highlight
              />
              <ZoneStatChip
                label="Annunci attivi"
                value={zoneInsights.reduce((a, z) => a + z.listings_count, 0).toString()}
              />
              <ZoneStatChip
                label="Zone analizzate"
                value={zoneInsights.length.toString()}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
