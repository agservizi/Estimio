import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { comparablesService } from '@/services/comparables.service'
import { useAuthStore } from '@/store/auth.store'
import type { ComparableFilters } from '@/types'

export const COMPARABLE_KEYS = {
  all: ['comparables'] as const,
  search: (filters: ComparableFilters) => [...COMPARABLE_KEYS.all, 'search', filters] as const,
  byValuation: (id: string) => [...COMPARABLE_KEYS.all, 'valuation', id] as const,
  favorites: (userId: string) => [...COMPARABLE_KEYS.all, 'favorites', userId] as const,
}

export function useComparableSearch(filters: ComparableFilters) {
  return useQuery({
    queryKey: COMPARABLE_KEYS.search(filters),
    queryFn: () => comparablesService.search(filters),
    staleTime: 1000 * 60 * 5,
  })
}

export function useComparablesByValuation(valuationId: string) {
  return useQuery({
    queryKey: COMPARABLE_KEYS.byValuation(valuationId),
    queryFn: () => comparablesService.getByValuation(valuationId),
    enabled: !!valuationId,
  })
}

export function useFavoriteIds() {
  const { profile } = useAuthStore()
  return useQuery({
    queryKey: COMPARABLE_KEYS.favorites(profile?.id ?? ''),
    queryFn: () => comparablesService.getFavoriteIds(profile!.id),
    enabled: !!profile,
    staleTime: 1000 * 60 * 5,
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  const { profile } = useAuthStore()

  return useMutation({
    mutationFn: ({ comparableId, isFav }: { comparableId: string; isFav: boolean }) =>
      isFav
        ? comparablesService.removeFavorite(profile!.id, comparableId)
        : comparablesService.addFavorite(profile!.id, comparableId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COMPARABLE_KEYS.favorites(profile?.id ?? '') })
    },
  })
}
