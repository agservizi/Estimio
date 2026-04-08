// Supabase Edge Function – proxy verso i dati OMI (Agenzia delle Entrate)
// OMI = Osservatorio del Mercato Immobiliare
// Endpoint pubblico senza autenticazione, ma chiamato server-side per
// evitare CORS e per poter cachare/normalizzare le risposte.
//
// Deploy: supabase functions deploy omi-zones

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// OMI API base – dati aggiornati semestralmente
// Documentazione: https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/omi
const OMI_BASE = 'https://www.agenziaentrate.gov.it/portale/o/OpenDataServlet'

// ─── Normalizza risposta OMI verso ZoneInsight ───────────────────────────────

function normalizeOMIRow(row: Record<string, string>, city: string) {
  const avgMin = parseFloat(row['Quotazione minima'] ?? row.qmin ?? '0')
  const avgMax = parseFloat(row['Quotazione massima'] ?? row.qmax ?? '0')
  const avg = avgMin && avgMax ? Math.round((avgMin + avgMax) / 2) : 0

  return {
    id: crypto.randomUUID(),
    city,
    zone: row['Zona OMI'] ?? row.zona ?? '',
    microzone: row.microzona ?? null,
    avg_price_sqm: avg,
    min_price_sqm: Math.round(avgMin),
    max_price_sqm: Math.round(avgMax),
    listings_count: 0,
    sold_count: 0,
    rent_count: 0,
    trend_delta: 0,
    period_label: row.semestre ?? row.periodo ?? 'Ultimo semestre',
    metadata: { source: 'omi', raw_destinazione: row.destinazione ?? null },
    updated_at: new Date().toISOString(),
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json() as { city: string; province?: string }

    if (!body.city) {
      return new Response(
        JSON.stringify({ error: 'city is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // OMI open data endpoint – CSV semestrale per comune
    // I parametri variano per semestre; usiamo l'ultimo disponibile
    const params = new URLSearchParams({
      comune: body.city.toLowerCase(),
      tipoImmobile: 'R', // R = Residenziale
      format: 'json',
    })

    const omiUrl = `${OMI_BASE}?${params.toString()}`

    const res = await fetch(omiUrl, {
      headers: { Accept: 'application/json' },
    })

    // Se l'endpoint OMI non risponde o dà errore, restituiamo dati vuoti
    // senza far crashare l'app (è un servizio governativo con uptime variabile)
    if (!res.ok) {
      console.warn(`OMI API non disponibile: ${res.status}. Restituisco dati vuoti.`)
      return new Response(
        JSON.stringify({ data: [], total: 0, warning: 'OMI service temporarily unavailable' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const raw = await res.json() as { rows?: Record<string, string>[] } | Record<string, string>[]

    const rows: Record<string, string>[] = Array.isArray(raw) ? raw : (raw.rows ?? [])
    const zones = rows
      .filter((r) => r['Quotazione minima'] || r.qmin)
      .map((r) => normalizeOMIRow(r, body.city))

    return new Response(
      JSON.stringify({ data: zones, total: zones.length }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
