import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building, ArrowRight, Shield, TrendingUp, BarChart2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Almeno 6 caratteri'),
})

type LoginForm = z.infer<typeof loginSchema>

const FEATURES = [
  { icon: TrendingUp, label: 'Analisi di mercato in tempo reale', desc: 'Prezzi aggiornati per zona e microzona' },
  { icon: BarChart2, label: 'Stime con AI e comparabili', desc: 'Algoritmo pesato su dati reali di mercato' },
  { icon: Shield, label: 'Report PDF professionali', desc: 'Documenti pronti per i tuoi clienti' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loginDemo, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    try {
      await login(data.email, data.password)
      navigate('/')
    } catch {
      setError('Credenziali non valide. Prova con la modalità demo.')
    }
  }

  const handleDemo = () => {
    loginDemo()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: form */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 max-w-md mx-auto lg:mx-0 lg:max-w-[480px] lg:px-12">
        {/* Logo */}
        <div className="w-full mb-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Estimio</p>
              <p className="text-xs text-muted-foreground">Valutazioni Immobiliari Pro</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Bentornato</h1>
          <p className="text-sm text-muted-foreground">
            Accedi al tuo portale di valutazione professionale.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="marco@agenzia.it"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button type="button" className="text-xs text-primary hover:underline">
                Password dimenticata?
              </button>
            </div>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              endIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" loading={isLoading}>
            Accedi
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">oppure</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleDemo}
          >
            Prova la Demo
          </Button>
        </form>

        <p className="mt-8 text-xs text-muted-foreground text-center">
          Non hai un account?{' '}
          <button className="text-primary hover:underline font-medium">Contatta il team</button>
        </p>
      </div>

      {/* Right: visual */}
      <div className="hidden lg:flex flex-1 flex-col justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 h-64 w-64 rounded-full bg-brand-600 blur-3xl" />
          <div className="absolute bottom-20 left-20 h-48 w-48 rounded-full bg-emerald-600 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-sm">
          <h2 className="text-3xl font-bold text-white mb-4 text-balance">
            Il portale professionale per le valutazioni immobiliari
          </h2>
          <p className="text-slate-300 mb-10 text-sm leading-relaxed">
            Analizza, stima, confronta e genera report di qualità professionale in pochi minuti.
            Progettato per agenti, valutatori e consulenti del settore.
          </p>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
            {[
              { value: '2.400+', label: 'Valutazioni create' },
              { value: '98%', label: 'Soddisfazione utenti' },
              { value: '35 città', label: 'Copertura nazionale' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
