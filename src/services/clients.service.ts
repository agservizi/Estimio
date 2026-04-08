import { supabase, isDemoMode } from '@/lib/supabase'
import { DEMO_CLIENTS } from '@/lib/demo-data'
import type { Client } from '@/types'

export const clientsService = {
  async getAll(userId: string): Promise<Client[]> {
    if (isDemoMode) return DEMO_CLIENTS

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Client[]
  },

  async getById(id: string): Promise<Client | null> {
    if (isDemoMode) return DEMO_CLIENTS.find((c) => c.id === id) ?? null

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Client
  },

  async create(payload: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    if (isDemoMode) {
      const now = new Date().toISOString()
      return { id: crypto.randomUUID(), created_at: now, updated_at: now, ...payload }
    }

    const { data, error } = await supabase
      .from('clients')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data as Client
  },

  async update(id: string, payload: Partial<Client>): Promise<Client> {
    if (isDemoMode) {
      const existing = DEMO_CLIENTS.find((c) => c.id === id)
      const now = new Date().toISOString()
      return { ...(existing ?? {} as Client), ...payload, id, updated_at: now }
    }

    const { data, error } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Client
  },

  async delete(_id: string): Promise<void> {
    if (isDemoMode) return

    const { error } = await supabase.from('clients').delete().eq('id', _id)
    if (error) throw error
  },
}
