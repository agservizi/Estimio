import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { visitsService } from '@/services/visits.service'
import type { Visit, VisitStatus } from '@/types'

const VISITS_KEY = 'visits'

export function useVisits() {
  const userId = useAuthStore((s) => s.profile?.id ?? 'demo-user-001')
  return useQuery({
    queryKey: [VISITS_KEY, userId],
    queryFn: () => visitsService.getAll(userId),
  })
}

export function useCreateVisit() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.profile?.id ?? 'demo-user-001')

  return useMutation({
    mutationFn: (payload: Omit<Visit, 'id' | 'created_at'>) =>
      visitsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [VISITS_KEY, userId] })
    },
  })
}

export function useUpdateVisitStatus() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.profile?.id ?? 'demo-user-001')

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: VisitStatus }) =>
      visitsService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: [VISITS_KEY, userId] })
      const previous = qc.getQueryData([VISITS_KEY, userId])
      qc.setQueryData([VISITS_KEY, userId], (old: Visit[] | undefined) =>
        old?.map((v) => (v.id === id ? { ...v, status } : v)) ?? []
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData([VISITS_KEY, userId], ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [VISITS_KEY, userId] })
    },
  })
}

export function useDeleteVisit() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.profile?.id ?? 'demo-user-001')

  return useMutation({
    mutationFn: (id: string) => visitsService.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [VISITS_KEY, userId] })
      const previous = qc.getQueryData([VISITS_KEY, userId])
      qc.setQueryData([VISITS_KEY, userId], (old: Visit[] | undefined) =>
        old?.filter((v) => v.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData([VISITS_KEY, userId], ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [VISITS_KEY, userId] })
    },
  })
}
