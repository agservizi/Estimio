import { useState, useEffect, useCallback, useRef } from 'react'

export type GeolocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'error'

export interface GeoPosition {
  latitude: number
  longitude: number
  accuracy: number
}

export interface ResolvedGeoLocation {
  city: string
  zone: string | null
  province: string | null
  country: string
  displayName: string
}

export interface UseGeolocationReturn {
  status: GeolocationStatus
  position: GeoPosition | null
  location: ResolvedGeoLocation | null
  error: string | null
  isResolving: boolean
  request: () => void
  clear: () => void
}

// ─── Reverse geocoding via Nominatim (OpenStreetMap) ─────────────────────────
// Nominatim è gratuito, non richiede API key e restituisce dati italiani accurati.
// Rate limit: 1 req/s — non chiamiamo mai in loop.

async function reverseGeocode(lat: number, lon: number): Promise<ResolvedGeoLocation> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}` +
    `&format=json&addressdetails=1&accept-language=it`

  const res = await fetch(url, {
    headers: {
      // Nominatim richiede uno User-Agent identificativo
      'User-Agent': 'SubitoStima/1.0 (app immobiliare italiana)',
      Accept: 'application/json',
    },
  })

  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)

  const data = await res.json() as {
    address?: {
      city?: string
      town?: string
      village?: string
      municipality?: string
      suburb?: string
      neighbourhood?: string
      quarter?: string
      county?: string
      state?: string
      country?: string
    }
    display_name?: string
  }

  const addr = data.address ?? {}

  const city =
    addr.city ??
    addr.town ??
    addr.village ??
    addr.municipality ??
    'Sconosciuta'

  const zone =
    addr.suburb ??
    addr.neighbourhood ??
    addr.quarter ??
    null

  const province = addr.county ?? null

  return {
    city,
    zone,
    province,
    country: addr.country ?? 'Italia',
    displayName: data.display_name ?? `${city}${zone ? ', ' + zone : ''}`,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGeolocation(): UseGeolocationReturn {
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [location, setLocation] = useState<ResolvedGeoLocation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  // Salva la posizione in sessionStorage per evitare richieste ripetute
  // durante la sessione corrente.
  const sessionKey = 'subitostima_geo_cache'

  const resolvePosition = useCallback(async (pos: GeoPosition) => {
    setIsResolving(true)
    try {
      const resolved = await reverseGeocode(pos.latitude, pos.longitude)
      setLocation(resolved)
      // Cache in sessionStorage
      sessionStorage.setItem(
        sessionKey,
        JSON.stringify({ position: pos, location: resolved, ts: Date.now() })
      )
    } catch (err) {
      console.warn('[useGeolocation] reverse geocoding fallito:', err)
      // Anche senza reverse geocoding, la posizione GPS è valida
    } finally {
      setIsResolving(false)
    }
  }, [])

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable')
      setError('Geolocalizzazione non supportata dal browser.')
      return
    }

    // Controlla cache sessione (TTL 10 minuti)
    try {
      const cached = sessionStorage.getItem(sessionKey)
      if (cached) {
        const { position: cachedPos, location: cachedLoc, ts } = JSON.parse(cached) as {
          position: GeoPosition
          location: ResolvedGeoLocation
          ts: number
        }
        if (Date.now() - ts < 10 * 60 * 1000) {
          setPosition(cachedPos)
          setLocation(cachedLoc)
          setStatus('granted')
          return
        }
      }
    } catch {
      // cache corrotta, ignora
    }

    setStatus('requesting')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const geoPos: GeoPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }
        setPosition(geoPos)
        setStatus('granted')
        await resolvePosition(geoPos)
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setStatus('denied')
            setError('Permesso di geolocalizzazione negato.')
            break
          case err.POSITION_UNAVAILABLE:
            setStatus('unavailable')
            setError('Posizione non disponibile.')
            break
          case err.TIMEOUT:
            setStatus('error')
            setError('Timeout nella richiesta di posizione.')
            break
          default:
            setStatus('error')
            setError('Errore sconosciuto di geolocalizzazione.')
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    )
  }, [resolvePosition])

  const clear = useCallback(() => {
    setStatus('idle')
    setPosition(null)
    setLocation(null)
    setError(null)
    sessionStorage.removeItem(sessionKey)
  }, [])

  // Ripristina dalla cache sessione al mount, senza richiedere il permesso
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(sessionKey)
      if (cached) {
        const { position: cachedPos, location: cachedLoc, ts } = JSON.parse(cached) as {
          position: GeoPosition
          location: ResolvedGeoLocation
          ts: number
        }
        if (Date.now() - ts < 10 * 60 * 1000) {
          setPosition(cachedPos)
          setLocation(cachedLoc)
          setStatus('granted')
        }
      }
    } catch {
      // ignora
    }
  }, [])

  return { status, position, location, error, isResolving, request, clear }
}

// ─── Distanza Haversine in km ─────────────────────────────────────────────────
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
