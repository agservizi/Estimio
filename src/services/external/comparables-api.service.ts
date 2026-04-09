// Frontend service che invoca le Supabase Edge Functions come proxy sicuro.
// Le Edge Functions gestiscono l'autenticazione verso Idealista e OMI
// così le credenziali non sono mai esposte nel bundle del browser.

import { supabase } from '@/lib/supabase'
import type { Comparable, ComparableFilters, ZoneInsight } from '@/types'

// ─── Idealista via Edge Function ─────────────────────────────────────────────

export async function searchComparablesFromAPI(
  filters: ComparableFilters
): Promise<Comparable[]> {
  const { data, error } = await supabase.functions.invoke('search-comparables', {
    body: {
      city: filters.city,
      zone: filters.zone,
      property_type: filters.property_type,
      contract_type: 'vendita',
      price_min: filters.price_min,
      price_max: filters.price_max,
      area_min: filters.area_min,
      area_max: filters.area_max,
      max_results: 50,
    },
  })

  if (error) throw new Error(`Edge function error: ${error.message}`)

  const result = data as { data: Comparable[]; total: number } | null
  if (!result?.data) return []

  // Applica filtri testuali client-side se passati
  let results = result.data
  if (filters.query) {
    const q = filters.query.toLowerCase()
    results = results.filter(
      (c) =>
        c.address.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.zone?.toLowerCase().includes(q)
    )
  }
  if (filters.source && filters.source !== 'idealista') {
    // Fonte specifica diversa da Idealista: non chiamiamo l'API, lasciamo
    // che il chiamante cada nel fallback Supabase.
    return []
  }

  return results
}

// ─── OMI zone data via Edge Function ─────────────────────────────────────────

export async function fetchOMIZones(city: string): Promise<ZoneInsight[]> {
  const { data, error } = await supabase.functions.invoke('omi-zones', {
    body: { city },
  })

  if (error) throw new Error(`OMI edge function error: ${error.message}`)

  const result = data as { data: ZoneInsight[]; total: number; warning?: string } | null

  if (result?.warning) {
    console.warn('[OMI]', result.warning)
  }

  return result?.data ?? []
}
