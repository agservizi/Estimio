import { supabase, isDemoMode } from '@/lib/supabase'
import { DEMO_PROPERTIES } from '@/lib/demo-data'
import type { Property } from '@/types'

export const propertiesService = {
  async getAll(userId: string): Promise<Property[]> {
    if (isDemoMode) return DEMO_PROPERTIES

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Property[]
  },

  async getById(id: string): Promise<Property | null> {
    if (isDemoMode) return DEMO_PROPERTIES.find((p) => p.id === id) ?? null

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Property
  },

  async create(payload: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<Property> {
    if (isDemoMode) {
      const now = new Date().toISOString()
      return { id: crypto.randomUUID(), created_at: now, updated_at: now, ...payload }
    }

    const { data, error } = await supabase
      .from('properties')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data as Property
  },

  async update(id: string, payload: Partial<Property>): Promise<Property> {
    if (isDemoMode) {
      const existing = DEMO_PROPERTIES.find((p) => p.id === id)
      const now = new Date().toISOString()
      return { ...(existing ?? {} as Property), ...payload, id, updated_at: now }
    }

    const { data, error } = await supabase
      .from('properties')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Property
  },
}
