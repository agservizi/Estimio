import { useState } from 'react'
import {
  TrendingUp, TrendingDown, MapPin, BarChart3, Download,
  ArrowUpRight, Building2, Home,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { DEMO_PRICE_TREND } from '@/lib/demo-data'
import { formatCurrency, formatPricePerSqm, formatPercent, cn } from '@/lib/utils'
import { useZoneInsightsByCity } from '@/hooks/useZoneInsights'
import type { ZoneInsight } from '@/types'

const ZONE_COLORS: Record<string, string> = {
  Prati: '#6366f1',
  EUR: '#10b981',
  Esquilino: '#f59e0b',
  Testaccio: '#3b82f6',
  Trastevere: '#8b5cf6',
}

const RADAR_DATA = [
  { subject: 'Prezzo medio', Prati: 90, EUR: 95, Esquilino: 64 },
  { subject: 'Richiesta', Prati: 85, EUR: 72, Esquilino: 80 },
  { subject: 'Liquidità', Prati: 88, EUR: 75, Esquilino: 70 },
  { subject: 'Trend', Prati: 78, EUR: 90, Esquilino: 45 },
  { subject: 'Rendita loc.', Prati: 65, EUR: 70, Esquilino: 82 },
  { subject: 'Qualità vita', Prati: 85, EUR: 80, Esquilino: 72 },
]

function ZoneCard({ zi }: { zi: ZoneInsight }) {
  const isPositive = zi.trend_delta >= 0
  const color = ZONE_COLORS[zi.zone] ?? '#6366f1'

  return (
    <Card className="hover:shadow-card-hover transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <h3 className="text-sm font-bold text-foreground">{zi.zone}</h3>
            </div>
            <p className="text-xs text-muted-foreground">{zi.city} · {zi.period_label}</p>
          </div>
          <Badge
            variant={isPositive ? 'emerald' : 'destructive'}
            className="text-xs"
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {formatPercent(zi.trend_delta)}
          </Badge>
        </div>

        <div className="mb-4">
          <p className="text-2xl font-bold text-foreground">{zi.avg_price_sqm.toLocaleString('it-IT')} €/m²</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {zi.min_price_sqm.toLocaleString('it-IT')} – {zi.max_price_sqm.toLocaleString('it-IT')} €/m²
          </p>
        </div>

        <Separator className="mb-4" />

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{zi.listings_count}</p>
            <p className="text-[10px] text-muted-foreground">Annunci</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{zi.sold_count}</p>
            <p className="text-[10px] text-muted-foreground">Vendite</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{zi.rent_count}</p>
            <p className="text-[10px] text-muted-foreground">Locazioni</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs flex items-center gap-2" style={{ color: p.color }}>
          <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          <span>{p.name}:</span>
          <span className="font-bold">{p.value.toLocaleString('it-IT')} €/m²</span>
        </p>
      ))}
    </div>
  )
}

export function ReportZonaPage() {
  const [selectedCity, setSelectedCity] = useState('Roma')
  const [selectedZone, setSelectedZone] = useState<string>('all')

  const { data: zoneInsights = [], isLoading } = useZoneInsightsByCity(selectedCity)

  const filteredInsights = selectedZone === 'all'
    ? zoneInsights
    : zoneInsights.filter((z) => z.zone === selectedZone)

  const avgPrice = zoneInsights.length
    ? Math.round(zoneInsights.reduce((a, z) => a + z.avg_price_sqm, 0) / zoneInsights.length)
    : 0
  const totalListings = zoneInsights.reduce((a, z) => a + z.listings_count, 0)
  const totalSold = zoneInsights.reduce((a, z) => a + z.sold_count, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report di Zona"
        description="Analisi di mercato e trend di prezzo per zona geografica"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Report di Zona' }]}
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Esporta PDF
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-40">
            <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Roma">Roma</SelectItem>
            <SelectItem value="Milano">Milano</SelectItem>
            <SelectItem value="Napoli">Napoli</SelectItem>
            <SelectItem value="Torino">Torino</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedZone} onValueChange={setSelectedZone}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tutte le zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le zone</SelectItem>
            {zoneInsights.map((z) => (
              <SelectItem key={z.id} value={z.zone}>{z.zone}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="slate">{filteredInsights.length} zone analizzate</Badge>
      </div>

      {/* Summary KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-card">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Prezzo medio €/m²',
            value: `${avgPrice.toLocaleString('it-IT')} €`,
            icon: BarChart3,
            change: 2.9,
            color: 'brand',
          },
          {
            label: 'Annunci totali',
            value: totalListings,
            icon: Home,
            color: 'blue',
          },
          {
            label: 'Vendite registrate',
            value: totalSold,
            icon: Building2,
            color: 'emerald',
          },
          {
            label: 'Zona con max trend',
            value: zoneInsights.length ? zoneInsights.reduce((a, z) => z.trend_delta > a.trend_delta ? z : a).zone : '—',
            icon: TrendingUp,
            color: 'amber',
          },
        ].map(({ label, value, icon: Icon, change, color }) => {
          const colorMap: Record<string, string> = {
            brand: 'bg-brand-50 text-brand-600',
            blue: 'bg-blue-50 text-blue-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            amber: 'bg-amber-50 text-amber-600',
          }
          return (
            <Card key={label} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', colorMap[color])}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground">{value}</p>
                {change !== undefined && (
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">+{change}%</span>
                    <span className="text-xs text-muted-foreground">vs. periodo prec.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      )}

      <Tabs defaultValue="trend">
        <TabsList>
          <TabsTrigger value="trend">Andamento prezzi</TabsTrigger>
          <TabsTrigger value="comparison">Confronto zone</TabsTrigger>
          <TabsTrigger value="radar">Analisi radar</TabsTrigger>
          <TabsTrigger value="table">Tabella dati</TabsTrigger>
        </TabsList>

        {/* Trend chart */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>Andamento prezzi al m² — Ultimi 12 mesi</CardTitle>
              <CardDescription>Confronto tra le principali zone di {selectedCity}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={DEMO_PRICE_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toLocaleString('it-IT')}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span className="text-xs capitalize">{v}</span>} />
                  <Line type="monotone" dataKey="prati" name="Prati" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="eur" name="EUR" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="esquilino" name="Esquilino" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison bars */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Confronto Zone — Prezzo medio al m²</CardTitle>
              <CardDescription>Q1 2024 · {selectedCity}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={filteredInsights}
                  margin={{ top: 4, right: 8, bottom: 0, left: -8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="zone" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString('it-IT')} €/m²`, 'Prezzo medio']} />
                  <Bar dataKey="avg_price_sqm" name="€/m² medio" radius={[6, 6, 0, 0]}>
                    {filteredInsights.map((entry, i) => (
                      <Cell key={i} fill={ZONE_COLORS[entry.zone] ?? '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Radar */}
        <TabsContent value="radar">
          <Card>
            <CardHeader>
              <CardTitle>Analisi Radar — Indicatori di mercato</CardTitle>
              <CardDescription>Confronto multidimensionale tra le principali zone</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={360}>
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Radar name="Prati" dataKey="Prati" stroke="#6366f1" fill="#6366f1" fillOpacity={0.12} />
                  <Radar name="EUR" dataKey="EUR" stroke="#10b981" fill="#10b981" fillOpacity={0.12} />
                  <Radar name="Esquilino" dataKey="Esquilino" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.12} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Table */}
        <TabsContent value="table">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="flex-1">Zona</span>
              <span className="w-32 text-right">€/m² medio</span>
              <span className="w-24 text-right">Annunci</span>
              <span className="w-24 text-right">Vendite</span>
              <span className="w-24 text-right hidden md:block">Locazioni</span>
              <span className="w-24 text-center">Trend</span>
            </div>
            {filteredInsights.map((zi, i) => (
              <div key={zi.id}>
                {i > 0 && <Separator />}
                <div className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ZONE_COLORS[zi.zone] ?? '#94a3b8' }} />
                    <div>
                      <p className="text-sm font-semibold">{zi.zone}</p>
                      <p className="text-xs text-muted-foreground">{zi.microzone ?? zi.city}</p>
                    </div>
                  </div>
                  <div className="w-32 text-right">
                    <p className="text-sm font-bold">{zi.avg_price_sqm.toLocaleString('it-IT')} €</p>
                    <p className="text-[10px] text-muted-foreground">{zi.min_price_sqm.toLocaleString('it-IT')} – {zi.max_price_sqm.toLocaleString('it-IT')}</p>
                  </div>
                  <p className="w-24 text-sm text-right font-medium">{zi.listings_count}</p>
                  <p className="w-24 text-sm text-right font-medium">{zi.sold_count}</p>
                  <p className="w-24 text-sm text-right hidden md:block font-medium">{zi.rent_count}</p>
                  <div className="w-24 flex justify-center">
                    <Badge variant={zi.trend_delta >= 0 ? 'emerald' : 'destructive'}>
                      {zi.trend_delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {formatPercent(zi.trend_delta)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Zone cards */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">Schede zona</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)
            : filteredInsights.map((zi) => <ZoneCard key={zi.id} zi={zi} />)
          }
        </div>
      </div>
    </div>
  )
}
