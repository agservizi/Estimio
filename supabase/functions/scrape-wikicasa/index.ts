// Supabase Edge Function – scraper Wikicasa
//
// ⚠️  AVVISO LEGALE: questo scraper accede a dati pubblici di wikicasa.it.
//     L'uso potrebbe violare i Termini di Servizio del portale.
//     Usare esclusivamente per ricerca di mercato interna, mai per redistribuzione.
//     La struttura HTML/JSON può cambiare senza preavviso e richiedere aggiornamenti.
//
// Strategia: estrazione da __NEXT_DATA__ (JSON embeddato da Next.js nel <script>),
// con fallback a parsing HTML regex se la struttura cambia.
//
// Deploy: supabase functions deploy scrape-wikicasa

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Costanti ─────────────────────────────────────────────────────────────────

const BASE_URL = 'https://www.wikicasa.it'

// User-Agent realistico per evitare il blocco base (non garantisce accesso)
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Upgrade-Insecure-Requests': '1',
}

// Mapping tipo immobile → slug Wikicasa
const TYPE_SLUG: Record<string, string> = {
  appartamento: 'appartamento',
  villa: 'villa',
  villetta: 'villetta',
  attico: 'attico',
  loft: 'appartamento',
  monolocale: 'monolocale',
  bilocale: 'bilocale',
  trilocale: 'trilocale',
  quadrilocale: 'quadrilocale',
  ufficio: 'ufficio',
  negozio: 'negozio',
  box: 'box-auto',
  altro: 'appartamento',
}

// ─── Tipi interni ─────────────────────────────────────────────────────────────

interface ScrapedListing {
  id: string
  title: string
  address: string
  city: string
  zone: string | null
  price: number
  area_sqm: number
  price_per_sqm: number
  rooms: number | null
  bathrooms: number | null
  floor: number | null
  image_url: string | null
  source_url: string | null
  energy_class: string | null
}

// ─── Costruzione URL ──────────────────────────────────────────────────────────

function buildSearchUrl(params: {
  city: string
  property_type?: string
  contract_type?: string
  price_min?: number
  price_max?: number
  area_min?: number
  area_max?: number
  zone?: string
  page?: number
}): string {
  const operation = params.contract_type === 'locazione' ? 'affitto' : 'vendita'
  const typeSlug = TYPE_SLUG[params.property_type ?? 'appartamento'] ?? 'appartamento'

  // Wikicasa URL: /vendita-{tipo}/{city-slug}
  const citySlug = params.city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuove accenti
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  let path = `/${operation}-${typeSlug}/${citySlug}`

  // Aggiungi zona se presente
  if (params.zone) {
    const zoneSlug = params.zone
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    path += `/${zoneSlug}`
  }

  const qs = new URLSearchParams()
  if (params.price_min) qs.set('prezzoMin', String(params.price_min))
  if (params.price_max) qs.set('prezzoMax', String(params.price_max))
  if (params.area_min) qs.set('mqMin', String(params.area_min))
  if (params.area_max) qs.set('mqMax', String(params.area_max))
  if (params.page && params.page > 1) qs.set('pagina', String(params.page))

  const query = qs.toString()
  return `${BASE_URL}${path}${query ? '?' + query : ''}`
}

// ─── Estrazione da __NEXT_DATA__ ──────────────────────────────────────────────

function extractNextData(html: string): Record<string, unknown> | null {
  try {
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!match?.[1]) return null
    return JSON.parse(match[1]) as Record<string, unknown>
  } catch {
    return null
  }
}

// Naviga ricorsivamente l'oggetto Next.js per trovare array di annunci
function findListingsInNextData(obj: unknown, depth = 0): unknown[] | null {
  if (depth > 10 || !obj || typeof obj !== 'object') return null

  if (Array.isArray(obj)) {
    // Controlla se questo array contiene oggetti che sembrano annunci
    if (obj.length > 0 && isListingObject(obj[0])) return obj
    for (const item of obj) {
      const found = findListingsInNextData(item, depth + 1)
      if (found) return found
    }
    return null
  }

  const record = obj as Record<string, unknown>
  // Chiavi tipiche dove Wikicasa mette gli annunci
  const priorityKeys = ['listings', 'ads', 'items', 'results', 'annunci', 'properties', 'data', 'realEstates']
  for (const key of priorityKeys) {
    if (Array.isArray(record[key]) && (record[key] as unknown[]).length > 0) {
      if (isListingObject((record[key] as unknown[])[0])) return record[key] as unknown[]
    }
  }
  for (const key of Object.keys(record)) {
    const found = findListingsInNextData(record[key], depth + 1)
    if (found) return found
  }
  return null
}

function isListingObject(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
  const o = obj as Record<string, unknown>
  // Un annuncio ha sempre prezzo e superficie
  return (
    ('price' in o || 'prezzo' in o || 'prezzoRichiesto' in o) &&
    ('size' in o || 'superficie' in o || 'mq' in o || 'squareMeters' in o)
  )
}

// ─── Mapping da oggetto Wikicasa a ScrapedListing ─────────────────────────────

function mapNextDataListing(raw: Record<string, unknown>, city: string, index: number): ScrapedListing | null {
  try {
    // Wikicasa può usare campi diversi a seconda della versione del sito
    const price = Number(
      raw.price ?? raw.prezzo ?? raw.prezzoRichiesto ?? raw.totalPrice ?? 0
    )
    const area = Number(
      raw.size ?? raw.superficie ?? raw.mq ?? raw.squareMeters ?? raw.surfaceCovered ?? 0
    )

    if (price <= 0 || area <= 0) return null

    const id = String(raw.id ?? raw.annuncioId ?? raw.listingId ?? `wk-${Date.now()}-${index}`)
    const slug = String(raw.slug ?? raw.url ?? raw.permalink ?? '')
    const sourceUrl = slug ? (slug.startsWith('http') ? slug : `${BASE_URL}${slug.startsWith('/') ? '' : '/'}${slug}`) : null

    // Indirizzo
    const address = String(
      raw.address ?? raw.indirizzo ?? raw.via ??
      (raw.location as Record<string, unknown>)?.address ??
      (raw.location as Record<string, unknown>)?.indirizzo ??
      ''
    )

    // Zona / quartiere
    const zone = String(
      raw.zone ?? raw.zona ?? raw.neighborhood ?? raw.quartiere ??
      (raw.location as Record<string, unknown>)?.zone ??
      (raw.location as Record<string, unknown>)?.quartiere ??
      ''
    ) || null

    // Città
    const listingCity = String(
      raw.city ?? raw.citta ?? raw.municipality ?? raw.comune ??
      (raw.location as Record<string, unknown>)?.city ??
      city
    )

    // Caratteristiche
    const rooms = raw.rooms != null ? Number(raw.rooms) :
      raw.locali != null ? Number(raw.locali) :
      raw.numRooms != null ? Number(raw.numRooms) : null

    const bathrooms = raw.bathrooms != null ? Number(raw.bathrooms) :
      raw.bagni != null ? Number(raw.bagni) : null

    const floor = raw.floor != null ? Number(raw.floor) :
      raw.piano != null ? Number(raw.piano) : null

    // Immagine
    const image_url = String(
      raw.imageUrl ?? raw.thumbnail ?? raw.image ?? raw.foto ??
      (Array.isArray(raw.images) ? (raw.images[0] as Record<string, unknown>)?.url ?? raw.images[0] : null) ??
      (Array.isArray(raw.photos) ? (raw.photos[0] as Record<string, unknown>)?.url ?? raw.photos[0] : null) ??
      ''
    ) || null

    // Classe energetica
    const energy_class = String(
      raw.energyClass ?? raw.classeEnergetica ?? raw.energyCertification ?? ''
    ).toUpperCase().replace(/^([A-G]\d?).*/, '$1') || null

    // Titolo
    const title = String(
      raw.title ?? raw.titolo ?? raw.description ?? raw.descrizione ??
      `Annuncio ${id}`
    ).slice(0, 120)

    return {
      id,
      title,
      address,
      city: listingCity,
      zone,
      price,
      area_sqm: area,
      price_per_sqm: Math.round(price / area),
      rooms: rooms && !isNaN(rooms) ? rooms : null,
      bathrooms: bathrooms && !isNaN(bathrooms) ? bathrooms : null,
      floor: floor && !isNaN(floor) ? floor : null,
      image_url,
      source_url: sourceUrl,
      energy_class: energy_class && /^[A-G]/.test(energy_class) ? energy_class : null,
    }
  } catch {
    return null
  }
}

// ─── Fallback: parsing regex HTML ─────────────────────────────────────────────
// Usato se __NEXT_DATA__ non contiene gli annunci (e.g. lazy loading lato client)

function parseHtmlFallback(html: string, city: string): ScrapedListing[] {
  const results: ScrapedListing[] = []

  // Pattern generico per prezzi nel formato "€ 250.000" o "250000"
  const pricePattern = /["']?price["']?\s*[:=]\s*["']?([\d.]+)["']?/gi
  const areaPattern = /["']?(?:size|superficie|mq|squareMeters)["']?\s*[:=]\s*["']?([\d.]+)["']?/gi
  const idPattern = /["']?(?:id|annuncioId|listingId)["']?\s*[:=]\s*["']?(\d+)["']?/gi

  // Estrae blocchi JSON-like dall'HTML (attributi data-* o script inline)
  const jsonBlockPattern = /\{[^{}]{50,500}\}/g
  const blocks = html.match(jsonBlockPattern) ?? []

  const seen = new Set<string>()
  let blockIndex = 0

  for (const block of blocks.slice(0, 200)) {
    try {
      const obj = JSON.parse(block) as Record<string, unknown>
      if (!isListingObject(obj)) continue

      const listing = mapNextDataListing(obj, city, blockIndex++)
      if (listing && !seen.has(listing.id)) {
        seen.add(listing.id)
        results.push(listing)
      }
    } catch {
      // blocco non è JSON valido, ignorato
    }
  }

  // Se non abbiamo trovato nulla con i blocchi, proviamo con regex semplici
  if (results.length === 0) {
    const prices = [...html.matchAll(pricePattern)].map(m => Number(m[1].replace('.', '')))
    const areas = [...html.matchAll(areaPattern)].map(m => Number(m[1]))
    const ids = [...html.matchAll(idPattern)].map(m => m[1])

    const count = Math.min(prices.length, areas.length)
    for (let i = 0; i < count && i < 20; i++) {
      if (prices[i] > 10000 && areas[i] > 10) {
        const id = ids[i] ?? `wk-fallback-${i}`
        if (!seen.has(id)) {
          seen.add(id)
          results.push({
            id,
            title: `Annuncio Wikicasa ${i + 1}`,
            address: city,
            city,
            zone: null,
            price: prices[i],
            area_sqm: areas[i],
            price_per_sqm: Math.round(prices[i] / areas[i]),
            rooms: null,
            bathrooms: null,
            floor: null,
            image_url: null,
            source_url: `${BASE_URL}`,
            energy_class: null,
          })
        }
      }
    }
  }

  return results
}

// ─── Conversione a formato Comparable ─────────────────────────────────────────

function toComparable(l: ScrapedListing): Record<string, unknown> {
  return {
    id: `wk-${l.id}`,
    valuation_id: null,
    source: 'wikicasa',
    source_url: l.source_url,
    title: l.title,
    address: l.address,
    city: l.city,
    zone: l.zone,
    latitude: null,
    longitude: null,
    property_type: 'appartamento',
    price: l.price,
    area_sqm: l.area_sqm,
    price_per_sqm: l.price_per_sqm,
    condition: null,
    floor: l.floor,
    rooms: l.rooms,
    bathrooms: l.bathrooms,
    energy_class: l.energy_class,
    image_url: l.image_url,
    similarity_score: null,
    distance_km: null,
    listing_date: null,
    metadata: { scraper: 'wikicasa', scraped_at: new Date().toISOString() },
    created_at: new Date().toISOString(),
  }
}

// ─── Handler principale ───────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json() as {
      city?: string
      zone?: string
      property_type?: string
      contract_type?: string
      price_min?: number
      price_max?: number
      area_min?: number
      area_max?: number
      max_results?: number
      page?: number
    }

    if (!body.city) {
      return new Response(
        JSON.stringify({ error: 'city is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const searchUrl = buildSearchUrl({
      city: body.city,
      zone: body.zone,
      property_type: body.property_type,
      contract_type: body.contract_type,
      price_min: body.price_min,
      price_max: body.price_max,
      area_min: body.area_min,
      area_max: body.area_max,
      page: body.page ?? 1,
    })

    console.log('[wikicasa] fetching:', searchUrl)

    const response = await fetch(searchUrl, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Wikicasa fetch failed: ${response.status}`, url: searchUrl }),
        { status: response.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const html = await response.text()

    // Strategia 1: __NEXT_DATA__
    let listings: ScrapedListing[] = []
    const nextData = extractNextData(html)

    if (nextData) {
      const rawListings = findListingsInNextData(nextData)
      if (rawListings && rawListings.length > 0) {
        console.log(`[wikicasa] found ${rawListings.length} listings via __NEXT_DATA__`)
        listings = rawListings
          .map((raw, i) => mapNextDataListing(raw as Record<string, unknown>, body.city!, i))
          .filter((l): l is ScrapedListing => l !== null)
      }
    }

    // Strategia 2: fallback HTML regex
    if (listings.length === 0) {
      console.log('[wikicasa] __NEXT_DATA__ empty, trying HTML fallback')
      listings = parseHtmlFallback(html, body.city!)
    }

    // Applica filtro max_results
    const maxResults = Math.min(body.max_results ?? 30, 50)
    const result = listings.slice(0, maxResults).map(toComparable)

    console.log(`[wikicasa] returning ${result.length} comparables`)

    return new Response(
      JSON.stringify({ data: result, total: result.length, source_url: searchUrl }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[wikicasa] error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
