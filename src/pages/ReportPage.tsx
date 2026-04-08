import { FileText, Download, RefreshCw, Share2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { useValuations } from '@/hooks/useValuations'
import { useClients } from '@/hooks/useClients'
import { formatDate, formatCurrency } from '@/lib/utils'

const STATUS_BADGE: Record<string, { label: string; color: 'brand' | 'blue' | 'emerald' | 'amber' | 'slate' }> = {
  completed: { label: 'Completata', color: 'emerald' },
  in_progress: { label: 'In corso', color: 'blue' },
  draft: { label: 'Bozza', color: 'slate' },
  archived: { label: 'Archiviata', color: 'amber' },
}

export function ReportPage() {
  const { data: valuations = [], isLoading: loadingVal } = useValuations()
  const { data: clients = [], isLoading: loadingClients } = useClients()

  const isLoading = loadingVal || loadingClients

  const reportRows = valuations.map((v) => ({
    id: v.id,
    title: v.property?.address
      ? `Valutazione – ${v.property.address}`
      : `Valutazione #${v.id.slice(-6)}`,
    clientName: (() => {
      const c = clients.find((cl) => cl.id === v.client_id)
      return c ? `${c.first_name} ${c.last_name}` : '—'
    })(),
    status: v.status,
    estimated_avg: v.estimated_avg,
    created_at: v.created_at,
    valuation: v,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Esportati"
        description="Archivio dei documenti PDF generati"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Report' }]}
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            Genera Report
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          <span className="flex-1">Documento</span>
          <span className="w-32 hidden md:block">Stato</span>
          <span className="w-32 hidden lg:block">Cliente</span>
          <span className="w-28 text-right">Data</span>
          <span className="w-24" />
        </div>

        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-20 hidden md:block" />
                <Skeleton className="h-4 w-24 hidden lg:block" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            ))}
          </div>
        ) : reportRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={FileText}
              title="Nessun report disponibile"
              description="Completa una valutazione e genera il tuo primo report PDF professionale."
            />
          </div>
        ) : (
          reportRows.map((r, i) => {
            const statusInfo = STATUS_BADGE[r.status] ?? STATUS_BADGE.draft
            return (
              <div key={r.id}>
                {i > 0 && <Separator />}
                <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/40 transition-colors">
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                      {r.estimated_avg && (
                        <p className="text-xs text-muted-foreground">{formatCurrency(r.estimated_avg, true)}</p>
                      )}
                    </div>
                  </div>
                  <div className="w-32 hidden md:block">
                    <Badge variant={statusInfo.color}>{statusInfo.label}</Badge>
                  </div>
                  <div className="w-32 hidden lg:block">
                    <p className="text-sm">{r.clientName}</p>
                  </div>
                  <div className="w-28 text-right">
                    <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                  </div>
                  <div className="w-24 flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm">
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </Card>
    </div>
  )
}
