import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Building2, FilePlus2, FileDown, Archive, Trash2,
  Copy, ChevronDown, Filter, AlertTriangle, Navigation, MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfidenceScoreBadge } from '@/components/shared/ConfidenceScoreBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { GeoZonePanel } from '@/components/shared/GeoZonePanel'
import { formatCurrency, formatRelativeDate } from '@/lib/utils'
import { useValuations, useUpdateValuation, useDeleteValuation, useCreateValuation } from '@/hooks/useValuations'
import { useGeolocation, haversineKm } from '@/hooks/useGeolocation'
import { exportValuationPDF } from '@/lib/pdf-export'
import { useAuthStore } from '@/store/auth.store'
import type { ValuationStatus } from '@/types'

export function ArchivioPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ValuationStatus | 'all'>('all')
  const [geoFilterActive, setGeoFilterActive] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { data: valuationsWithData = [] } = useValuations()
  const updateValuation = useUpdateValuation()
  const deleteValuation = useDeleteValuation()
  const createValuation = useCreateValuation()
  const geo = useGeolocation()

  const filtered = useMemo(() => {
    let result = [...valuationsWithData]
    if (statusFilter !== 'all') result = result.filter((v) => v.status === statusFilter)
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(
        (v) =>
          v.property?.address?.toLowerCase().includes(q) ||
          v.property?.city?.toLowerCase().includes(q) ||
          v.client?.first_name?.toLowerCase().includes(q) ||
          v.client?.last_name?.toLowerCase().includes(q)
      )
    }
    // Filtro geo: mostra solo valutazioni nella città rilevata
    if (geoFilterActive && geo.location?.city) {
      const city = geo.location.city.toLowerCase()
      result = result.filter(
        (v) => v.property?.city?.toLowerCase() === city
      )
    }
    return result
  }, [valuationsWithData, query, statusFilter, geoFilterActive, geo.location?.city])

  const stats = {
    total: valuationsWithData.length,
    completed: valuationsWithData.filter((v) => v.status === 'completed').length,
    in_progress: valuationsWithData.filter((v) => v.status === 'in_progress').length,
    draft: valuationsWithData.filter((v) => v.status === 'draft').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Archivio Valutazioni"
        description="Gestisci e consulta tutte le valutazioni create"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Archivio' }]}
        actions={
          <Button onClick={() => navigate('/valutazione/nuova')}>
            <FilePlus2 className="h-4 w-4" />
            Nuova Valutazione
          </Button>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Totale', value: stats.total, color: 'bg-slate-50 border-slate-200 text-slate-700' },
          { label: 'Completate', value: stats.completed, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'In corso', value: stats.in_progress, color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Bozze', value: stats.draft, color: 'bg-amber-50 border-amber-200 text-amber-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-3 ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs font-medium opacity-70">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            startIcon={<Search className="h-4 w-4" />}
            placeholder="Cerca per indirizzo, cliente, zona..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ValuationStatus | 'all')}>
          <SelectTrigger className="w-40">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="draft">Bozza</SelectItem>
            <SelectItem value="in_progress">In corso</SelectItem>
            <SelectItem value="completed">Completata</SelectItem>
            <SelectItem value="archived">Archiviata</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro per zona geografica */}
        {geo.status === 'idle' && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={geo.request}
          >
            <Navigation className="h-3.5 w-3.5" />
            Zona attuale
          </Button>
        )}
        {geo.status === 'requesting' && (
          <Badge variant="slate" className="gap-1.5">
            <Navigation className="h-3 w-3 animate-pulse" />
            Rilevamento…
          </Badge>
        )}
        {geo.status === 'granted' && geo.location && (
          <button
            className={`inline-flex items-center gap-1.5 rounded-full text-xs font-medium px-2.5 py-1 border transition-colors ${
              geoFilterActive
                ? 'bg-brand-100 border-brand-300 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                : 'bg-muted border-border text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setGeoFilterActive((v) => !v)}
          >
            <MapPin className="h-3 w-3" />
            {geo.location.city}
            {geoFilterActive && <span className="ml-0.5">· attivo</span>}
          </button>
        )}

        <Badge variant="slate">{filtered.length} valutazioni</Badge>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nessuna valutazione trovata"
          description="Prova a modificare i filtri o crea una nuova valutazione."
          action={{ label: 'Nuova Valutazione', onClick: () => navigate('/valutazione/nuova') }}
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:flex items-center gap-4 px-4 py-3 border-b border-border bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span className="flex-1">Immobile</span>
            <span className="w-32 hidden md:block">Cliente</span>
            <span className="w-32 hidden lg:block">Valore stimato</span>
            <span className="w-28 text-center">Stato</span>
            <span className="w-28 hidden xl:block">Affidabilità</span>
            <span className="w-24 text-right">Aggiornato</span>
            <span className="w-10" />
          </div>

          {/* Rows */}
          <AnimatePresence initial={false}>
            {filtered.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                {i > 0 && <Separator />}
                <div className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors group">
                  {/* Property */}
                  <div
                    className="flex-1 flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/valutazione/${v.id}`)}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {v.property?.address ?? `Valutazione #${v.id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {v.property?.city} · {v.property?.zone ?? v.property?.type}
                      </p>
                    </div>
                  </div>

                  {/* Client */}
                  <div className="w-32 hidden md:block">
                    {v.client ? (
                      <p className="text-sm font-medium truncate">
                        {v.client.first_name} {v.client.last_name}
                      </p>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Estimated value */}
                  <div className="w-32 hidden lg:block">
                    {v.estimated_avg ? (
                      <p className="text-sm font-bold text-foreground">{formatCurrency(v.estimated_avg, true)}</p>
                    ) : (
                      <span className="text-xs text-muted-foreground">In elaborazione</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="w-28 flex justify-center">
                    <StatusBadge status={v.status} />
                  </div>

                  {/* Confidence */}
                  <div className="w-28 hidden xl:flex justify-center">
                    {v.confidence_score ? (
                      <ConfidenceScoreBadge score={v.confidence_score} showLabel={false} size="sm" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Updated */}
                  <div className="w-24 text-right">
                    <p className="text-xs text-muted-foreground">{formatRelativeDate(v.updated_at)}</p>
                  </div>

                  {/* Actions */}
                  <div className="w-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/valutazione/${v.id}`)}>
                          <Building2 className="h-4 w-4" />
                          Apri valutazione
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const { id: _id, created_at: _ca, updated_at: _ua, property: _p, client: _c, ...rest } = v
                            createValuation.mutate({ ...rest, user_id: profile!.id })
                          }}
                        >
                          <Copy className="h-4 w-4" />
                          Duplica
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (v.property && v.estimated_avg != null) {
                              exportValuationPDF({
                                valuation: v,
                                property: v.property,
                                client: v.client,
                              })
                            }
                          }}
                        >
                          <FileDown className="h-4 w-4" />
                          Esporta PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => updateValuation.mutate({ id: v.id, status: 'archived' })}
                          disabled={v.status === 'archived'}
                        >
                          <Archive className="h-4 w-4" />
                          Archivia
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(v.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Elimina
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </Card>
      )}

      {/* Dialog conferma eliminazione */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Elimina valutazione</DialogTitle>
            </div>
            <DialogDescription>
              Questa azione è irreversibile. La valutazione e tutti i dati associati verranno eliminati definitivamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteId) {
                  deleteValuation.mutate(deleteId)
                  setDeleteId(null)
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
