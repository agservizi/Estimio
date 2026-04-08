import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsService } from '@/services/clients.service'
import { useAuthStore } from '@/store/auth.store'
import type { Client } from '@/types'

export const CLIENT_KEYS = {
  all: ['clients'] as const,
  lists: () => [...CLIENT_KEYS.all, 'list'] as const,
  detail: (id: string) => [...CLIENT_KEYS.all, 'detail', id] as const,
}

export function useClients() {
  const { profile } = useAuthStore()
  return useQuery({
    queryKey: CLIENT_KEYS.lists(),
    queryFn: () => clientsService.getAll(profile!.id),
    enabled: !!profile,
    staleTime: 1000 * 60 * 2,
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: CLIENT_KEYS.detail(id),
    queryFn: () => clientsService.getById(id),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  const { profile } = useAuthStore()
  return useMutation({
    mutationFn: (payload: Omit<Client, 'id' | 'created_at' | 'updated_at'>) =>
      clientsService.create({ ...payload, user_id: profile!.id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENT_KEYS.lists() }),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Client> & { id: string }) =>
      clientsService.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: CLIENT_KEYS.lists() })
      qc.invalidateQueries({ queryKey: CLIENT_KEYS.detail(id) })
    },
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clientsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENT_KEYS.lists() }),
  })
}
