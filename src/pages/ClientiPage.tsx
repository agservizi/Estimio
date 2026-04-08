import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, UserPlus, Users, Phone, Mail, ChevronRight,
  BarChart3, Calendar, FileText, ChevronDown, Trash2, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DEMO_VALUATIONS, DEMO_VISITS } from '@/lib/demo-data'
import { formatDate, formatRelativeDate, initials } from '@/lib/utils'
import type { Client, ClientStatus, ClientInterest } from '@/types'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients'

const INTEREST_LABELS: Record<string, string> = {
  acquisto: 'Acquisto',
  vendita: 'Vendita',
  locazione: 'Locazione',
  investimento: 'Investimento',
  altro: 'Altro',
}

const STATUS_COLORS: Record<ClientStatus, string> = {
  prospect: 'bg-blue-50 text-blue-600',
  active: 'bg-emerald-50 text-emerald-600',
  closed: 'bg-slate-100 text-slate-500',
  inactive: 'bg-red-50 text-red-500',
}

interface ClientFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  status: ClientStatus
  interest: ClientInterest | ''
  notes: string
}

function ClientDialog({
  open,
  onClose,
  initial,
  onSave,
  loading,
}: {
  open: boolean
  onClose: () => void
  initial?: Partial<Client>
  onSave: (data: ClientFormData) => void
  loading?: boolean
}) {
  const { register, handleSubmit, control, reset } = useForm<ClientFormData>({
    defaultValues: {
      first_name: initial?.first_name ?? '',
      last_name: initial?.last_name ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      status: initial?.status ?? 'prospect',
      interest: initial?.interest ?? '',
      notes: initial?.notes ?? '',
    },
  })

  const onSubmit = (data: ClientFormData) => {
    onSave(data)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); reset() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial?.id ? 'Modifica Cliente' : 'Nuovo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input placeholder="Marco" {...register('first_name', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Cognome *</Label>
              <Input placeholder="Rossi" {...register('last_name', { required: true })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" placeholder="marco.rossi@email.it" {...register('email')} />
          </div>
          <div className="space-y-1.5">
            <Label>Telefono</Label>
            <Input type="tel" placeholder="+39 333 1234567" {...register('phone')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Stato</Label>
              <Controller name="status" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="active">Attivo</SelectItem>
                    <SelectItem value="closed">Chiuso</SelectItem>
                    <SelectItem value="inactive">Inattivo</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1.5">
              <Label>Interesse</Label>
              <Controller name="interest" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acquisto">Acquisto</SelectItem>
                    <SelectItem value="vendita">Vendita</SelectItem>
                    <SelectItem value="locazione">Locazione</SelectItem>
                    <SelectItem value="investimento">Investimento</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Note</Label>
            <Textarea placeholder="Esigenze specifiche, budget..." rows={3} {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onClose(); reset() }}>Annulla</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvataggio...' : initial?.id ? 'Aggiorna' : 'Salva Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ClientiPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  const { data: clients = [], isLoading } = useClients()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()

  const filtered = useMemo(() => {
    let result = [...clients]
    if (statusFilter !== 'all') result = result.filter((c) => c.status === statusFilter)
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(
        (c) =>
          c.first_name.toLowerCase().includes(q) ||
          c.last_name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q)
      )
    }
    return result
  }, [query, statusFilter, clients])

  const selectedClientData = selectedClient
    ? clients.find((c) => c.id === selectedClient) ?? null
    : null

  const clientValuations = selectedClient
    ? DEMO_VALUATIONS.filter((v) => v.client_id === selectedClient)
    : []

  const clientVisits = selectedClient
    ? DEMO_VISITS.filter((v) => v.client_id === selectedClient)
    : []

  const handleSave = (data: ClientFormData) => {
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || null,
      phone: data.phone || null,
      status: data.status,
      interest: (data.interest || null) as ClientInterest | null,
      notes: data.notes || null,
    }
    if (editingClient) {
      updateClient.mutate({ id: editingClient.id, ...payload }, { onSuccess: () => { setDialogOpen(false); setEditingClient(null) } })
    } else {
      createClient.mutate({ ...payload, user_id: '' }, { onSuccess: () => setDialogOpen(false) })
    }
  }

  const handleDelete = () => {
    if (!deleteId) return
    deleteClient.mutate(deleteId, { onSuccess: () => { setDeleteId(null); if (selectedClient === deleteId) setSelectedClient(null) } })
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Clienti"
          description="Gestisci il tuo portafoglio clienti"
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Clienti' }]}
          actions={
            <Button onClick={() => { setEditingClient(null); setDialogOpen(true) }}>
              <UserPlus className="h-4 w-4" />
              Nuovo Cliente
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Totale', value: clients.length },
            { label: 'Attivi', value: clients.filter((c) => c.status === 'active').length },
            { label: 'Prospect', value: clients.filter((c) => c.status === 'prospect').length },
            { label: 'Chiusi', value: clients.filter((c) => c.status === 'closed').length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-3 shadow-card">
              {isLoading ? <Skeleton className="h-7 w-8 mb-1" /> : <p className="text-xl font-bold text-foreground">{value}</p>}
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client list */}
          <div className="lg:col-span-2 space-y-4">
            {/* Toolbar */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  startIcon={<Search className="h-4 w-4" />}
                  placeholder="Cerca clienti..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ClientStatus | 'all')}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Attivi</SelectItem>
                  <SelectItem value="closed">Chiusi</SelectItem>
                  <SelectItem value="inactive">Inattivi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <Card className="overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </Card>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nessun cliente trovato"
                description="Prova a modificare i filtri o aggiungi un nuovo cliente."
                action={{ label: 'Nuovo Cliente', onClick: () => { setEditingClient(null); setDialogOpen(true) } }}
              />
            ) : (
              <Card className="overflow-hidden">
                <AnimatePresence initial={false}>
                {filtered.map((client, i) => {
                  const isSelected = selectedClient === client.id
                  const valCount = DEMO_VALUATIONS.filter((v) => v.client_id === client.id).length
                  const visitCount = DEMO_VISITS.filter((v) => v.client_id === client.id).length

                  return (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.18, delay: i * 0.03 }}
                    >
                      {i > 0 && <Separator />}
                      <div
                        className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors group ${
                          isSelected ? 'bg-brand-50' : 'hover:bg-muted/40'
                        }`}
                        onClick={() => setSelectedClient(isSelected ? null : client.id)}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="text-xs">
                            {initials(`${client.first_name} ${client.last_name}`)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {client.first_name} {client.last_name}
                            </p>
                            <StatusBadge status={client.status} />
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {client.email && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </span>
                            )}
                          </div>
                        </div>

                        {client.interest && (
                          <Badge variant="slate" className="hidden sm:flex text-[10px]">
                            {INTEREST_LABELS[client.interest]}
                          </Badge>
                        )}

                        <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {valCount} val.
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {visitCount} visite
                          </span>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingClient(client); setDialogOpen(true) }}>
                              <Mail className="h-4 w-4" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate('/valutazione/nuova') }}>
                              <BarChart3 className="h-4 w-4" />
                              Nuova valutazione
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate('/visite') }}>
                              <Calendar className="h-4 w-4" />
                              Nuova visita
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteId(client.id) }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  )
                })}
                </AnimatePresence>
              </Card>
            )}
          </div>

          {/* Client detail panel */}
          <div>
            {selectedClientData ? (
              <Card className="sticky top-4">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-sm">
                        {initials(`${selectedClientData.first_name} ${selectedClientData.last_name}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {selectedClientData.first_name} {selectedClientData.last_name}
                      </CardTitle>
                      <StatusBadge status={selectedClientData.status} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedClientData.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedClientData.email}`} className="text-sm text-primary hover:underline">
                        {selectedClientData.email}
                      </a>
                    </div>
                  )}
                  {selectedClientData.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedClientData.phone}`} className="text-sm">
                        {selectedClientData.phone}
                      </a>
                    </div>
                  )}

                  {selectedClientData.interest && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Interesse principale</p>
                      <Badge variant="blue">{INTEREST_LABELS[selectedClientData.interest]}</Badge>
                    </div>
                  )}

                  {selectedClientData.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Note</p>
                      <p className="text-sm text-foreground bg-muted/50 rounded-lg px-3 py-2">
                        {selectedClientData.notes}
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">
                      Valutazioni ({clientValuations.length})
                    </p>
                    {clientValuations.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nessuna valutazione associata</p>
                    ) : (
                      <div className="space-y-2">
                        {clientValuations.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => navigate(`/valutazione/${v.id}`)}
                          >
                            <div>
                              <p className="text-xs font-medium">{formatDate(v.created_at)}</p>
                              <StatusBadge status={v.status} />
                            </div>
                            {v.estimated_avg && (
                              <p className="text-xs font-bold">{(v.estimated_avg / 1000).toFixed(0)}k€</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">
                      Visite ({clientVisits.length})
                    </p>
                    {clientVisits.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nessuna visita registrata</p>
                    ) : (
                      <div className="space-y-2">
                        {clientVisits.map((v) => (
                          <div key={v.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                            <p className="text-xs font-medium">{formatDate(v.scheduled_at)}</p>
                            <StatusBadge status={v.status} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditingClient(selectedClientData); setDialogOpen(true) }}>
                      Modifica
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => navigate('/valutazione/nuova')}>
                      <BarChart3 className="h-3.5 w-3.5" />
                      Valutazione
                    </Button>
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    Cliente dal {formatDate(selectedClientData.created_at)}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Seleziona un cliente per vedere il dettaglio</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <ClientDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingClient(null) }}
        initial={editingClient ?? undefined}
        onSave={handleSave}
        loading={createClient.isPending || updateClient.isPending}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Elimina cliente
            </DialogTitle>
            <DialogDescription>
              Questa azione è irreversibile. Il cliente e tutti i dati associati verranno eliminati definitivamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annulla</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteClient.isPending}>
              {deleteClient.isPending ? 'Eliminazione...' : 'Elimina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
