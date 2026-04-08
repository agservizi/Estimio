import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, compact = false): string {
  if (compact && value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(2)}M`
  }
  if (compact && value >= 1_000) {
    return `€${(value / 1_000).toFixed(0)}k`
  }
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPricePerSqm(value: number): string {
  return `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 }).format(value)} €/m²`
}

export function formatArea(value: number): string {
  return `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 }).format(value)} m²`
}

export function formatDate(date: string): string {
  return format(parseISO(date), 'dd MMM yyyy', { locale: it })
}

export function formatDatetime(date: string): string {
  return format(parseISO(date), "dd MMM yyyy 'alle' HH:mm", { locale: it })
}

export function formatRelativeDate(date: string): string {
  return formatDistanceToNow(parseISO(date), { addSuffix: true, locale: it })
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

export function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâ]/g, 'a')
    .replace(/[èéê]/g, 'e')
    .replace(/[ìíî]/g, 'i')
    .replace(/[òóô]/g, 'o')
    .replace(/[ùúû]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function getConfidenceLabel(score: number): { label: string; color: string } {
  if (score >= 0.85) return { label: 'Alta', color: 'emerald' }
  if (score >= 0.65) return { label: 'Media', color: 'amber' }
  return { label: 'Bassa', color: 'red' }
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'slate',
    in_progress: 'blue',
    completed: 'emerald',
    archived: 'slate',
    active: 'emerald',
    prospect: 'blue',
    closed: 'slate',
    inactive: 'red',
    scheduled: 'blue',
    cancelled: 'red',
    no_show: 'amber',
  }
  return map[status] ?? 'slate'
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Bozza',
    in_progress: 'In corso',
    completed: 'Completata',
    archived: 'Archiviata',
    active: 'Attivo',
    prospect: 'Prospect',
    closed: 'Chiuso',
    inactive: 'Inattivo',
    scheduled: 'Pianificata',
    completed_visit: 'Effettuata',
    cancelled: 'Annullata',
    no_show: 'Non presentato',
  }
  return map[status] ?? status
}

export function getPropertyTypeLabel(type: string): string {
  const map: Record<string, string> = {
    appartamento: 'Appartamento',
    villa: 'Villa',
    villetta: 'Villetta',
    attico: 'Attico',
    loft: 'Loft',
    monolocale: 'Monolocale',
    bilocale: 'Bilocale',
    trilocale: 'Trilocale',
    quadrilocale: 'Quadrilocale',
    ufficio: 'Ufficio',
    negozio: 'Negozio',
    capannone: 'Capannone',
    terreno: 'Terreno',
    box: 'Box/Garage',
    altro: 'Altro',
  }
  return map[type] ?? type
}

export function getConditionLabel(condition: string): string {
  const map: Record<string, string> = {
    nuovo: 'Nuovo',
    ottimo: 'Ottimo',
    buono: 'Buono',
    discreto: 'Discreto',
    da_ristrutturare: 'Da ristrutturare',
    ristrutturato: 'Ristrutturato',
  }
  return map[condition] ?? condition
}

export function getEnergyClassColor(cls: string): string {
  const map: Record<string, string> = {
    A4: '#00a651',
    A3: '#2bae52',
    A2: '#57b944',
    A1: '#8dc63f',
    B: '#bfd430',
    C: '#fff200',
    D: '#ffb900',
    E: '#f7941d',
    F: '#f15a24',
    G: '#ed1c24',
  }
  return map[cls] ?? '#94a3b8'
}

export function noop() {}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}
