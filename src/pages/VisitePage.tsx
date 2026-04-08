import { useState } from 'react'
import {
  Calendar, Plus, User, Check, X, Clock, ChevronDown, AlertTriangle, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { DEMO_PROPERTIES, DEMO_CLIENTS } from '@/lib/demo-data'
import { formatDatetime, formatRelativeDate } from '@/lib/utils'
import { useVisits, useCreateVisit, useUpdateVisitStatus, useDeleteVisit } from '@/hooks/useVisits'
import { useAuthStore } from '@/store/auth.store'
import { useForm } from 'react-hook-form'
import type { Visit } from '@/types'

interface VisitFormData {
  property_id: string
  client_id: string
  scheduled_at: string
  notes: string
}

function VisitDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const userId = useAuthStore((s) => s.profile?.id ?? 'demo-user-001')
  const createVisit = useCreateVisit()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<VisitFormData>({
    defaultValues: { property_id: '', client_id: '', scheduled_at: '', notes: '' },
  })

  const onSubmit = async (data: VisitFormData) => {
    await createVisit.mutateAsync({
      user_id: userId,
      property_id: data.property_id,
      client_id: data.client_id || null,
      scheduled_at: new Date(data.scheduled_at).toISOString(),
      status: 'scheduled',
      feedback: null,
      notes: data.notes || null,
    } as Omit<Visit, 'id' | 'created_at'>)
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuova visita</DialogTitle>
          <DialogDescription>Pianifica una visita ad un immobile.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Immobile</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('property_id', { required: true })}
            >
              <option value="">Seleziona immobile...</option>
              {DEMO_PROPERTIES.map((p) => (
                <option key={p.id} value={p.id}>{p.address}, {p.city}</option>
              ))}
            </select>
            {errors.property_id && <p className="text-xs text-destructive">Campo obbligatorio</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Cliente (opzionale)</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('client_id')}
            >
              <option value="">Nessun cliente</option>
              {DEMO_CLIENTS.map((c) => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Data e ora</Label>
            <Input type="datetime-local" {...register('scheduled_at', { required: true })} />
            {errors.scheduled_at && <p className="text-xs text-destructive">Campo obbligatorio</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Note (opzionale)</Label>
            <Textarea placeholder="Es. Prima visita, portare planimetria..." rows={3} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose() }}>Annulla</Button>
            <Button type="submit" disabled={createVisit.isPending}>
              {createVisit.isPending ? 'Salvataggio...' : 'Pianifica visita'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function VisitePage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: visits = [], isLoading } = useVisits()
  const updateStatus = useUpdateVisitStatus()
  const deleteVisit = useDeleteVisit()

  const upcoming = visits.filter((v) => v.status === 'scheduled')
  const past = visits.filter((v) => v.status !== 'scheduled')

  const handleDelete = () => {
    if (!deleteId) return
    deleteVisit.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Visite"
          description="Pianifica e traccia le visite agli immobili"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Visite' }]}
          actions={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nuova Visita
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : (
            [
              { label: 'Pianificate', value: upcoming.length, color: 'text-blue-600' },
              { label: 'Effettuate', value: past.filter((v) => v.status === 'completed').length, color: 'text-emerald-600' },
              { label: 'Annullate', value: past.filter((v) => v.status === 'cancelled').length, color: 'text-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-card text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))
          )}
        </div>

        {/* Upcoming */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Prossime visite</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Nessuna visita pianificata"
              description="Aggiungi una visita per tenerla tracciata."
              action={{ label: 'Nuova visita', onClick: () => setDialogOpen(true) }}
            />
          ) : (
            <div className="space-y-3">
              {upcoming.map((v) => (
                <Card key={v.id} className="hover:shadow-card-hover transition-all">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{(v as any).property?.address ?? '—'}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {(v as any).client
                            ? `${(v as any).client.first_name} ${(v as any).client.last_name}`
                            : 'Senza cliente'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeDate(v.scheduled_at)}
                        </span>
                      </div>
                      {v.notes && <p className="text-xs text-muted-foreground mt-1 italic">{v.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={v.status} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: v.id, status: 'completed' })}
                            disabled={updateStatus.isPending}
                          >
                            <Check className="h-4 w-4" />
                            Segna come effettuata
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: v.id, status: 'cancelled' })}
                            disabled={updateStatus.isPending}
                          >
                            <X className="h-4 w-4" />
                            Annulla visita
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(v.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Past */}
        {!isLoading && past.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Storico visite</h2>
            <Card className="overflow-hidden">
              {past.map((v, i) => (
                <div key={v.id}>
                  {i > 0 && <Separator />}
                  <div className="group flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{(v as any).property?.address ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {(v as any).client
                          ? `${(v as any).client.first_name} ${(v as any).client.last_name}`
                          : '—'} · {formatDatetime(v.scheduled_at)}
                      </p>
                    </div>
                    <StatusBadge status={v.status} />
                    {v.feedback && (
                      <p className="text-xs text-muted-foreground max-w-xs hidden xl:block truncate italic">
                        &ldquo;{v.feedback}&rdquo;
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(v.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>

      <VisitDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Elimina visita
            </DialogTitle>
            <DialogDescription>
              Questa azione è irreversibile. La visita verrà eliminata definitivamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annulla</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteVisit.isPending}>
              {deleteVisit.isPending ? 'Eliminazione...' : 'Elimina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
