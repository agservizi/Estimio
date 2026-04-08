import { supabase, isDemoMode } from '@/lib/supabase'
import { DEMO_ZONE_INSIGHTS } from '@/lib/demo-data'
import { fetchOMIZones } from '@/services/external/comparables-api.service'
import type { ZoneInsight } from '@/types'

export const zoneService = {
  async getByCity(city: string): Promise<ZoneInsight[]> {
    if (isDemoMode) return DEMO_ZONE_INSIGHTS.filter((z) => z.city === city)

    // PROD: dati ufficiali OMI via Edge Function, con fallback su Supabase
    try {
      const omiData = await fetchOMIZones(city)
      if (omiData.length > 0) {
        // Cache su Supabase (upsert silenzioso)
        supabase
          .from('zone_insights')
          .upsert(omiData, { onConflict: 'id', ignoreDuplicates: true })
          .then(({ error }) => {
            if (error) console.warn('[zone cache] upsert error:', error.message)
          })
        return omiData
      }
    } catch (err) {
      console.warn('[zone service] OMI fetch failed, falling back to Supabase cache:', err)
    }

    const { data, error } = await supabase
      .from('zone_insights')
      .select('*')
      .ilike('city', `%${city}%`)
      .order('avg_price_sqm', { ascending: false })

    if (error) throw error
    return data as ZoneInsight[]
  },

  async getByZone(city: string, zone: string): Promise<ZoneInsight[]> {
    if (isDemoMode) {
      return DEMO_ZONE_INSIGHTS.filter(
        (z) => z.city === city && z.zone.toLowerCase().includes(zone.toLowerCase())
      )
    }

    const { data, error } = await supabase
      .from('zone_insights')
      .select('*')
      .ilike('city', `%${city}%`)
      .ilike('zone', `%${zone}%`)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data as ZoneInsight[]
  },

  async getAll(): Promise<ZoneInsight[]> {
    if (isDemoMode) return DEMO_ZONE_INSIGHTS

    const { data, error } = await supabase
      .from('zone_insights')
      .select('*')
      .order('trend_delta', { ascending: false })

    if (error) throw error
    return data as ZoneInsight[]
  },
}
