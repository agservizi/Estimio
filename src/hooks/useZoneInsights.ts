import { useQuery } from '@tanstack/react-query'
import { zoneService } from '@/services/zone.service'

export const ZONE_KEYS = {
  all: ['zones'] as const,
  byCity: (city: string) => [...ZONE_KEYS.all, city] as const,
  byZone: (city: string, zone: string) => [...ZONE_KEYS.all, city, zone] as const,
}

export function useZoneInsightsByCity(city: string) {
  return useQuery({
    queryKey: ZONE_KEYS.byCity(city),
    queryFn: () => zoneService.getByCity(city),
    enabled: !!city,
    staleTime: 1000 * 60 * 10,
  })
}

export function useAllZoneInsights() {
  return useQuery({
    queryKey: ZONE_KEYS.all,
    queryFn: () => zoneService.getAll(),
    staleTime: 1000 * 60 * 10,
  })
}
