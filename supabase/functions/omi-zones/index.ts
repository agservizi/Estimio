// Supabase Edge Function – dati OMI (Osservatorio del Mercato Immobiliare)
// Strategia multi-sorgente:
//   1. WikiOMI API (community, dati ufficiali OMI esposti via REST)
//   2. Fallback statico: quotazioni OMI 2024 per le principali città italiane
//
// Deploy: supabase functions deploy omi-zones

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Tabella fallback OMI 2024 – principali città italiane ──────────────────
// Dati basati su quotazioni OMI 2° semestre 2024 (destinazione residenziale)
// Fonte: https://www.agenziaentrate.gov.it/portale/schede/fabbricatiterreni/omi

const CITY_FALLBACK: Record<string, Array<{ zone: string; min: number; max: number; trend: number }>> = {
  roma: [
    { zone: 'Centro Storico', min: 4500, max: 8500, trend: 2.1 },
    { zone: 'Prati / Vaticano', min: 4200, max: 7200, trend: 1.8 },
    { zone: 'Trastevere', min: 3800, max: 6500, trend: 1.5 },
    { zone: 'EUR', min: 3200, max: 5500, trend: 2.4 },
    { zone: 'Parioli', min: 4000, max: 6800, trend: 1.2 },
    { zone: 'Ostiense / Testaccio', min: 3000, max: 5200, trend: 3.1 },
    { zone: 'Nomentano / Salario', min: 2800, max: 4800, trend: 1.6 },
    { zone: 'Periferia Nord', min: 1800, max: 3200, trend: 0.8 },
    { zone: 'Periferia Sud', min: 1600, max: 2900, trend: 0.5 },
  ],
  milano: [
    { zone: 'Centro / Brera / Quadrilatero', min: 8000, max: 16000, trend: 3.2 },
    { zone: 'Navigli / Ticinese', min: 5500, max: 9000, trend: 4.1 },
    { zone: 'Isola / Maggiolina', min: 5000, max: 8500, trend: 3.8 },
    { zone: 'CityLife / Portello', min: 5500, max: 9500, trend: 2.9 },
    { zone: 'Porta Venezia / Buenos Aires', min: 4500, max: 7500, trend: 2.6 },
    { zone: 'Loreto / Nolo', min: 3800, max: 6200, trend: 5.0 },
    { zone: 'Bicocca / Bovisa', min: 3500, max: 5800, trend: 3.5 },
    { zone: 'Periferia', min: 2500, max: 4200, trend: 1.8 },
  ],
  napoli: [
    { zone: 'Chiaia / Posillipo', min: 3500, max: 6500, trend: 1.4 },
    { zone: 'Vomero / Arenella', min: 2800, max: 5000, trend: 1.2 },
    { zone: 'Centro Storico', min: 1800, max: 3800, trend: 2.0 },
    { zone: 'Fuorigrotta / Bagnoli', min: 1600, max: 3200, trend: 0.9 },
    { zone: 'Periferia', min: 900, max: 2200, trend: 0.4 },
  ],
  torino: [
    { zone: 'Centro / Crocetta', min: 2500, max: 4500, trend: 0.8 },
    { zone: 'San Salvario / Nizza', min: 2000, max: 3800, trend: 2.2 },
    { zone: 'Cit Turin / Parella', min: 1800, max: 3200, trend: 1.5 },
    { zone: 'Aurora / Vanchiglia', min: 1600, max: 3000, trend: 3.0 },
    { zone: 'Periferia', min: 1000, max: 2200, trend: 0.3 },
  ],
  firenze: [
    { zone: 'Centro Storico', min: 4500, max: 8000, trend: 2.5 },
    { zone: 'Oltrarno', min: 3800, max: 6500, trend: 2.8 },
    { zone: 'Campo di Marte / Cure', min: 2800, max: 4800, trend: 1.8 },
    { zone: 'Periferia', min: 1800, max: 3200, trend: 0.9 },
  ],
  bologna: [
    { zone: 'Centro Storico', min: 3500, max: 6000, trend: 2.1 },
    { zone: 'Bolognina / Lame', min: 2500, max: 4200, trend: 3.5 },
    { zone: 'San Donato / San Vitale', min: 2200, max: 3800, trend: 2.0 },
    { zone: 'Periferia', min: 1500, max: 2800, trend: 0.8 },
  ],
  genova: [
    { zone: 'Nervi / Quinto', min: 2500, max: 4500, trend: 1.0 },
    { zone: 'Albaro / Foce', min: 2000, max: 3800, trend: 0.8 },
    { zone: 'Centro', min: 1200, max: 2800, trend: 0.5 },
    { zone: 'Periferia', min: 700, max: 1800, trend: -0.2 },
  ],
  palermo: [
    { zone: 'Centro / Libertà', min: 1500, max: 3000, trend: 0.6 },
    { zone: 'Mondello / Addaura', min: 2000, max: 4000, trend: 1.2 },
    { zone: 'Periferia', min: 700, max: 1600, trend: 0.2 },
  ],
  venezia: [
    { zone: 'Centro Storico', min: 4500, max: 9000, trend: 1.8 },
    { zone: 'Mestre', min: 1400, max: 2800, trend: 1.0 },
    { zone: 'Lido', min: 2500, max: 5000, trend: 1.5 },
  ],
  verona: [
    { zone: 'Centro Storico', min: 2800, max: 5000, trend: 1.6 },
    { zone: 'Semicentro', min: 1800, max: 3200, trend: 1.2 },
    { zone: 'Periferia', min: 1200, max: 2400, trend: 0.6 },
  ],
}

// ─── Normalizza riga WikiOMI verso ZoneInsight ───────────────────────────────

function normalizeWikiOMI(row: Record<string, unknown>, city: string) {
  const min = Number(row.quotazione_minima ?? row.qmin ?? 0)
  const max = Number(row.quotazione_massima ?? row.qmax ?? 0)
  const avg = min && max ? Math.round((min + max) / 2) : 0
  return {
    id: crypto.randomUUID(),
    city,
    zone: String(row.zona_omi ?? row.zona ?? row.nome_zona ?? ''),
    microzone: row.microzona ? String(row.microzona) : null,
    avg_price_sqm: avg,
    min_price_sqm: Math.round(min),
    max_price_sqm: Math.round(max),
    listings_count: 0,
    sold_count: 0,
    rent_count: 0,
    trend_delta: Number(row.variazione ?? 0),
    period_label: String(row.semestre ?? row.periodo ?? 'Ultimo semestre'),
    metadata: { source: 'wikiomi', raw: row },
    updated_at: new Date().toISOString(),
  }
}

// ─── Genera zone da tabella statica fallback ──────────────────────────────────

function buildFallbackZones(city: string) {
  const key = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const rows = CITY_FALLBACK[key]
  if (!rows) return []
  return rows.map((r) => ({
    id: crypto.randomUUID(),
    city,
    zone: r.zone,
    microzone: null,
    avg_price_sqm: Math.round((r.min + r.max) / 2),
    min_price_sqm: r.min,
    max_price_sqm: r.max,
    listings_count: 0,
    sold_count: 0,
    rent_count: 0,
    trend_delta: r.trend,
    period_label: '2° sem. 2024',
    metadata: { source: 'omi_static' },
    updated_at: new Date().toISOString(),
  }))
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

    // ── Tentativo 1: WikiOMI REST API ─────────────────────────────────────────
    // WikiOMI espone i dati ufficiali OMI via REST (manutenuto dalla community)
    try {
      const wikiUrl = `https://wikiomi.it/api/zona/?comune=${encodeURIComponent(body.city)}&destinazione_uso=R&format=json`
      const wikiRes = await fetch(wikiUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      })

      if (wikiRes.ok) {
        const raw = await wikiRes.json() as
          | Record<string, unknown>[]
          | { results?: Record<string, unknown>[] }

        const rows: Record<string, unknown>[] = Array.isArray(raw)
          ? raw
          : (raw.results ?? [])

        if (rows.length > 0) {
          const zones = rows
            .filter((r) => r.quotazione_minima || r.qmin)
            .map((r) => normalizeWikiOMI(r, body.city))

          if (zones.length > 0) {
            return new Response(
              JSON.stringify({ data: zones, total: zones.length }),
              { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
            )
          }
        }
      }
    } catch (wikiErr) {
      console.warn('[omi-zones] WikiOMI non raggiungibile:', wikiErr instanceof Error ? wikiErr.message : wikiErr)
    }

    // ── Tentativo 2: tabella statica per le principali città ──────────────────
    const fallback = buildFallbackZones(body.city)
    if (fallback.length > 0) {
      return new Response(
        JSON.stringify({ data: fallback, total: fallback.length, source: 'static' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // ── Nessuna fonte disponibile ─────────────────────────────────────────────
    return new Response(
      JSON.stringify({ data: [], total: 0, warning: 'Nessun dato OMI disponibile per questa città' }),
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
