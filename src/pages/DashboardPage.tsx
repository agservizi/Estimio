import { useNavigate } from 'react-router-dom'
import {
  BarChart3, Building2, FileText, Users, Calendar, Search,
  ArrowRight, TrendingUp, MapPin, Clock, Plus, ChevronRight,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { KPIStatCard } from '@/components/shared/KPIStatCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfidenceScoreBadge } from '@/components/shared/ConfidenceScoreBadge'
import { Badge } from '@/components/ui/badge'
import {
  DEMO_KPI, DEMO_VALUATIONS, DEMO_PROPERTIES, DEMO_CLIENTS,
  DEMO_VALUATIONS_TREND, DEMO_PROPERTY_TYPES_DISTRIBUTION, DEMO_ZONE_INSIGHTS,
  DEMO_REPORTS, DEMO_VISITS,
} from '@/lib/demo-data'
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/lib/motion'

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#94a3b8']

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value, true) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Buongiorno' : now.getHours() < 18 ? 'Buon pomeriggio' : 'Buonasera'

  // Merge valuation data with property & client
  const valuationsWithData = DEMO_VALUATIONS.map((v) => ({
    ...v,
    property: DEMO_PROPERTIES.find((p) => p.id === v.property_id),
    client: DEMO_CLIENTS.find((c) => c.id === v.client_id),
  }))

  const visitsWithData = DEMO_VISITS.map((v) => ({
    ...v,
    property: DEMO_PROPERTIES.find((p) => p.id === v.property_id),
    client: DEMO_CLIENTS.find((c) => c.id === v.client_id),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${profile?.full_name?.split(' ')[0] ?? 'Marco'}`}
        description={`${format(now, "EEEE d MMMM yyyy", { locale: it })} · ${profile?.agency_name ?? 'Ferretti Immobiliare'}`}
        actions={
          <Button onClick={() => navigate('/valutazione/nuova')}>
            <Plus className="h-4 w-4" />
            Nuova Valutazione
          </Button>
        }
      />

      {/* KPI Grid */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 items-stretch"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem} className="h-full">
          <KPIStatCard
            title="Valutazioni mese"
            value={DEMO_KPI.valuations_this_month}
            change={DEMO_KPI.valuations_change}
            icon={BarChart3}
            iconColor="brand"
            className="h-full"
          />
        </motion.div>
        <motion.div variants={staggerItem} className="h-full">
          <KPIStatCard
            title="Valore medio stimato"
            value={formatCurrency(DEMO_KPI.avg_estimated_value, true)}
            change={DEMO_KPI.avg_value_change}
            icon={TrendingUp}
            iconColor="emerald"
            className="h-full"
          />
        </motion.div>
        <motion.div variants={staggerItem} className="h-full">
          <KPIStatCard
            title="Immobili analizzati"
            value={DEMO_KPI.properties_analyzed}
            icon={Building2}
            iconColor="blue"
            className="h-full"
          />
        </motion.div>
        <motion.div variants={staggerItem} className="h-full">
          <KPIStatCard
            title="Comparabili trovati"
            value={DEMO_KPI.comparables_found}
            icon={Search}
            iconColor="amber"
            className="h-full"
          />
        </motion.div>
        <motion.div variants={staggerItem} className="h-full">
          <KPIStatCard
            title="Report generati"
            value={DEMO_KPI.reports_generated}
            icon={FileText}
            iconColor="brand"
            className="h-full"
          />
        </motion.div>
        <motion.div variants={staggerItem} className="h-full">
          <KPIStatCard
            title="Visite registrate"
            value={DEMO_KPI.visits_registered}
            icon={Calendar}
            iconColor="slate"
            className="h-full"
          />
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend valutazioni */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Andamento Valutazioni</CardTitle>
            <CardDescription>Numero di valutazioni e valore medio negli ultimi 6 mesi</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={DEMO_VALUATIONS_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="gradCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area yAxisId="left" type="monotone" dataKey="count" name="Valutazioni" stroke="#6366f1" strokeWidth={2} fill="url(#gradCount)" dot={{ r: 3, fill: '#6366f1' }} />
                <Area yAxisId="right" type="monotone" dataKey="avg_value" name="Valore medio" stroke="#10b981" strokeWidth={2} fill="url(#gradValue)" dot={{ r: 3, fill: '#10b981' }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuzione tipologie */}
        <Card>
          <CardHeader>
            <CardTitle>Tipologie Immobiliari</CardTitle>
            <CardDescription>Distribuzione degli immobili valutati</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={DEMO_PROPERTY_TYPES_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {DEMO_PROPERTY_TYPES_DISTRIBUTION.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-1.5 mt-2">
              {DEMO_PROPERTY_TYPES_DISTRIBUTION.slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ultime valutazioni */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-0">
            <div>
              <CardTitle>Ultime Valutazioni</CardTitle>
              <CardDescription className="mt-0.5">Le valutazioni più recenti nel tuo portale</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/archivio')}>
              Vedi tutte <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-0">
              {valuationsWithData.map((v, i) => (
                <div key={v.id}>
                  {i > 0 && <Separator className="my-3" />}
                  <div
                    className="flex items-center gap-3 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => navigate(`/valutazione/${v.id}`)}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {v.property?.address ?? 'Indirizzo non specificato'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {v.property?.city} · {v.client ? `${v.client.first_name} ${v.client.last_name}` : 'Nessun cliente'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {v.estimated_avg && (
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(v.estimated_avg, true)}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDate(v.updated_at)}</p>
                        </div>
                      )}
                      <StatusBadge status={v.status} />
                      {v.confidence_score && (
                        <ConfidenceScoreBadge score={v.confidence_score} showLabel={false} size="sm" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right column: Zone insights + Upcoming visits */}
        <div className="space-y-4">
          {/* Zone più richieste */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Zone più richieste</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {DEMO_ZONE_INSIGHTS.slice(0, 4).map((zi) => (
                  <div
                    key={zi.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 -mx-1 px-1 py-1 rounded-md transition-colors"
                    onClick={() => navigate('/zone')}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{zi.zone}</p>
                      <p className="text-[10px] text-muted-foreground">{zi.listings_count} annunci</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold">{zi.avg_price_sqm.toLocaleString('it-IT')} €/m²</p>
                      <Badge variant={zi.trend_delta >= 0 ? 'emerald' : 'destructive'} className="text-[9px] px-1 py-0">
                        {zi.trend_delta >= 0 ? '+' : ''}{zi.trend_delta}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => navigate('/zone')}>
                Report di Zona <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Prossime visite */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Prossime Visite</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {visitsWithData.filter((v) => v.status === 'scheduled').slice(0, 3).map((v) => (
                  <div key={v.id} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 shrink-0">
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {v.property?.address}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {v.client ? `${v.client.first_name} ${v.client.last_name}` : 'Senza cliente'}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground">{formatRelativeDate(v.scheduled_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => navigate('/visite')}>
                Gestisci visite <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick actions + Recent reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task rapidi */}
        <Card>
          <CardHeader>
            <CardTitle>Azioni rapide</CardTitle>
            <CardDescription>Accesso diretto alle funzioni principali</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Nuova Valutazione', icon: Plus, href: '/valutazione/nuova', color: 'bg-brand-50 text-brand-600 hover:bg-brand-100' },
                { label: 'Cerca Comparabili', icon: Search, href: '/comparabili', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
                { label: 'Report di Zona', icon: TrendingUp, href: '/zone', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
                { label: 'Nuovo Cliente', icon: Users, href: '/clienti', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
              ].map(({ label, icon: Icon, href, color }) => (
                <button
                  key={label}
                  onClick={() => navigate(href)}
                  className={`flex flex-col items-center gap-2 rounded-xl p-4 transition-colors ${color} text-sm font-medium`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ultimi report */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Report esportati</CardTitle>
              <CardDescription>PDF generati di recente</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/report')}>
              Tutti <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {DEMO_REPORTS.map((r, i) => {
                const prop = DEMO_PROPERTIES.find((p) => p.id === r.property_id)
                const client = DEMO_CLIENTS.find((c) => c.id === r.client_id)
                return (
                  <div key={r.id}>
                    {i > 0 && <Separator />}
                    <div className="flex items-center gap-3 pt-3 first:pt-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {prop ? `Valutazione · ${prop.address}` : `Report ${r.report_type}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {client ? `${client.first_name} ${client.last_name} · ` : ''}{formatDate(r.created_at)}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon-sm">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
