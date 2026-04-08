import { supabase, isDemoMode } from '@/lib/supabase'
import { DEMO_COMPARABLES } from '@/lib/demo-data'
import { searchComparablesFromAPI } from '@/services/external/comparables-api.service'
import type { Comparable, ComparableFilters } from '@/types'

export const comparablesService = {
  async search(filters: ComparableFilters): Promise<Comparable[]> {
    // ── DEV: dati demo locali ─────────────────────────────────────────────────
    if (isDemoMode) {
      let results = [...DEMO_COMPARABLES]

      if (filters.query) {
        const q = filters.query.toLowerCase()
        results = results.filter(
          (c) =>
            c.address.toLowerCase().includes(q) ||
            c.city.toLowerCase().includes(q) ||
            c.zone?.toLowerCase().includes(q)
        )
      }
      if (filters.city) results = results.filter((c) => c.city.toLowerCase() === filters.city!.toLowerCase())
      if (filters.zone) results = results.filter((c) => c.zone?.toLowerCase().includes(filters.zone!.toLowerCase()))
      if (filters.property_type) results = results.filter((c) => c.property_type === filters.property_type)
      if (filters.price_min) results = results.filter((c) => c.price >= filters.price_min!)
      if (filters.price_max) results = results.filter((c) => c.price <= filters.price_max!)
      if (filters.area_min) results = results.filter((c) => c.area_sqm >= filters.area_min!)
      if (filters.area_max) results = results.filter((c) => c.area_sqm <= filters.area_max!)
      if (filters.source) results = results.filter((c) => c.source === filters.source)

      return results
    }

    // ── PROD: Idealista via Edge Function (dati reali di mercato) ─────────────
    // I risultati vengono anche salvati su Supabase come cache locale.
    const apiResults = await searchComparablesFromAPI(filters)

    if (apiResults.length > 0) {
      // Upsert silenzioso: salva i comparabili ricevuti nel DB locale per
      // permettere ricerche successive su Supabase e allegare ai report.
      // Non blocca: gli errori di upsert sono ignorati per non interrompere l'UX.
      supabase
        .from('comparables')
        .upsert(
          apiResults.map(({ is_favorite: _f, is_selected: _s, ...c }) => c),
          { onConflict: 'id', ignoreDuplicates: true }
        )
        .then(({ error }) => {
          if (error) console.warn('[comparables cache] upsert error:', error.message)
        })

      return apiResults
    }

    // Fallback: se Idealista non risponde, leggi dalla cache Supabase
    let query = supabase.from('comparables').select('*')

    if (filters.query) {
      query = query.or(`address.ilike.%${filters.query}%,city.ilike.%${filters.query}%,zone.ilike.%${filters.query}%`)
    }
    if (filters.city) query = query.ilike('city', `%${filters.city}%`)
    if (filters.zone) query = query.ilike('zone', `%${filters.zone}%`)
    if (filters.property_type) query = query.eq('property_type', filters.property_type)
    if (filters.price_min) query = query.gte('price', filters.price_min)
    if (filters.price_max) query = query.lte('price', filters.price_max)
    if (filters.area_min) query = query.gte('area_sqm', filters.area_min)
    if (filters.area_max) query = query.lte('area_sqm', filters.area_max)
    if (filters.source) query = query.eq('source', filters.source)

    query = query.order('similarity_score', { ascending: false }).limit(50)

    const { data, error } = await query
    if (error) throw error
    return data as Comparable[]
  },

  async getByValuation(valuationId: string): Promise<Comparable[]> {
    if (isDemoMode) return DEMO_COMPARABLES.filter((c) => c.valuation_id === valuationId)

    const { data, error } = await supabase
      .from('comparables')
      .select('*')
      .eq('valuation_id', valuationId)
      .order('similarity_score', { ascending: false })

    if (error) throw error
    return data as Comparable[]
  },

  async addFavorite(userId: string, comparableId: string): Promise<void> {
    if (isDemoMode) return
    const { error } = await supabase.from('favorites').upsert({ user_id: userId, comparable_id: comparableId })
    if (error) throw error
  },

  async removeFavorite(userId: string, comparableId: string): Promise<void> {
    if (isDemoMode) return
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('comparable_id', comparableId)
    if (error) throw error
  },

  async getFavoriteIds(userId: string): Promise<string[]> {
    if (isDemoMode) return []
    const { data, error } = await supabase
      .from('favorites')
      .select('comparable_id')
      .eq('user_id', userId)
    if (error) throw error
    return (data ?? []).map((f: { comparable_id: string }) => f.comparable_id)
  },
}
