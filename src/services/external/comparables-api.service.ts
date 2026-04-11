// Frontend service che invoca le Supabase Edge Functions come proxy sicuro.
// Le Edge Functions gestiscono l'autenticazione verso Idealista e OMI
// così le credenziali non sono mai esposte nel bundle del browser.

import { supabase, isDemoMode } from '@/lib/supabase'
import type { Comparable, ComparableFilters, ZoneInsight } from '@/types'
import { DEMO_WIKICASA_COMPARABLES } from '@/lib/demo-data'

// ─── Idealista via Edge Function ─────────────────────────────────────────────

export async function searchComparablesFromAPI(
  filters: ComparableFilters
): Promise<Comparable[]> {
  // Wikicasa: route alla Edge Function dedicata allo scraper
  if (filters.source === 'wikicasa') {
    return scrapeWikicasaComparables(filters)
  }

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
    return []
  }

  return results
}

// ─── Wikicasa via Edge Function scraper ───────────────────────────────────────
//
// Invoca la Edge Function scrape-wikicasa che esegue il fetch server-side
// (niente CORS, IP del server Edge, headers browser-like).
// Il risultato è già mappato al tipo Comparable.

export async function scrapeWikicasaComparables(
  filters: ComparableFilters
): Promise<Comparable[]> {
  // In dev chiama il middleware Vite locale (/api/scrape-wikicasa),
  // in prod chiama la Supabase Edge Function.
  if (isDemoMode) {
    try {
      const res = await fetch('/api/scrape-wikicasa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: filters.city,
          zone: filters.zone,
          property_type: filters.property_type,
          contract_type: 'vendita',
          price_min: filters.price_min,
          price_max: filters.price_max,
          area_min: filters.area_min,
          area_max: filters.area_max,
          max_results: 30,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json() as { data: Comparable[]; total: number }
      let results = result.data ?? []
      if (filters.query) {
        const q = filters.query.toLowerCase()
        results = results.filter(
          (c) => c.title.toLowerCase().includes(q) ||
                 c.address.toLowerCase().includes(q) ||
                 c.zone?.toLowerCase().includes(q)
        )
      }
      return results
    } catch (err) {
      console.warn('[wikicasa dev] scraper non raggiungibile, uso mock:', err)
      // Fallback ai mock statici se il plugin non è attivo
      let results = [...DEMO_WIKICASA_COMPARABLES]
      if (filters.city) results = results.filter((c) => c.city.toLowerCase().includes(filters.city!.toLowerCase()))
      if (filters.zone) results = results.filter((c) => c.zone?.toLowerCase().includes(filters.zone!.toLowerCase()))
      return results
    }
  }

  const { data, error } = await supabase.functions.invoke('scrape-wikicasa', {
    body: {
      city: filters.city,
      zone: filters.zone,
      property_type: filters.property_type,
      contract_type: 'vendita',
      price_min: filters.price_min,
      price_max: filters.price_max,
      area_min: filters.area_min,
      area_max: filters.area_max,
      max_results: 30,
    },
  })

  if (error) throw new Error(`Wikicasa scraper error: ${error.message}`)

  const result = data as { data: Comparable[]; total: number; source_url?: string } | null
  if (!result?.data) return []

  // Filtro testuale client-side
  if (filters.query) {
    const q = filters.query.toLowerCase()
    return result.data.filter(
      (c) =>
        c.address.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.zone?.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q)
    )
  }

  return result.data
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
