import { supabase, isDemoMode } from '@/lib/supabase'
import { DEMO_VALUATIONS, DEMO_PROPERTIES, DEMO_CLIENTS } from '@/lib/demo-data'
import type { Valuation } from '@/types'

export const valuationsService = {
  async getAll(userId: string): Promise<Valuation[]> {
    if (isDemoMode) {
      return DEMO_VALUATIONS.map((v) => ({
        ...v,
        property: DEMO_PROPERTIES.find((p) => p.id === v.property_id),
        client: DEMO_CLIENTS.find((c) => c.id === v.client_id),
      }))
    }

    const { data, error } = await supabase
      .from('valuations')
      .select(`
        *,
        property:properties(*),
        client:clients(*)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data as Valuation[]
  },

  async getById(id: string): Promise<Valuation | null> {
    if (isDemoMode) {
      const v = DEMO_VALUATIONS.find((v) => v.id === id)
      if (!v) return null
      return {
        ...v,
        property: DEMO_PROPERTIES.find((p) => p.id === v.property_id),
        client: DEMO_CLIENTS.find((c) => c.id === v.client_id),
      }
    }

    const { data, error } = await supabase
      .from('valuations')
      .select(`*, property:properties(*), client:clients(*)`)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Valuation
  },

  async create(payload: Omit<Valuation, 'id' | 'created_at' | 'updated_at' | 'property' | 'client'>): Promise<Valuation> {
    if (isDemoMode) {
      const now = new Date().toISOString()
      return {
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
        ...payload,
        property: DEMO_PROPERTIES.find((p) => p.id === payload.property_id),
        client: DEMO_CLIENTS.find((c) => c.id === payload.client_id),
      }
    }

    const { data, error } = await supabase
      .from('valuations')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data as Valuation
  },

  async update(id: string, payload: Partial<Valuation>): Promise<Valuation> {
    if (isDemoMode) {
      const existing = DEMO_VALUATIONS.find((v) => v.id === id)
      const { property: _p, client: _c, ...rest } = payload
      const now = new Date().toISOString()
      return {
        ...(existing ?? {} as Valuation),
        ...rest,
        id,
        updated_at: now,
        property: DEMO_PROPERTIES.find((p) => p.id === (rest.property_id ?? existing?.property_id)),
        client: DEMO_CLIENTS.find((c) => c.id === (rest.client_id ?? existing?.client_id)),
      }
    }

    const { property: _p, client: _c, ...rest } = payload
    const { data, error } = await supabase
      .from('valuations')
      .update(rest)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Valuation
  },

  async delete(_id: string): Promise<void> {
    if (isDemoMode) return
    const { error } = await supabase.from('valuations').delete().eq('id', _id)
    if (error) throw error
  },
}
