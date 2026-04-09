import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Settings, Building2, Mail, Shield, Calendar, Users, ClipboardList,
  FileText, Star, TrendingUp, TrendingDown, Phone, Globe, Award,
  MapPin, Home, ChevronRight, CheckCircle2, XCircle, BarChart2, Zap,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useAuthStore } from '@/store/auth.store'
import {
  DEMO_KPI, DEMO_CLIENTS, DEMO_VALUATIONS, DEMO_VISITS,
  DEMO_REPORTS, DEMO_VALUATIONS_TREND, DEMO_PROPERTIES,
} from '@/lib/demo-data'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin: 'Amministratore', agent: 'Agente', collaborator: 'Collaboratore', viewer: 'Visualizzatore',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  agent: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
  collaborator: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
}

const PLAN_FEATURES = [
  { label: 'Valutazioni illimitate', included: true },
  { label: 'Esportazione PDF avanzata', included: true },
  { label: 'Report di zona OMI', included: true },
  { label: 'Comparabili in tempo reale', included: true },
  { label: 'API access', included: true },
  { label: 'White label (logo personalizzato)', included: true },
  { label: 'Multi-utente / Team', included: false },
  { label: 'Analytics avanzate', included: false },
]

const SPECIALIZZAZIONI = [
  'Appartamenti', 'Ville & Villette', 'Attici', 'Uffici',
  'Zona Prati', 'Zona EUR', 'Zona Esquilino', 'Centro Storico',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function formatCur(v: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, change, color }: {
  icon: React.ElementType; label: string; value: number | string; change?: number; color: string
}) {
  const up = change !== undefined && change >= 0
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', color)}>
          <Icon className="h-4 w-4" />
        </div>
        {change !== undefined && (
          <span className={cn('flex items-center gap-0.5 text-xs font-medium', up ? 'text-emerald-600' : 'text-rose-500')}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      <p className="text-brand-600">{payload[0].value} valutazioni</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProfiloPage() {
  const { profile, isDemoMode } = useAuthStore()
  const [activeSpecs, setActiveSpecs] = useState<string[]>(['Appartamenti', 'Zona Prati', 'Zona EUR'])

  if (!profile) return null

  const activeClients = DEMO_CLIENTS.filter((c) => c.status === 'active').length
  const completedValuations = DEMO_VALUATIONS.filter((v) => v.status === 'completed').length
  const recentValuations = [...DEMO_VALUATIONS].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  ).slice(0, 4)

  function toggleSpec(spec: string) {
    setActiveSpecs(prev => prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profilo"
        description="Il tuo account, le statistiche e il piano abbonamento"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Profilo' }]}
      />

      {/* ── HERO BANNER ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-violet-700 p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0xMnY2aC02di02aDZ6bS0xMiAxMnY2aC02di02aDZ6bTAtMTJ2Nmgtdi02aDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className={cn('flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg backdrop-blur-sm ring-2 ring-white/30', profile.avatar_color ?? 'bg-brand-600')}>
              {getInitials(profile.full_name)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                  {ROLE_LABELS[profile.role] ?? profile.role}
                </span>
                {isDemoMode && <Badge className="bg-white/20 text-white border-white/30 text-xs">Demo</Badge>}
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/80">
                {profile.email && (
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{profile.email}</span>
                )}
                {profile.agency_name && (
                  <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{profile.agency_name}</span>
                )}
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Membro dal {formatDate(profile.created_at)}</span>
              </div>
              {profile.bio && (
                <p className="mt-2 text-sm text-white/70 max-w-xl">{profile.bio}</p>
              )}
            </div>
          </div>
          <Button asChild variant="secondary" size="sm" className="shrink-0 gap-1.5 bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm">
            <Link to="/impostazioni">
              <Settings className="h-3.5 w-3.5" />
              Modifica profilo
            </Link>
          </Button>
        </div>
      </div>

      {/* ── KPI ROW ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={ClipboardList} label="Valutazioni / mese" value={DEMO_KPI.valuations_this_month} change={DEMO_KPI.valuations_change} color="bg-brand-100 text-brand-600" />
        <KpiCard icon={Users} label="Clienti attivi" value={activeClients} color="bg-sky-100 text-sky-600" />
        <KpiCard icon={Calendar} label="Visite totali" value={DEMO_VISITS.length} color="bg-amber-100 text-amber-600" />
        <KpiCard icon={FileText} label="Report generati" value={DEMO_REPORTS.length} color="bg-emerald-100 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── LEFT COLUMN ──────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-1">

          {/* Dati extra */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Dettagli profilo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                profile.phone && { icon: Phone, label: profile.phone },
                profile.website && { icon: Globe, label: profile.website },
                { icon: MapPin, label: 'Roma, RM' },
              ].filter(Boolean).map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{label}</span>
                </div>
              ))}
              <Separator />
              {[
                { label: 'Ruolo', value: ROLE_LABELS[profile.role] ?? profile.role },
                { label: 'Stato account', value: 'Attivo' },
                { label: 'ID', value: profile.id.slice(0, 14) + '…' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-mono text-xs">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Specializzazioni */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-brand-600" />
                Specializzazioni
              </CardTitle>
              <CardDescription className="text-xs">Clicca per aggiungere o rimuovere</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {SPECIALIZZAZIONI.map((spec) => {
                  const active = activeSpecs.includes(spec)
                  return (
                    <button
                      key={spec}
                      onClick={() => toggleSpec(spec)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium transition-colors border',
                        active
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-transparent text-muted-foreground border-border hover:border-brand-300 hover:text-brand-600'
                      )}
                    >
                      {spec}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Piano abbonamento */}
          <Card className="border-brand-200 dark:border-brand-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-brand-600" />
                  Piano Pro
                </CardTitle>
                <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">Attivo</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                {PLAN_FEATURES.map(({ label, included }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    {included
                      ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      : <XCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                    }
                    <span className={included ? 'text-foreground' : 'text-muted-foreground/50 line-through'}>{label}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rinnovo</span>
                  <span className="font-medium">15 mag 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Storage usato</span>
                  <span className="font-medium">2.4 GB / 10 GB</span>
                </div>
              </div>
              <Progress value={24} className="h-1.5" />
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                Gestisci abbonamento
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">

          {/* Trend valutazioni */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-brand-600" />
                  Andamento valutazioni
                </CardTitle>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 gap-1 text-xs">
                  <TrendingUp className="h-3 w-3" />+{DEMO_KPI.valuations_change}% vs mese scorso
                </Badge>
              </div>
              <CardDescription>Ultimi 6 mesi · {completedValuations} completate in totale</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={DEMO_VALUATIONS_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="profilo-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone" dataKey="count"
                      stroke="#6366f1" strokeWidth={2}
                      fill="url(#profilo-grad)"
                      dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Valutazioni recenti */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-brand-600" />
                  Valutazioni recenti
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-xs gap-1 h-7">
                  <Link to="/archivio">
                    Vedi tutte
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentValuations.map((val) => {
                const prop = DEMO_PROPERTIES.find(p => p.id === val.property_id)
                return (
                  <Link
                    key={val.id}
                    to={`/valutazione/${val.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/60 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Home className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{prop?.address ?? 'Immobile'}</p>
                        <p className="text-xs text-muted-foreground">{prop?.city ?? ''} · {formatShort(val.updated_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      {val.estimated_avg && (
                        <span className="text-sm font-semibold tabular-nums hidden sm:block">
                          {formatCur(val.estimated_avg)}
                        </span>
                      )}
                      <StatusBadge status={val.status} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                )
              })}
            </CardContent>
          </Card>

          {/* Stats aggregati */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-4 w-4 text-brand-600" />
                Riepilogo attività
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {[
                  { label: 'Valore medio stimato', value: formatCur(DEMO_KPI.avg_estimated_value) },
                  { label: 'Immobili analizzati', value: DEMO_KPI.properties_analyzed },
                  { label: 'Comparabili trovati', value: DEMO_KPI.comparables_found },
                  { label: 'Clienti totali', value: DEMO_CLIENTS.length },
                  { label: 'Visite completate', value: DEMO_VISITS.filter(v => v.status === 'completed').length },
                  { label: 'Report generati', value: DEMO_KPI.reports_generated },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-base font-semibold tabular-nums">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
