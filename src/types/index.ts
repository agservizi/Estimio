// ─── Auth & Profile ───────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'agent' | 'collaborator' | 'viewer'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  agency_name: string | null
  avatar_url: string | null
  created_at: string
}

// ─── Client ───────────────────────────────────────────────────────────────────

export type ClientStatus = 'prospect' | 'active' | 'closed' | 'inactive'
export type ClientInterest = 'acquisto' | 'vendita' | 'locazione' | 'investimento' | 'altro'

export interface Client {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  status: ClientStatus
  interest: ClientInterest | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ─── Property ─────────────────────────────────────────────────────────────────

export type PropertyType =
  | 'appartamento'
  | 'villa'
  | 'villetta'
  | 'attico'
  | 'loft'
  | 'monolocale'
  | 'bilocale'
  | 'trilocale'
  | 'quadrilocale'
  | 'ufficio'
  | 'negozio'
  | 'capannone'
  | 'terreno'
  | 'box'
  | 'altro'

export type ContractType = 'vendita' | 'locazione' | 'asta'

export type PropertyCondition =
  | 'nuovo'
  | 'ottimo'
  | 'buono'
  | 'discreto'
  | 'da_ristrutturare'
  | 'ristrutturato'

export type EnergyClass = 'A4' | 'A3' | 'A2' | 'A1' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export type HeatingType = 'autonomo' | 'centralizzato' | 'teleriscaldamento' | 'assente'

export interface Property {
  id: string
  user_id: string
  client_id: string | null
  type: PropertyType
  contract_type: ContractType
  address: string
  city: string
  postal_code: string
  province: string
  zone: string | null
  microzone: string | null
  latitude: number | null
  longitude: number | null
  commercial_area: number
  usable_area: number | null
  rooms: number | null
  bathrooms: number | null
  floor: number | null
  total_floors: number | null
  elevator: boolean
  condition: PropertyCondition
  build_year: number | null
  renovated_year: number | null
  exposure: string | null
  balcony: boolean
  terrace: boolean
  garden: boolean
  garage: boolean
  parking_space: boolean
  cellar: boolean
  energy_class: EnergyClass | null
  heating_type: HeatingType | null
  condo_fees: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ─── Valuation ────────────────────────────────────────────────────────────────

export type ValuationStatus = 'draft' | 'in_progress' | 'completed' | 'archived'

export interface Valuation {
  id: string
  user_id: string
  property_id: string
  client_id: string | null
  status: ValuationStatus
  estimated_min: number | null
  estimated_avg: number | null
  estimated_max: number | null
  suggested_listing_price: number | null
  confidence_score: number | null
  valuation_notes: string | null
  created_at: string
  updated_at: string
  property?: Property
  client?: Client
}

// ─── Comparable ───────────────────────────────────────────────────────────────

export type ComparableSource = 'idealista' | 'immobiliare.it' | 'casa.it' | 'wikicasa' | 'agenzia' | 'omi' | 'altro'

export interface Comparable {
  id: string
  valuation_id: string | null
  source: ComparableSource
  source_url: string | null
  title: string
  address: string
  city: string
  zone: string | null
  latitude: number | null
  longitude: number | null
  property_type: PropertyType
  price: number
  area_sqm: number
  price_per_sqm: number
  condition: PropertyCondition | null
  floor: number | null
  rooms: number | null
  bathrooms: number | null
  energy_class: EnergyClass | null
  image_url: string | null
  similarity_score: number | null
  distance_km: number | null
  listing_date: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  is_favorite?: boolean
  is_selected?: boolean
}

// ─── Visit ────────────────────────────────────────────────────────────────────

export type VisitStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export interface Visit {
  id: string
  user_id: string
  property_id: string
  client_id: string | null
  scheduled_at: string
  status: VisitStatus
  feedback: string | null
  notes: string | null
  created_at: string
  property?: Property
  client?: Client
}

// ─── Report ───────────────────────────────────────────────────────────────────

export type ReportType = 'valuation' | 'zone' | 'comparable' | 'summary'

export interface Report {
  id: string
  user_id: string
  valuation_id: string | null
  property_id: string | null
  client_id: string | null
  file_path: string | null
  report_type: ReportType
  created_at: string
  valuation?: Valuation
  property?: Property
  client?: Client
}

// ─── Zone Insight ─────────────────────────────────────────────────────────────

export interface ZoneInsight {
  id: string
  city: string
  zone: string
  microzone: string | null
  avg_price_sqm: number
  min_price_sqm: number
  max_price_sqm: number
  listings_count: number
  sold_count: number
  rent_count: number
  trend_delta: number
  period_label: string
  metadata: Record<string, unknown> | null
  updated_at: string
}

// ─── Favorite ─────────────────────────────────────────────────────────────────

export interface Favorite {
  id: string
  user_id: string
  comparable_id: string
  created_at: string
}

// ─── Saved Search ─────────────────────────────────────────────────────────────

export interface SavedSearch {
  id: string
  user_id: string
  name: string
  filters: ComparableFilters
  created_at: string
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface ComparableFilters {
  query?: string
  city?: string
  zone?: string
  property_type?: PropertyType
  condition?: PropertyCondition
  price_min?: number
  price_max?: number
  area_min?: number
  area_max?: number
  floor_min?: number
  floor_max?: number
  distance_max?: number
  source?: ComparableSource
  date_from?: string
  energy_class?: EnergyClass
  has_garage?: boolean
  has_elevator?: boolean
}

// ─── KPI ──────────────────────────────────────────────────────────────────────

export interface DashboardKPI {
  valuations_this_month: number
  avg_estimated_value: number
  properties_analyzed: number
  comparables_found: number
  reports_generated: number
  visits_registered: number
  valuations_change: number
  avg_value_change: number
}

// ─── Valuation Algorithm ──────────────────────────────────────────────────────

export interface ValuationResult {
  estimated_min: number
  estimated_avg: number
  estimated_max: number
  suggested_listing_price: number
  confidence_score: number
  price_per_sqm: number
  comparables_used: number
  notes: string[]
}

// ─── UI ───────────────────────────────────────────────────────────────────────

export type ViewMode = 'table' | 'card' | 'map'

export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
  children?: NavItem[]
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  created_at: string
}

export interface SearchResult {
  type: 'client' | 'property' | 'valuation' | 'comparable' | 'report'
  id: string
  title: string
  subtitle: string
  href: string
}
