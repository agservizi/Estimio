import { supabase, isDemoMode } from '@/lib/supabase'
import { DEMO_VISITS, DEMO_PROPERTIES, DEMO_CLIENTS } from '@/lib/demo-data'
import type { Visit, VisitStatus } from '@/types'

type VisitWithRelations = Visit & {
  property?: { id: string; address: string; city: string; zone?: string | null } | undefined
  client?: { id: string; first_name: string; last_name: string } | undefined
}

export const visitsService = {
  async getAll(userId: string): Promise<VisitWithRelations[]> {
    if (isDemoMode) {
      return DEMO_VISITS.map((v) => ({
        ...v,
        property: DEMO_PROPERTIES.find((p) => p.id === v.property_id),
        client: DEMO_CLIENTS.find((c) => c.id === v.client_id),
      }))
    }

    const { data, error } = await supabase
      .from('visits')
      .select('*, property:properties(id, address, city, zone), client:clients(id, first_name, last_name)')
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: true })

    if (error) throw error
    return data as VisitWithRelations[]
  },

  async create(payload: Omit<Visit, 'id' | 'created_at'>): Promise<Visit> {
    if (isDemoMode) {
      const now = new Date().toISOString()
      return { id: crypto.randomUUID(), created_at: now, ...payload }
    }

    const { data, error } = await supabase
      .from('visits')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data as Visit
  },

  async updateStatus(id: string, status: VisitStatus): Promise<Visit> {
    if (isDemoMode) {
      const existing = DEMO_VISITS.find((v) => v.id === id)
      return { ...(existing ?? {} as Visit), id, status }
    }

    const { data, error } = await supabase
      .from('visits')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Visit
  },

  async delete(_id: string): Promise<void> {
    if (isDemoMode) return

    const { error } = await supabase.from('visits').delete().eq('id', _id)
    if (error) throw error
  },
}
