import { Settings, Moon, Sun, Monitor, Bell, Lock, Building } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

export function ImpostazioniPage() {
  const { theme, setTheme } = useUIStore()
  const { profile } = useAuthStore()

  const THEME_OPTIONS = [
    { value: 'light', label: 'Chiaro', icon: Sun },
    { value: 'dark', label: 'Scuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ] as const

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Impostazioni"
        description="Configura il tuo profilo e le preferenze dell'app"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Impostazioni' }]}
      />

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-4 w-4 text-brand-600" />
            Informazioni agenzia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input defaultValue={profile?.full_name} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" defaultValue={profile?.email} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Nome agenzia</Label>
            <Input defaultValue={profile?.agency_name ?? ''} />
          </div>
          <Button size="sm">Salva modifiche</Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Aspetto</CardTitle>
          <CardDescription>Personalizza il tema dell'interfaccia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                  theme === value
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-border hover:border-brand-200'
                )}
              >
                <Icon className={cn('h-5 w-5', theme === value ? 'text-brand-600' : 'text-muted-foreground')} />
                <span className={cn('text-xs font-medium', theme === value ? 'text-brand-700' : 'text-muted-foreground')}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-brand-600" />
            Notifiche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Nuovi comparabili disponibili', desc: 'Avviso quando ci sono nuovi annunci nella tua zona' },
            { label: 'Reminder visite', desc: '24 ore prima di ogni visita programmata' },
            { label: 'Valutazione completata', desc: 'Quando una stima viene calcolata' },
            { label: 'Report pronti', desc: 'Quando un PDF è pronto per il download' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-brand-600" />
            Sicurezza
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" size="sm">Cambia password</Button>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Autenticazione a due fattori</p>
              <p className="text-xs text-muted-foreground">Maggiore sicurezza per il tuo account</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
