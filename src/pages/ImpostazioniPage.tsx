import { useState } from 'react'
import {
  Moon, Sun, Monitor, Bell, Lock, Building, Check, User, Palette, BellRing,
  ShieldCheck, Plug, Copy, Eye, EyeOff, Trash2, LogOut, Phone, Globe, FileText,
  RefreshCw, CheckCircle2, XCircle, ChevronRight, Key, Smartphone, Mail,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import type { AppLanguage, AppDensity } from '@/store/ui.store'

// ─── Constants ────────────────────────────────────────────────────────────────

const THEME_OPTIONS = [
  { value: 'light', label: 'Chiaro', icon: Sun },
  { value: 'dark', label: 'Scuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
] as const

const AVATAR_COLORS = [
  { value: 'bg-brand-600', label: 'Brand' },
  { value: 'bg-violet-600', label: 'Viola' },
  { value: 'bg-rose-600', label: 'Rosa' },
  { value: 'bg-emerald-600', label: 'Verde' },
  { value: 'bg-amber-500', label: 'Ambra' },
  { value: 'bg-sky-600', label: 'Cielo' },
]

const NOTIFICATION_PREFS = [
  { key: 'comparabili', label: 'Nuovi comparabili', desc: 'Quando ci sono nuovi annunci nella tua zona', icon: Bell },
  { key: 'visite', label: 'Reminder visite', desc: '24 ore prima di ogni visita programmata', icon: Bell },
  { key: 'valutazioni', label: 'Valutazione completata', desc: 'Quando una stima viene calcolata', icon: Bell },
  { key: 'report', label: 'Report pronti', desc: 'Quando un PDF è pronto per il download', icon: Bell },
  { key: 'clienti', label: 'Aggiornamenti clienti', desc: 'Modifiche allo stato dei tuoi clienti', icon: Bell },
]

const PORTALS = [
  { id: 'idealista', name: 'Idealista', color: 'bg-orange-500', connected: true, listings: 142 },
  { id: 'immobiliare', name: 'Immobiliare.it', color: 'bg-blue-600', connected: true, listings: 98 },
  { id: 'casa', name: 'Casa.it', color: 'bg-green-600', connected: false, listings: 0 },
  { id: 'wikicasa', name: 'Wikicasa', color: 'bg-purple-600', connected: false, listings: 0 },
]

const SESSIONS = [
  { id: 1, device: 'MacBook Pro — Chrome', location: 'Roma, IT', time: 'Attiva ora', current: true },
  { id: 2, device: 'iPhone 15 — Safari', location: 'Roma, IT', time: '2 ore fa', current: false },
  { id: 3, device: 'Windows PC — Edge', location: 'Milano, IT', time: '3 giorni fa', current: false },
]

const SECTIONS = [
  { id: 'profilo', label: 'Profilo', icon: User },
  { id: 'aspetto', label: 'Aspetto', icon: Palette },
  { id: 'notifiche', label: 'Notifiche', icon: BellRing },
  { id: 'integrazioni', label: 'Integrazioni', icon: Plug },
  { id: 'sicurezza', label: 'Sicurezza', icon: ShieldCheck },
]

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImpostazioniPage() {
  const { theme, setTheme, language, setLanguage, density, setDensity, addNotification } = useUIStore()
  const { profile, setProfile } = useAuthStore()

  const [activeSection, setActiveSection] = useState('profilo')

  // Profilo state — inizializzato dai dati reali del profilo
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [email, setEmail] = useState(profile?.email ?? '')
  const [agencyName, setAgencyName] = useState(profile?.agency_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [website, setWebsite] = useState(profile?.website ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [avatarColor, setAvatarColor] = useState(profile?.avatar_color ?? 'bg-brand-600')
  const [saved, setSaved] = useState(false)

  // Notifiche state
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [emailNotif, setEmailNotif] = useState(true)
  const [pushNotif, setPushNotif] = useState(false)
  const [digestFreq, setDigestFreq] = useState('immediata')
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    comparabili: true, visite: true, valutazioni: true, report: true, clienti: false,
  })

  // Integrazioni state
  const [portals, setPortals] = useState(PORTALS.map(p => ({ ...p })))
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [apiKeyCopied, setApiKeyCopied] = useState(false)
  const API_KEY = 'sk-est-demo-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'

  // Sicurezza state
  const [twoFactor, setTwoFactor] = useState(false)
  const [sessions, setSessions] = useState(SESSIONS)
  const [showDangerZone, setShowDangerZone] = useState(false)

  function handleSaveProfile() {
    if (!profile) return
    setProfile({
      ...profile,
      full_name: fullName,
      email,
      agency_name: agencyName || null,
      phone: phone || null,
      website: website || null,
      bio: bio || null,
      avatar_color: avatarColor,
    })
    setSaved(true)
    addNotification({ type: 'success', title: 'Profilo aggiornato', message: 'Le modifiche al profilo sono state salvate.' })
    setTimeout(() => setSaved(false), 2000)
  }

  function handleCopyApiKey() {
    navigator.clipboard.writeText(API_KEY).catch(() => {})
    setApiKeyCopied(true)
    addNotification({ type: 'success', title: 'Copiato', message: 'API key copiata negli appunti.' })
    setTimeout(() => setApiKeyCopied(false), 2000)
  }

  function togglePortal(id: string) {
    setPortals(prev => prev.map(p => p.id === id ? { ...p, connected: !p.connected } : p))
  }

  function revokeSession(id: number) {
    setSessions(prev => prev.filter(s => s.id !== id))
    addNotification({ type: 'info', title: 'Sessione terminata', message: 'La sessione è stata disconnessa.' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Impostazioni"
        description="Configura il tuo profilo e le preferenze dell'app"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Impostazioni' }]}
      />

      <div className="flex gap-8">
        {/* Left nav */}
        <aside className="w-52 shrink-0">
          <nav className="flex flex-col gap-0.5 sticky top-6">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left',
                  activeSection === id
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                {id === 'integrazioni' && (
                  <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                    {portals.filter(p => p.connected).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ── PROFILO ─────────────────────────────────────── */}
          {activeSection === 'profilo' && (
            <>
              {/* Avatar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4 text-brand-600" />
                    Avatar
                  </CardTitle>
                  <CardDescription>Scegli il colore del tuo avatar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-5">
                    <div className={cn('flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white shadow', avatarColor)}>
                      {getInitials(fullName || profile?.full_name || 'U')}
                    </div>
                    <div className="flex gap-2">
                      {AVATAR_COLORS.map(({ value, label }) => (
                        <button
                          key={value}
                          title={label}
                          onClick={() => setAvatarColor(value)}
                          className={cn(
                            'h-7 w-7 rounded-full transition-transform hover:scale-110',
                            value,
                            avatarColor === value && 'ring-2 ring-offset-2 ring-foreground scale-110'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Info personali */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-brand-600" />
                    Informazioni personali
                  </CardTitle>
                  <CardDescription>Questi dati appaiono nei report e nelle valutazioni</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="full-name">Nome completo</Label>
                      <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input id="email" type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Telefono</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input id="phone" className="pl-9" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="agency">Nome agenzia</Label>
                      <Input id="agency" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Es. Ferretti Immobiliare" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="website">Sito web</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input id="website" className="pl-9" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="www.miagenzia.it" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bio">Bio professionale</Label>
                    <Textarea
                      id="bio"
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Descriviti brevemente..."
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">{bio.length}/200</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button size="sm" onClick={handleSaveProfile} className="gap-2">
                      {saved ? <><Check className="h-3.5 w-3.5" />Salvato</> : 'Salva modifiche'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setFullName(profile?.full_name ?? '')
                      setEmail(profile?.email ?? '')
                      setAgencyName(profile?.agency_name ?? '')
                    }}>
                      Annulla
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── ASPETTO ─────────────────────────────────────── */}
          {activeSection === 'aspetto' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Tema</CardTitle>
                  <CardDescription>Personalizza l'aspetto visivo dell'interfaccia</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={cn(
                          'flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all',
                          theme === value
                            ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                            : 'border-border hover:border-brand-200'
                        )}
                      >
                        <Icon className={cn('h-6 w-6', theme === value ? 'text-brand-600' : 'text-muted-foreground')} />
                        <span className={cn('text-xs font-medium', theme === value ? 'text-brand-700 dark:text-brand-400' : 'text-muted-foreground')}>
                          {label}
                        </span>
                        {theme === value && <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lingua</CardTitle>
                  <CardDescription>Lingua dell'interfaccia</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 max-w-xs">
                    {([{ value: 'it', label: '🇮🇹 Italiano' }, { value: 'en', label: '🇬🇧 English' }] as { value: AppLanguage; label: string }[]).map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setLanguage(value)}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all',
                          language === value
                            ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
                            : 'border-border text-muted-foreground hover:border-brand-200'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Densità contenuto</CardTitle>
                  <CardDescription>Spaziatura delle liste e delle tabelle</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {([
                      { value: 'compact', label: 'Compatta', desc: 'Più elementi visibili' },
                      { value: 'normal', label: 'Normale', desc: 'Equilibrata' },
                      { value: 'comfortable', label: 'Comoda', desc: 'Più spaziosa' },
                    ] as { value: AppDensity; label: string; desc: string }[]).map(({ value, label, desc }) => (
                      <button
                        key={value}
                        onClick={() => setDensity(value)}
                        className={cn(
                          'flex flex-1 flex-col gap-0.5 rounded-xl border-2 p-3 text-left transition-all',
                          density === value
                            ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                            : 'border-border hover:border-brand-200'
                        )}
                      >
                        <span className={cn('text-sm font-medium', density === value ? 'text-brand-700 dark:text-brand-400' : '')}>
                          {label}
                        </span>
                        <span className="text-xs text-muted-foreground">{desc}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── NOTIFICHE ───────────────────────────────────── */}
          {activeSection === 'notifiche' && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Notifiche</CardTitle>
                      <CardDescription>Attiva o disattiva tutte le notifiche</CardDescription>
                    </div>
                    <Switch checked={notifEnabled} onCheckedChange={setNotifEnabled} />
                  </div>
                </CardHeader>
                <CardContent className={cn('space-y-4 transition-opacity', !notifEnabled && 'opacity-40 pointer-events-none')}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-xs text-muted-foreground">Digest via email</p>
                        </div>
                      </div>
                      <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Push</p>
                          <p className="text-xs text-muted-foreground">Browser / App</p>
                        </div>
                      </div>
                      <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
                    </div>
                  </div>

                  {emailNotif && (
                    <div className="flex items-center gap-3">
                      <Label className="shrink-0 text-sm">Frequenza digest</Label>
                      <Select value={digestFreq} onValueChange={setDigestFreq}>
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediata">Immediata</SelectItem>
                          <SelectItem value="oraria">Ogni ora</SelectItem>
                          <SelectItem value="giornaliera">Giornaliera</SelectItem>
                          <SelectItem value="settimanale">Settimanale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preferenze per tipo</CardTitle>
                  <CardDescription>Scegli quali eventi generano una notifica</CardDescription>
                </CardHeader>
                <CardContent className={cn('space-y-1 transition-opacity', !notifEnabled && 'opacity-40 pointer-events-none')}>
                  {NOTIFICATION_PREFS.map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between rounded-lg px-1 py-3 hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Switch
                        checked={notifPrefs[key]}
                        onCheckedChange={(checked) => setNotifPrefs((prev) => ({ ...prev, [key]: checked }))}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {/* ── INTEGRAZIONI ────────────────────────────────── */}
          {activeSection === 'integrazioni' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-brand-600" />
                    API Key
                  </CardTitle>
                  <CardDescription>Usa questa chiave per integrare Estimio con sistemi esterni</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg border bg-muted/40 px-3 py-2 font-mono text-sm tracking-wider">
                      {apiKeyVisible ? API_KEY : '••••••••••••••••••••••••••••••••••••'}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setApiKeyVisible(v => !v)}>
                      {apiKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleCopyApiKey}>
                      {apiKeyCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generata il 15 gennaio 2024 · Non condividere questa chiave pubblicamente
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Portali immobiliari</CardTitle>
                  <CardDescription>Connetti i portali per importare comparabili automaticamente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {portals.map((portal) => (
                    <div key={portal.id} className="flex items-center justify-between rounded-xl border p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white', portal.color)}>
                          {portal.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{portal.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {portal.connected ? `${portal.listings} annunci sincronizzati` : 'Non connesso'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {portal.connected
                          ? <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 gap-1">
                              <CheckCircle2 className="h-3 w-3" />Connesso
                            </Badge>
                          : <Badge variant="outline" className="text-muted-foreground gap-1">
                              <XCircle className="h-3 w-3" />Non connesso
                            </Badge>
                        }
                        <Button
                          variant={portal.connected ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => togglePortal(portal.id)}
                        >
                          {portal.connected ? 'Disconnetti' : 'Connetti'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documenti & Report</CardTitle>
                  <CardDescription>Personalizza intestazione PDF e modelli di report</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Logo agenzia nei PDF', desc: 'Mostra il logo nella copertina dei report' },
                    { label: 'Firma digitale automatica', desc: 'Aggiungi la tua firma ai documenti' },
                    { label: 'Watermark sui comparabili', desc: 'Proteggi i dati con un watermark' },
                  ].map(({ label, desc }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Switch defaultChecked={label.includes('Logo')} />
                    </div>
                  ))}
                  <Separator />
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Personalizza modello PDF
                    <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── SICUREZZA ───────────────────────────────────── */}
          {activeSection === 'sicurezza' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-brand-600" />
                    Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Password attuale</Label>
                      <Input type="password" value="••••••••••" readOnly />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nuova password</Label>
                      <Input type="password" placeholder="Min. 8 caratteri" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Conferma nuova password</Label>
                    <Input type="password" placeholder="Ripeti la nuova password" className="max-w-sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">Ultima modifica: mai · Usa lettere, numeri e simboli per una password robusta</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addNotification({ type: 'info', title: 'Cambio password', message: 'Ti abbiamo inviato un link per reimpostare la password.' })}
                  >
                    Aggiorna password
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-brand-600" />
                        Autenticazione a due fattori
                      </CardTitle>
                      <CardDescription>Aggiungi un livello di sicurezza aggiuntivo al login</CardDescription>
                    </div>
                    <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
                  </div>
                </CardHeader>
                {twoFactor && (
                  <CardContent className="space-y-3">
                    <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                      <p className="text-sm font-medium">Setup 2FA</p>
                      <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Scarica un'app authenticator (Google Authenticator, Authy)</li>
                        <li>Scansiona il QR code qui sotto</li>
                        <li>Inserisci il codice a 6 cifre per confermare</li>
                      </ol>
                      <div className="mt-3 flex h-28 w-28 items-center justify-center rounded-lg border-2 border-dashed bg-background text-xs text-muted-foreground">
                        QR code
                      </div>
                    </div>
                    <div className="flex gap-2 max-w-xs">
                      <Input placeholder="Codice a 6 cifre" maxLength={6} />
                      <Button size="sm">Verifica</Button>
                    </div>
                  </CardContent>
                )}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sessioni attive</CardTitle>
                  <CardDescription>Dispositivi attualmente connessi al tuo account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('h-2 w-2 rounded-full', session.current ? 'bg-emerald-500' : 'bg-muted-foreground')} />
                        <div>
                          <p className="text-sm font-medium">{session.device}</p>
                          <p className="text-xs text-muted-foreground">{session.location} · {session.time}</p>
                        </div>
                      </div>
                      {session.current
                        ? <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 text-xs">Attuale</Badge>
                        : <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive gap-1" onClick={() => revokeSession(session.id)}>
                            <LogOut className="h-3 w-3" />Revoca
                          </Button>
                      }
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Zona pericolosa
                  </CardTitle>
                  <CardDescription>Queste azioni sono irreversibili</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!showDangerZone ? (
                    <Button variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setShowDangerZone(true)}>
                      Mostra opzioni avanzate
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-3">
                        <div>
                          <p className="text-sm font-medium">Esporta tutti i dati</p>
                          <p className="text-xs text-muted-foreground">Scarica un archivio ZIP con tutti i tuoi dati</p>
                        </div>
                        <Button variant="outline" size="sm">Esporta</Button>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-destructive/40 p-3">
                        <div>
                          <p className="text-sm font-medium text-destructive">Elimina account</p>
                          <p className="text-xs text-muted-foreground">Elimina permanentemente account e dati</p>
                        </div>
                        <Button variant="destructive" size="sm">Elimina</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
