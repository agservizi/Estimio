import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth.store'

// Lazy-loaded pages (code splitting)
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const NuovaValutazionePage = lazy(() => import('@/pages/NuovaValutazionePage').then((m) => ({ default: m.NuovaValutazionePage })))
const ValuazioneDetailPage = lazy(() => import('@/pages/ValuazioneDetailPage').then((m) => ({ default: m.ValuazioneDetailPage })))
const ComparabiliPage = lazy(() => import('@/pages/ComparabiliPage').then((m) => ({ default: m.ComparabiliPage })))
const ArchivioPage = lazy(() => import('@/pages/ArchivioPage').then((m) => ({ default: m.ArchivioPage })))
const ClientiPage = lazy(() => import('@/pages/ClientiPage').then((m) => ({ default: m.ClientiPage })))
const ReportZonaPage = lazy(() => import('@/pages/ReportZonaPage').then((m) => ({ default: m.ReportZonaPage })))
const VisitePage = lazy(() => import('@/pages/VisitePage').then((m) => ({ default: m.VisitePage })))
const ReportPage = lazy(() => import('@/pages/ReportPage').then((m) => ({ default: m.ReportPage })))
const PreferitiPage = lazy(() => import('@/pages/PreferitiPage').then((m) => ({ default: m.PreferitiPage })))
const ImpostazioniPage = lazy(() => import('@/pages/ImpostazioniPage').then((m) => ({ default: m.ImpostazioniPage })))

function PageLoader() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-4 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl mt-2" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function ProfiloPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Profilo Utente</h1>
      <p className="text-sm text-muted-foreground">Gestione profilo e piano abbonamento</p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
        <Route path="valutazione/nuova" element={<Suspense fallback={<PageLoader />}><NuovaValutazionePage /></Suspense>} />
        <Route path="valutazione/:id" element={<Suspense fallback={<PageLoader />}><ValuazioneDetailPage /></Suspense>} />
        <Route path="comparabili" element={<Suspense fallback={<PageLoader />}><ComparabiliPage /></Suspense>} />
        <Route path="archivio" element={<Suspense fallback={<PageLoader />}><ArchivioPage /></Suspense>} />
        <Route path="clienti" element={<Suspense fallback={<PageLoader />}><ClientiPage /></Suspense>} />
        <Route path="zone" element={<Suspense fallback={<PageLoader />}><ReportZonaPage /></Suspense>} />
        <Route path="visite" element={<Suspense fallback={<PageLoader />}><VisitePage /></Suspense>} />
        <Route path="report" element={<Suspense fallback={<PageLoader />}><ReportPage /></Suspense>} />
        <Route path="preferiti" element={<Suspense fallback={<PageLoader />}><PreferitiPage /></Suspense>} />
        <Route path="impostazioni" element={<Suspense fallback={<PageLoader />}><ImpostazioniPage /></Suspense>} />
        <Route path="profilo" element={<Suspense fallback={<PageLoader />}><ProfiloPage /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
