import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Home, User, Calendar, TrendingUp,
  FileDown, Pencil, Ruler, Layers, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfidenceScoreBadge } from '@/components/shared/ConfidenceScoreBadge'
import { useValuation } from '@/hooks/useValuations'
import {
  formatCurrency, formatArea, formatDate,
  formatPricePerSqm, formatDistance,
} from '@/lib/utils'
import { cn } from '@/lib/utils'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value ?? '—'}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </h3>
  )
}

export function ValuazioneDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: valuation, isLoading, isError } = useValuation(id!)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Caricamento valutazione…
      </div>
    )
  }

  if (isError || !valuation) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-muted-foreground">Valutazione non trovata.</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('/archivio')}>
          <ArrowLeft className="h-4 w-4" />
          Torna all'archivio
        </Button>
      </div>
    )
  }

  const { property: p, client: c } = valuation

  const priceRange =
    valuation.estimated_min && valuation.estimated_max
      ? valuation.estimated_max - valuation.estimated_min
      : null

  const pricePerSqm =
    valuation.estimated_avg && p?.commercial_area
      ? Math.round(valuation.estimated_avg / p.commercial_area)
      : null

  return (
    <div className="space-y-6">
      <PageHeader
        title={p ? `${p.type.charAt(0).toUpperCase() + p.type.slice(1)} – ${p.address}` : `Valutazione ${id}`}
        description={p ? `${p.city}${p.zone ? `, ${p.zone}` : ''}` : undefined}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Archivio', href: '/archivio' },
          { label: 'Dettaglio' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/report?valuation=${id}`)}>
              <FileDown className="h-4 w-4" />
              Esporta PDF
            </Button>
            <Button size="sm" onClick={() => navigate('/valutazione/nuova')}>
              <Pencil className="h-4 w-4" />
              Modifica
            </Button>
          </div>
        }
      />

      {/* Top row: status + meta */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <StatusBadge status={valuation.status} />
        {valuation.confidence_score != null && (
          <ConfidenceScoreBadge score={valuation.confidence_score} />
        )}
        <span className="ml-auto">
          Aggiornata il {formatDate(valuation.updated_at)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Colonna sinistra (2/3) ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Stima valore */}
          {valuation.estimated_avg != null && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-brand-600" />
                  Stima di Valore
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Prezzo medio consigliato */}
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground mb-1">Prezzo di listino consigliato</p>
                  <p className="text-4xl font-bold text-foreground tracking-tight">
                    {formatCurrency(valuation.suggested_listing_price ?? valuation.estimated_avg)}
                  </p>
                  {pricePerSqm && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatPricePerSqm(pricePerSqm)}
                    </p>
                  )}
                </div>

                {/* Range min / avg / max */}
                {valuation.estimated_min != null && valuation.estimated_max != null && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span>Min: {formatCurrency(valuation.estimated_min)}</span>
                      <span className="font-medium text-foreground">
                        Media: {formatCurrency(valuation.estimated_avg!)}
                      </span>
                      <span>Max: {formatCurrency(valuation.estimated_max)}</span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      {/* Bar proporzionale al range */}
                      {priceRange && valuation.estimated_min != null && (
                        <div
                          className="absolute inset-y-0 bg-brand-500 rounded-full"
                          style={{
                            left: '0%',
                            right: '0%',
                          }}
                        />
                      )}
                    </div>
                    {/* Tre punti sul range */}
                    <div className="flex justify-between mt-2">
                      {[
                        { label: 'Minimo', val: valuation.estimated_min, color: 'text-slate-500' },
                        { label: 'Media', val: valuation.estimated_avg!, color: 'text-brand-600 font-semibold' },
                        { label: 'Massimo', val: valuation.estimated_max, color: 'text-slate-500' },
                      ].map(({ label, val, color }) => (
                        <div key={label} className="text-center">
                          <p className={cn('text-sm', color)}>{formatCurrency(val!)}</p>
                          <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confidence */}
                {valuation.confidence_score != null && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">Indice di affidabilità</span>
                      <span className="text-xs font-medium">
                        {Math.round(valuation.confidence_score * 100)}%
                      </span>
                    </div>
                    <Progress value={valuation.confidence_score * 100} className="h-1.5" />
                  </div>
                )}

                {/* Note */}
                {valuation.valuation_notes && (
                  <>
                    <Separator />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {valuation.valuation_notes}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Immobile */}
          {p && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Home className="h-4 w-4 text-brand-600" />
                  Dettaglio Immobile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Indirizzo */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{p.address}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.postal_code} {p.city} ({p.province}){p.zone ? ` — ${p.zone}` : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 divide-y divide-border/50">
                  <div className="col-span-2">
                    <SectionTitle>Caratteristiche principali</SectionTitle>
                  </div>

                  <div className="divide-y divide-border/50">
                    <InfoRow label="Tipologia" value={p.type} />
                    <InfoRow label="Contratto" value={p.contract_type} />
                    <InfoRow label="Condizione" value={p.condition?.replace('_', ' ')} />
                    <InfoRow label="Piano" value={p.floor != null ? `${p.floor}° / ${p.total_floors ?? '?'}` : null} />
                    <InfoRow label="Anno costruzione" value={p.build_year} />
                    {p.renovated_year && <InfoRow label="Anno ristrutturazione" value={p.renovated_year} />}
                  </div>

                  <div className="divide-y divide-border/50">
                    <InfoRow label="Superficie commerciale" value={formatArea(p.commercial_area)} />
                    {p.usable_area && <InfoRow label="Superficie calpestabile" value={formatArea(p.usable_area)} />}
                    <InfoRow label="Locali" value={p.rooms} />
                    <InfoRow label="Bagni" value={p.bathrooms} />
                    <InfoRow label="Classe energetica" value={p.energy_class} />
                    <InfoRow label="Riscaldamento" value={p.heating_type} />
                  </div>
                </div>

                {/* Dotazioni */}
                <div>
                  <SectionTitle>Dotazioni</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Ascensore', active: p.elevator },
                      { label: 'Balcone', active: p.balcony },
                      { label: 'Terrazzo', active: p.terrace },
                      { label: 'Giardino', active: p.garden },
                      { label: 'Box auto', active: p.garage },
                      { label: 'Posto auto', active: p.parking_space },
                      { label: 'Cantina', active: p.cellar },
                    ].map(({ label, active }) => (
                      <Badge
                        key={label}
                        variant={active ? 'default' : 'outline'}
                        className={cn(!active && 'opacity-40')}
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {p.condo_fees != null && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                    <span className="text-sm text-muted-foreground">Spese condominiali</span>
                    <span className="text-sm font-medium">{formatCurrency(p.condo_fees)}/mese</span>
                  </div>
                )}

                {p.notes && (
                  <>
                    <Separator />
                    <p className="text-sm text-muted-foreground">{p.notes}</p>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Colonna destra (1/3) ────────────────────────────────── */}
        <div className="space-y-6">

          {/* Cliente */}
          {c && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-brand-600" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border/50">
                <div className="pb-3">
                  <p className="font-medium text-sm">{c.first_name} {c.last_name}</p>
                  <StatusBadge status={c.status} />
                </div>
                <InfoRow label="Email" value={c.email} />
                <InfoRow label="Telefono" value={c.phone} />
                <InfoRow label="Interesse" value={c.interest} />
                {c.notes && (
                  <div className="pt-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-brand-600" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/50">
              <InfoRow label="Creata il" value={formatDate(valuation.created_at)} />
              <InfoRow label="Aggiornata il" value={formatDate(valuation.updated_at)} />
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={() => navigate('/archivio')}
              >
                Tutte le valutazioni
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={() => navigate('/comparabili')}
              >
                Vedi comparabili
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="w-full justify-between"
                onClick={() => navigate('/valutazione/nuova')}
              >
                Nuova valutazione
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
