import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  MapPin, Home, Ruler, Layers, ChevronRight, ChevronLeft,
  Check, Search, Star, StarOff, Info, Zap, Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfidenceScoreBadge } from '@/components/shared/ConfidenceScoreBadge'
import { formatCurrency, formatArea, formatPricePerSqm, formatDistance } from '@/lib/utils'
import { useValuationStore } from '@/store/valuation.store'
import { useCreateValuation } from '@/hooks/useValuations'
import { useComparableSearch } from '@/hooks/useComparables'
import { useZoneInsightsByCity } from '@/hooks/useZoneInsights'
import { propertiesService } from '@/services/properties.service'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 0, label: 'Immobile', icon: Home },
  { id: 1, label: 'Localizzazione', icon: MapPin },
  { id: 2, label: 'Caratteristiche', icon: Layers },
  { id: 3, label: 'Comparabili', icon: Search },
  { id: 4, label: 'Risultato', icon: Zap },
]

const propertySchema = z.object({
  type: z.string(),
  contract_type: z.string(),
  address: z.string().min(3),
  city: z.string().min(2),
  postal_code: z.string().optional(),
  province: z.string().optional(),
  zone: z.string().optional(),
  commercial_area: z.coerce.number().min(10),
  usable_area: z.coerce.number().optional(),
  rooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  floor: z.coerce.number().optional(),
  total_floors: z.coerce.number().optional(),
  build_year: z.coerce.number().optional(),
  condition: z.string(),
  energy_class: z.string().optional(),
  notes: z.string().optional(),
})

type PropertyFormData = z.infer<typeof propertySchema>

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all',
              step.id < currentStep
                ? 'bg-emerald-600 text-white'
                : step.id === currentStep
                ? 'bg-brand-600 text-white ring-2 ring-brand-200'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {step.id < currentStep ? <Check className="h-3.5 w-3.5" /> : step.id + 1}
          </div>
          <span
            className={cn(
              'text-xs font-medium hidden sm:block',
              step.id === currentStep ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={cn('h-px w-6 sm:w-10', step.id < currentStep ? 'bg-emerald-400' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  )
}

function StickyEstimatePanel() {
  const { draft } = useValuationStore()
  const { result, selectedComparableIds, property } = draft

  return (
    <div className="sticky top-4 space-y-4">
      <Card className="border-brand-200 bg-brand-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-600" />
            Stima in tempo reale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Valore medio consigliato</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(result.estimated_avg)}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-emerald-600 font-medium">{formatCurrency(result.estimated_min, true)}</span>
                  <div className="flex-1 h-1.5 bg-gradient-to-r from-emerald-400 via-brand-400 to-amber-400 rounded-full" />
                  <span className="text-amber-600 font-medium">{formatCurrency(result.estimated_max, true)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Prezzo al m²</span>
                  <span className="font-semibold">{formatPricePerSqm(result.price_per_sqm)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Prezzo di pubblicazione</span>
                  <span className="font-semibold text-brand-600">{formatCurrency(result.suggested_listing_price, true)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Comparabili usati</span>
                  <span className="font-semibold">{result.comparables_used}</span>
                </div>
              </div>

              <ConfidenceScoreBadge score={result.confidence_score} size="sm" />

              {result.notes.length > 0 && (
                <div className="rounded-lg bg-muted/60 p-3 space-y-1">
                  {result.notes.map((note, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground flex gap-1">
                      <Info className="h-3 w-3 shrink-0 mt-0.5 text-brand-400" />
                      {note}
                    </p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-4 text-center">
              <div className="text-3xl font-bold text-muted-foreground/30 mb-2">—</div>
              <p className="text-xs text-muted-foreground">
                {selectedComparableIds.length === 0
                  ? 'Seleziona almeno un comparabile'
                  : 'Completa i dati dell\'immobile'}
              </p>
            </div>
          )}

          {property.commercial_area && (
            <div className="text-xs text-muted-foreground pt-1">
              <span className="font-medium">{formatArea(property.commercial_area as number)}</span> superficie commerciale
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <p className="text-xs font-semibold text-foreground mb-2">Comparabili selezionati</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 rounded-full transition-all"
                style={{ width: `${Math.min(100, (selectedComparableIds.length / 8) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-brand-600">{selectedComparableIds.length}/8+</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {selectedComparableIds.length < 3
              ? 'Aggiungi più comparabili per una stima affidabile'
              : selectedComparableIds.length >= 5
              ? 'Ottimo numero di comparabili'
              : 'Stima affidabile'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function Step0ImmobileBase({ form }: { form: ReturnType<typeof useForm<PropertyFormData>> }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Tipologia immobile</Label>
          <Controller
            name="type"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Seleziona tipologia" /></SelectTrigger>
                <SelectContent>
                  {[
                    ['appartamento', 'Appartamento'],
                    ['villa', 'Villa'],
                    ['villetta', 'Villetta a schiera'],
                    ['attico', 'Attico/Mansarda'],
                    ['loft', 'Loft'],
                    ['monolocale', 'Monolocale'],
                    ['bilocale', 'Bilocale'],
                    ['trilocale', 'Trilocale'],
                    ['quadrilocale', 'Quadrilocale +'],
                    ['ufficio', 'Ufficio'],
                    ['negozio', 'Negozio/Locale comm.'],
                  ].map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Tipo contratto</Label>
          <Controller
            name="contract_type"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendita">Vendita</SelectItem>
                  <SelectItem value="locazione">Locazione</SelectItem>
                  <SelectItem value="asta">Asta giudiziaria</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>Superficie commerciale (m²) *</Label>
          <Input type="number" placeholder="85" {...form.register('commercial_area')} />
          {form.formState.errors.commercial_area && (
            <p className="text-xs text-destructive">{form.formState.errors.commercial_area.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Superficie calpestabile (m²)</Label>
          <Input type="number" placeholder="72" {...form.register('usable_area')} />
        </div>
        <div className="space-y-1.5">
          <Label>N. locali</Label>
          <Input type="number" placeholder="3" {...form.register('rooms')} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label>Bagni</Label>
          <Input type="number" placeholder="1" {...form.register('bathrooms')} />
        </div>
        <div className="space-y-1.5">
          <Label>Piano</Label>
          <Input type="number" placeholder="3" {...form.register('floor')} />
        </div>
        <div className="space-y-1.5">
          <Label>Piani totali edificio</Label>
          <Input type="number" placeholder="6" {...form.register('total_floors')} />
        </div>
        <div className="space-y-1.5">
          <Label>Anno costruzione</Label>
          <Input type="number" placeholder="1975" {...form.register('build_year')} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Stato di conservazione</Label>
          <Controller
            name="condition"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuovo">Nuovo / Prima consegna</SelectItem>
                  <SelectItem value="ottimo">Ottimo</SelectItem>
                  <SelectItem value="ristrutturato">Ristrutturato</SelectItem>
                  <SelectItem value="buono">Buono</SelectItem>
                  <SelectItem value="discreto">Discreto</SelectItem>
                  <SelectItem value="da_ristrutturare">Da ristrutturare</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Classe energetica</Label>
          <Controller
            name="energy_class"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Seleziona classe" /></SelectTrigger>
                <SelectContent>
                  {['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G'].map((c) => (
                    <SelectItem key={c} value={c}>Classe {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
    </div>
  )
}

function Step1Localizzazione({ form }: { form: ReturnType<typeof useForm<PropertyFormData>> }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Indirizzo *</Label>
        <Input placeholder="Via Cola di Rienzo, 120" {...form.register('address')} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>Città *</Label>
          <Input placeholder="Roma" {...form.register('city')} />
        </div>
        <div className="space-y-1.5">
          <Label>CAP</Label>
          <Input placeholder="00192" {...form.register('postal_code')} />
        </div>
        <div className="space-y-1.5">
          <Label>Provincia</Label>
          <Input placeholder="RM" {...form.register('province')} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Zona</Label>
          <Input placeholder="Prati" {...form.register('zone')} />
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 h-48 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">Mappa interattiva</p>
          <p className="text-xs mt-1">Disponibile con Supabase configurato</p>
        </div>
      </div>
    </div>
  )
}

function Step2Caratteristiche() {
  const { draft, setProperty } = useValuationStore()
  const p = draft.property

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Dotazioni</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { key: 'elevator', label: 'Ascensore' },
            { key: 'balcony', label: 'Balcone' },
            { key: 'terrace', label: 'Terrazzo' },
            { key: 'garden', label: 'Giardino' },
            { key: 'garage', label: 'Box/Garage' },
            { key: 'parking_space', label: 'Posto auto' },
            { key: 'cellar', label: 'Cantina' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
              <span className="text-sm font-medium">{label}</span>
              <Switch
                checked={!!p[key as keyof typeof p]}
                onCheckedChange={(v) => setProperty({ [key]: v })}
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Esposizione e riscaldamento</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Esposizione</Label>
            <Select onValueChange={(v) => setProperty({ exposure: v })}>
              <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
              <SelectContent>
                {['Nord', 'Sud', 'Est', 'Ovest', 'Sud/Est', 'Sud/Ovest', 'Nord/Est', 'Nord/Ovest', 'Quadrupla'].map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Riscaldamento</Label>
            <Select onValueChange={(v) => setProperty({ heating_type: v as 'autonomo' | 'centralizzato' | 'teleriscaldamento' | 'assente' })}>
              <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="autonomo">Autonomo</SelectItem>
                <SelectItem value="centralizzato">Centralizzato</SelectItem>
                <SelectItem value="teleriscaldamento">Teleriscaldamento</SelectItem>
                <SelectItem value="assente">Assente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step3Comparabili() {
  const { draft, toggleComparable, setAllComparables, setOmiZone } = useValuationStore()
  const { selectedComparableIds } = draft
  const [localQuery, setLocalQuery] = useState('')
  const [filterSource, setFilterSource] = useState<string>('all')

  const isWikicasa = filterSource === 'wikicasa'

  const searchFilters = useMemo(() =>
    isWikicasa
      ? { city: draft.property.city || 'roma', source: 'wikicasa' as const }
      : { city: draft.property.city || undefined, source: filterSource !== 'all' ? filterSource as import('@/types').ComparableSource : undefined }
  , [isWikicasa, draft.property.city, filterSource])

  const { data: comparables = [], isLoading } = useComparableSearch(searchFilters)

  // Carica le zone OMI per la città dell'immobile e seleziona la zona più vicina
  const { data: omiZones = [] } = useZoneInsightsByCity(draft.property.city ?? '')

  useEffect(() => {
    if (omiZones.length === 0) {
      setOmiZone(null)
      return
    }
    // Scegli la zona OMI che corrisponde alla zona inserita, o la prima disponibile
    const propertyZone = (draft.property.zone ?? '').toLowerCase()
    const match = propertyZone
      ? omiZones.find((z) => z.zone.toLowerCase().includes(propertyZone) || propertyZone.includes(z.zone.toLowerCase()))
      : null
    setOmiZone(match ?? omiZones[0])
  }, [omiZones, draft.property.zone, setOmiZone])

  // Sincronizza i comparabili nello store per il calcolo
  useEffect(() => {
    if (comparables.length > 0) setAllComparables(comparables)
  }, [comparables, setAllComparables])

  const filtered = comparables.filter((c) => {
    if (!localQuery) return true
    const q = localQuery.toLowerCase()
    return c.address.toLowerCase().includes(q) || c.zone?.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      {/* Banner zona OMI */}
      {omiZones.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-emerald-800 font-medium">
              Zona OMI rilevata:{' '}
              <span className="font-bold">{omiZones[0].zone}</span>
              {' · '}
              {omiZones[0].avg_price_sqm.toLocaleString('it-IT')} €/m²
              <span className="font-normal text-emerald-600 ml-1">media di mercato</span>
            </span>
          </div>
          <Badge variant="emerald" className="text-[10px] shrink-0">OMI {omiZones[0].period_label}</Badge>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Input
          startIcon={<Search className="h-4 w-4" />}
          placeholder="Filtra per indirizzo o zona..."
          className="flex-1 min-w-[180px] max-w-sm"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
        />
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Demo data</SelectItem>
            <SelectItem value="wikicasa">Wikicasa</SelectItem>
            <SelectItem value="idealista">Idealista</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="slate">{isLoading ? '…' : `${filtered.length} trovati`}</Badge>
      </div>

      {/* Banner Wikicasa */}
      {isWikicasa && draft.property.city && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-2.5 flex items-center gap-2 text-sm">
          <Search className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-amber-800">
            {isLoading
              ? <>Scraping Wikicasa in corso per <strong>{draft.property.city}</strong>…</>
              : <>Dati reali da <strong>wikicasa.it</strong> · città: <strong>{draft.property.city}</strong></>}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4 flex gap-4">
              <div className="w-24 h-16 rounded-lg bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
      <div className="space-y-3">
        {filtered.map((comp) => {
          const isSelected = selectedComparableIds.includes(comp.id)
          return (
            <div
              key={comp.id}
              className={cn(
                'group flex gap-4 rounded-xl border p-4 cursor-pointer transition-all duration-150',
                isSelected
                  ? 'border-brand-300 bg-brand-50/60 shadow-kpi'
                  : 'border-border bg-card hover:border-brand-200 hover:bg-brand-50/20'
              )}
              onClick={() => toggleComparable(comp.id)}
            >
              {/* Image */}
              <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                {comp.image_url && (
                  <img src={comp.image_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>

              {/* Data */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{comp.address}</p>
                    <p className="text-xs text-muted-foreground">{comp.city} · {comp.zone}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="slate" className="text-[10px] capitalize">{comp.source}</Badge>
                    {isSelected && <Check className="h-4 w-4 text-brand-600" />}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Prezzo</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(comp.price, true)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Superficie</p>
                    <p className="text-sm font-semibold">{formatArea(comp.area_sqm)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">€/m²</p>
                    <p className="text-sm font-semibold">{comp.price_per_sqm.toLocaleString('it-IT')}</p>
                  </div>
                  {comp.distance_km && (
                    <div>
                      <p className="text-xs text-muted-foreground">Distanza</p>
                      <p className="text-sm font-semibold">{formatDistance(comp.distance_km)}</p>
                    </div>
                  )}
                  {comp.similarity_score && (
                    <div>
                      <p className="text-xs text-muted-foreground">Similarità</p>
                      <p className="text-sm font-semibold text-brand-600">{Math.round(comp.similarity_score * 100)}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}

function Step4Risultato() {
  const { draft } = useValuationStore()
  const { result } = draft

  if (!result) {
    return (
      <div className="py-12 text-center">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-sm font-medium text-foreground">Nessun risultato disponibile</p>
        <p className="text-xs text-muted-foreground mt-1">Torna al passaggio comparabili e seleziona almeno un record.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main result */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
        <p className="text-sm font-medium text-brand-200 mb-1">Valore di mercato stimato</p>
        <p className="text-4xl font-bold mb-2">{formatCurrency(result.estimated_avg)}</p>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-brand-200">Min {formatCurrency(result.estimated_min, true)}</span>
          <span className="text-brand-400">·</span>
          <span className="text-brand-200">Max {formatCurrency(result.estimated_max, true)}</span>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-brand-200">Prezzo di pubblicazione consigliato</p>
            <p className="text-xl font-bold">{formatCurrency(result.suggested_listing_price)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-brand-200">Prezzo al m²</p>
            <p className="text-xl font-bold">{result.price_per_sqm.toLocaleString('it-IT')} €</p>
          </div>
        </div>
      </div>

      <ConfidenceScoreBadge score={result.confidence_score} size="lg" />

      {/* Notes */}
      {result.notes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Note automatiche</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {result.notes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-brand-400" />
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function NuovaValutazionePage() {
  const navigate = useNavigate()
  const { draft, setStep, setProperty, resetDraft } = useValuationStore()
  const createValuation = useCreateValuation()
  const userId = useAuthStore((s) => s.profile?.id ?? 'demo-user-001')
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      type: draft.property.type ?? 'appartamento',
      contract_type: draft.property.contract_type ?? 'vendita',
      address: draft.property.address ?? '',
      city: draft.property.city ?? '',
      condition: draft.property.condition ?? 'buono',
      commercial_area: draft.property.commercial_area ?? 80,
    },
  })

  const currentStep = draft.currentStep

  const handleNext = async () => {
    if (currentStep === 0) {
      const valid = await form.trigger(['type', 'contract_type', 'commercial_area', 'condition'])
      if (!valid) return
      const data = form.getValues()
      setProperty(data as Parameters<typeof setProperty>[0])
    }
    if (currentStep === 1) {
      const valid = await form.trigger(['address', 'city'])
      if (!valid) return
      const data = form.getValues()
      setProperty(data as Parameters<typeof setProperty>[0])
    }
    setStep(Math.min(currentStep + 1, STEPS.length - 1))
  }

  const handleBack = () => setStep(Math.max(currentStep - 1, 0))

  const handleSave = async () => {
    if (!draft.result) return
    setIsSaving(true)
    try {
      // 1. Crea l'immobile
      const property = await propertiesService.create({
        ...(draft.property as any),
        user_id: userId,
        client_id: null,
      })
      // 2. Crea la valutazione
      await createValuation.mutateAsync({
        user_id: userId,
        property_id: property.id,
        client_id: null,
        status: 'completed',
        estimated_min: draft.result.estimated_min,
        estimated_avg: draft.result.estimated_avg,
        estimated_max: draft.result.estimated_max,
        suggested_listing_price: draft.result.suggested_listing_price,
        confidence_score: draft.result.confidence_score,
        valuation_notes: draft.notes || null,
      })
      resetDraft()
      navigate('/archivio')
    } catch (err) {
      console.error('Errore salvataggio:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const STEP_CONTENT: Record<number, React.ReactNode> = {
    0: <Step0ImmobileBase form={form} />,
    1: <Step1Localizzazione form={form} />,
    2: <Step2Caratteristiche />,
    3: <Step3Comparabili />,
    4: <Step4Risultato />,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuova Valutazione"
        description="Compila il workflow per ottenere una stima professionale"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Nuova Valutazione' }]}
      />

      {/* Step indicator */}
      <div className="flex items-center justify-between">
        <StepIndicator currentStep={currentStep} />
        <Badge variant="slate" className="hidden sm:flex">
          Step {currentStep + 1} di {STEPS.length}
        </Badge>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => { const S = STEPS[currentStep]; return <S.icon className="h-5 w-5 text-brand-600" /> })()}
                {STEPS[currentStep].label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {STEP_CONTENT[currentStep]}

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Indietro
                </Button>

                <div className="flex items-center gap-2">
                  {currentStep === STEPS.length - 1 ? (
                    <Button onClick={handleSave} loading={isSaving} variant="brand">
                      <Check className="h-4 w-4" />
                      Salva valutazione
                    </Button>
                  ) : (
                    <Button onClick={handleNext}>
                      Avanti
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sticky estimate */}
        <div>
          <StickyEstimatePanel />
        </div>
      </div>
    </div>
  )
}
