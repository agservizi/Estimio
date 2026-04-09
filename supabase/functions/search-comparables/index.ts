// Supabase Edge Function – proxy sicuro verso Idealista Search API
// Le credenziali Idealista rimangono server-side e non sono mai esposte al browser.
//
// Deploy: supabase functions deploy search-comparables
// Secrets: supabase secrets set IDEALISTA_API_KEY=xxx IDEALISTA_SECRET=yyy

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Idealista type maps ──────────────────────────────────────────────────────

const OPERATION_MAP: Record<string, string> = {
  vendita: 'sale',
  locazione: 'rent',
  asta: 'sale',
}

const TYPE_MAP: Record<string, string> = {
  appartamento: 'homes',
  villa: 'homes',
  villetta: 'homes',
  attico: 'homes',
  loft: 'homes',
  monolocale: 'homes',
  bilocale: 'homes',
  trilocale: 'homes',
  quadrilocale: 'homes',
  ufficio: 'offices',
  negozio: 'premises',
  capannone: 'warehouses',
  terreno: 'land',
  box: 'garages',
  altro: 'homes',
}

// ─── Get OAuth2 token from Idealista ─────────────────────────────────────────

async function getIdealistaToken(apiKey: string, secret: string): Promise<string> {
  const credentials = btoa(`${apiKey}:${secret}`)

  const res = await fetch('https://api.idealista.com/oauth/accesstoken', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=read',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Idealista auth failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data.access_token as string
}

// ─── Map Idealista element to Comparable ─────────────────────────────────────

function mapElement(el: Record<string, unknown>, contractType: string): Record<string, unknown> {
  const price = Number(el.price ?? 0)
  const area = Number(el.size ?? 0)
  return {
    id: String(el.propertyCode ?? crypto.randomUUID()),
    valuation_id: null,
    source: 'idealista',
    source_url: el.url ? `https://www.idealista.com${el.url}` : null,
    title: el.suggestedTexts
      ? (el.suggestedTexts as Record<string, string>).title ?? ''
      : String(el.propertyType ?? ''),
    address: String(el.address ?? ''),
    city: String(el.municipality ?? ''),
    zone: String(el.neighborhood ?? el.district ?? ''),
    latitude: Number(el.latitude ?? null) || null,
    longitude: Number(el.longitude ?? null) || null,
    property_type: 'appartamento',
    price,
    area_sqm: area,
    price_per_sqm: area > 0 ? Math.round(price / area) : 0,
    condition: null,
    floor: el.floor != null ? Number(el.floor) : null,
    rooms: el.rooms != null ? Number(el.rooms) : null,
    bathrooms: el.bathrooms != null ? Number(el.bathrooms) : null,
    energy_class: el.energyCertification
      ? String((el.energyCertification as Record<string, string>).rating ?? '').toUpperCase() || null
      : null,
    image_url: el.thumbnail ? String(el.thumbnail) : null,
    similarity_score: null,
    distance_km: null,
    listing_date: null,
    metadata: { contract_type: contractType, raw: el },
    created_at: new Date().toISOString(),
  }
}

// ─── Lookup Idealista location ID from a city name ───────────────────────────
// Idealista search requires a specific location code, not a plain city name.
// This resolves e.g. "Roma" → "0-EU-IT-RM-RM-0" via the locations endpoint.

async function lookupLocationId(
  city: string,
  token: string,
  country = 'it',
): Promise<string | null> {
  try {
    const url = `https://api.idealista.com/3.5/${country}/locations?text=${encodeURIComponent(city)}&type=city`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return null
    const data = await res.json() as { locationList?: Array<{ locationId: string; name: string }> }
    return data.locationList?.[0]?.locationId ?? null
  } catch {
    return null
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const apiKey = Deno.env.get('IDEALISTA_API_KEY')
    const secret = Deno.env.get('IDEALISTA_SECRET')

    if (!apiKey || !secret) {
      return new Response(
        JSON.stringify({ error: 'Idealista credentials not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json() as {
      city?: string
      zone?: string
      property_type?: string
      contract_type?: string
      price_min?: number
      price_max?: number
      area_min?: number
      area_max?: number
      rooms_min?: number
      max_results?: number
    }

    const operation = OPERATION_MAP[body.contract_type ?? 'vendita'] ?? 'sale'
    const propertyType = TYPE_MAP[body.property_type ?? 'appartamento'] ?? 'homes'
    const country = 'it'

    // Get OAuth token
    const token = await getIdealistaToken(apiKey, secret)

    // Resolve city name → Idealista location ID
    // The API requires a specific code; a plain city name would return no results.
    const locationId = body.city ? await lookupLocationId(body.city, token, country) : null

    // Build Idealista search params
    const params = new URLSearchParams()
    params.set('operation', operation)
    params.set('propertyType', propertyType)
    params.set('locale', 'it')
    params.set('maxItems', String(Math.min(body.max_results ?? 50, 50)))
    params.set('numPage', '1')
    params.set('order', 'relevance')
    params.set('sort', 'desc')

    if (locationId) {
      params.set('locationId', locationId)
    } else if (body.city) {
      // Fallback: Idealista may accept free-text location in some versions
      params.set('locationText', body.city)
    }
    if (body.price_min) params.set('minPrice', String(body.price_min))
    if (body.price_max) params.set('maxPrice', String(body.price_max))
    if (body.area_min) params.set('minSize', String(body.area_min))
    if (body.area_max) params.set('maxSize', String(body.area_max))
    if (body.rooms_min) params.set('minRooms', String(body.rooms_min))

    const url = `https://api.idealista.com/3.5/${country}/search?${params.toString()}`

    const searchRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (!searchRes.ok) {
      const text = await searchRes.text()
      return new Response(
        JSON.stringify({ error: `Idealista search failed: ${searchRes.status}`, detail: text }),
        { status: searchRes.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const data = await searchRes.json() as { elementList?: Record<string, unknown>[] }
    const elements = data.elementList ?? []
    const comparables = elements.map((el) => mapElement(el, body.contract_type ?? 'vendita'))

    return new Response(JSON.stringify({ data: comparables, total: comparables.length }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
