import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { valuationsService } from '@/services/valuations.service'
import { useAuthStore } from '@/store/auth.store'
import type { Valuation } from '@/types'

export const VALUATION_KEYS = {
  all: ['valuations'] as const,
  lists: () => [...VALUATION_KEYS.all, 'list'] as const,
  detail: (id: string) => [...VALUATION_KEYS.all, 'detail', id] as const,
}

export function useValuations() {
  const { profile } = useAuthStore()
  return useQuery({
    queryKey: VALUATION_KEYS.lists(),
    queryFn: () => valuationsService.getAll(profile!.id),
    enabled: !!profile,
    staleTime: 1000 * 60 * 2,
  })
}

export function useValuation(id: string) {
  return useQuery({
    queryKey: VALUATION_KEYS.detail(id),
    queryFn: () => valuationsService.getById(id),
    enabled: !!id,
  })
}

export function useCreateValuation() {
  const qc = useQueryClient()
  const { profile } = useAuthStore()
  return useMutation({
    mutationFn: (payload: Omit<Valuation, 'id' | 'created_at' | 'updated_at' | 'property' | 'client'>) =>
      valuationsService.create({ ...payload, user_id: profile!.id }),
    onSuccess: (newItem) => {
      qc.setQueryData<Valuation[]>(VALUATION_KEYS.lists(), (old = []) => [newItem, ...old])
    },
  })
}

export function useUpdateValuation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Valuation> & { id: string }) =>
      valuationsService.update(id, payload),
    onMutate: async ({ id, ...payload }) => {
      await qc.cancelQueries({ queryKey: VALUATION_KEYS.lists() })
      const prev = qc.getQueryData<Valuation[]>(VALUATION_KEYS.lists())
      qc.setQueryData<Valuation[]>(VALUATION_KEYS.lists(), (old = []) =>
        old.map((v) => (v.id === id ? { ...v, ...payload } : v))
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(VALUATION_KEYS.lists(), ctx.prev)
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: VALUATION_KEYS.detail(id) })
    },
  })
}

export function useDeleteValuation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => valuationsService.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: VALUATION_KEYS.lists() })
      const prev = qc.getQueryData<Valuation[]>(VALUATION_KEYS.lists())
      qc.setQueryData<Valuation[]>(VALUATION_KEYS.lists(), (old = []) => old.filter((v) => v.id !== id))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(VALUATION_KEYS.lists(), ctx.prev)
    },
  })
}
