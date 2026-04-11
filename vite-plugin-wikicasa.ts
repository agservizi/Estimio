// Vite dev plugin – scraper Wikicasa con Puppeteer + Stealth
//
// Usa puppeteer-extra con il plugin stealth per bypassare Cloudflare Bot Protection.
// Riutilizza un'unica istanza browser per tutta la sessione dev (warm-up ~2s al primo avvio).
// URL pattern confermato: /vendita-{tipo}s/{city-slug}/ (plurale, es. vendita-appartamenti)
// DOM extraction: .uikit-card[class*="insertion"] confermato da smoke test (25 listings)
//
// Endpoint: POST /api/scrape-wikicasa
// Body: { city, zone?, property_type?, contract_type?, price_min?, price_max?, area_min?, area_max?, max_results? }

import type { Plugin, ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'

// ─── Costanti ─────────────────────────────────────────────────────────────────

const CHROME_PATH =
  process.env.CHROME_PATH ??
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const BASE_URL = 'https://www.wikicasa.it'

// Mappa tipo → slug URL (plurale, confermato da smoke test)
const TYPE_SLUG: Record<string, string> = {
  appartamento:  'appartamenti',
  villa:         'ville',
  villetta:      'villette',
  attico:        'attici',
  loft:          'appartamenti',
  monolocale:    'monolocali',
  bilocale:      'appartamenti',
  trilocale:     'appartamenti',
  quadrilocale:  'appartamenti',
  ufficio:       'uffici',
  negozio:       'negozi',
  box:           'box-auto',
  altro:         'appartamenti',
}

// ─── Helpers URL ──────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function buildUrl(p: {
  city: string; zone?: string; property_type?: string; contract_type?: string
  price_min?: number; price_max?: number; area_min?: number; area_max?: number
}): string {
  const op   = p.contract_type === 'locazione' ? 'affitto' : 'vendita'
  const type = TYPE_SLUG[p.property_type ?? 'appartamento'] ?? 'appartamenti'
  let path   = `/${op}-${type}/${slugify(p.city)}/`
  if (p.zone) path += `${slugify(p.zone)}/`
  const qs = new URLSearchParams()
  if (p.price_min) qs.set('prezzoMin', String(p.price_min))
  if (p.price_max) qs.set('prezzoMax', String(p.price_max))
  if (p.area_min)  qs.set('mqMin',     String(p.area_min))
  if (p.area_max)  qs.set('mqMax',     String(p.area_max))
  const q = qs.toString()
  return `${BASE_URL}${path}${q ? '?' + q : ''}`
}

// ─── Singleton browser ────────────────────────────────────────────────────────
// Una sola istanza per tutta la sessione dev: il primo scrape paga il costo
// di avvio (~2s), tutti i successivi riusano il browser già aperto.

let browserInstance: import('puppeteer-core').Browser | null = null
let browserLaunching = false
const browserQueue: Array<(b: import('puppeteer-core').Browser) => void> = []

async function getBrowser(): Promise<import('puppeteer-core').Browser> {
  if (browserInstance) return browserInstance

  if (browserLaunching) {
    return new Promise((resolve) => browserQueue.push(resolve))
  }

  browserLaunching = true

  const puppeteerExtra = (await import('puppeteer-extra')).default
  const StealthPlugin   = (await import('puppeteer-extra-plugin-stealth')).default
  puppeteerExtra.use(StealthPlugin())

  console.log('\n[wikicasa] 🚀 Avvio browser Chrome headless...')
  const browser = await puppeteerExtra.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1366,768',
      '--lang=it-IT',
    ],
  } as Parameters<typeof puppeteerExtra.launch>[0])

  browserInstance = browser
  browserLaunching = false
  browserQueue.forEach((cb) => cb(browser))
  browserQueue.length = 0

  process.on('exit',   () => { browser.close().catch(() => {}) })
  process.on('SIGINT', () => { browser.close().then(() => process.exit()) })

  console.log('[wikicasa] ✅ Browser pronto\n')
  return browser
}

// ─── Scrape ───────────────────────────────────────────────────────────────────

async function scrape(params: {
  city: string; zone?: string; property_type?: string; contract_type?: string
  price_min?: number; price_max?: number; area_min?: number; area_max?: number
  max_results?: number
}): Promise<{ data: Record<string, unknown>[]; total: number; source_url: string }> {

  const searchUrl = buildUrl(params)
  console.log(`[wikicasa] 🔍 ${searchUrl}`)
  console.time('[wikicasa] scrape')

  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    await page.setViewport({ width: 1366, height: 768 })

    // Blocca risorse pesanti per velocizzare il caricamento
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      const type = req.resourceType()
      if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
        req.abort()
      } else {
        req.continue()
      }
    })

    // Naviga alla pagina di ricerca
    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    })

    // Dismetti il cookie banner (Wikicasa lo mostra sempre alla prima visita)
    try {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const acceptBtn = buttons.find(b =>
          /accetta|accept|accetto|ok|consent/i.test(b.textContent ?? '')
        )
        if (acceptBtn) (acceptBtn as HTMLButtonElement).click()
      })
      // Piccola pausa per lasciare che il contenuto si carichi dopo il consenso
      await new Promise(r => setTimeout(r, 1500))
    } catch { /* ignora se non c'è banner */ }

    // Attendi che le card annunci appaiano nel DOM
    try {
      await page.waitForSelector(
        '.uikit-card, [class*="insertion-real-esta"], [class*="AnnuncioCard"]',
        { timeout: 10000 }
      )
    } catch {
      console.warn('[wikicasa] ⚠️ Timeout attesa card annunci, provo comunque...')
    }

    // ── Estrazione DOM ─────────────────────────────────────────────────────────
    // Selettori confermati dal smoke test: .uikit-card[class*="insertion"]
    // estrae 25 listing reali su wikicasa.it/vendita-appartamenti/roma/

    const rawListings = await page.evaluate((baseUrl: string) => {
      const results: Array<{
        id: string
        title: string | null
        address: string | null
        zone: string | null
        price: number | null
        area_sqm: number | null
        rooms: number | null
        floor: string | null
        source_url: string | null
        image_url: string | null
      }> = []

      // Selettori card (in ordine di affidabilità, confermati da smoke test)
      const cards = document.querySelectorAll(
        '.uikit-card[class*="insertion"], [class*="insertion-real-esta"], [class*="AnnuncioCard"]'
      )

      cards.forEach((card, i) => {
        try {
          const rawText = card.textContent ?? ''

          // Prezzo: cerca pattern "€ 123.456" o "123.456 €"
          const priceMatch = rawText.match(/€\s*([\d.,]+(?:\.\d{3})*)/)
            ?? rawText.match(/([\d.,]+(?:\.\d{3})*)\s*€/)
          const price = priceMatch
            ? parseInt(priceMatch[1].replace(/\./g, '').replace(',', ''), 10)
            : null

          // Area: cerca pattern "123 m²" o "123 mq"
          const areaMatch = rawText.match(/(\d+)\s*m[²q2]/i)
          const area = areaMatch ? parseInt(areaMatch[1], 10) : null

          // Scarta annunci con prezzo non plausibile
          if (!price || price < 10000) return

          // Titolo: tipo immobile + operazione (es. "Bilocale in Vendita")
          const titleMatch = rawText.match(
            /(Bilocale|Trilocale|Quadrilocale|Monolocale|Villa|Attico|Appartamento|Villetta|Loft|Penthouse)\s+in\s+(Vendita|Affitto)/i
          )
          const titleEl = card.querySelector(
            '[class*="title"], [class*="Title"], h2, h3, [class*="typology"]'
          )
          const title = titleMatch?.[0]?.trim()
            ?? titleEl?.textContent?.trim().slice(0, 100)
            ?? `Annuncio ${i + 1}`

          // Indirizzo: cerca pattern "Via/Viale/Piazza ..." nel testo
          const addrMatch = rawText.match(
            /(Via|Viale|Piazza|Corso|Largo|Vicolo|Strada)\s+[A-Za-zÀ-ÿ\s.']+(?:,\s*\d+)?/i
          )
          const addrEl = card.querySelector(
            '[class*="address"], [class*="Address"], [class*="street"], [class*="location"]'
          )
          const address = addrMatch?.[0]?.trim() ?? addrEl?.textContent?.trim() ?? null

          // Zona: cerca elemento dedicato, oppure pattern "(Zona X)" nel testo
          const zoneEl = card.querySelector(
            '[class*="zone"], [class*="Zone"], [class*="neighborhood"], [class*="area"]'
          )
          const zoneMatch = rawText.match(/\(([^)]{3,40})\)/)
          const zone = zoneEl?.textContent?.trim() || zoneMatch?.[1]?.trim() || null

          // Locali
          const roomsMatch = rawText.match(/(\d+)\s+local[ei]/i)
          const rooms = roomsMatch ? parseInt(roomsMatch[1], 10) : null

          // Piano
          const floorMatch = rawText.match(/piano\s+(\d+|terra|rialzato|attico)/i)
          const floor = floorMatch?.[1] ?? null

          // Link all'annuncio
          const linkEl = card.querySelector('a[href*="/annuncio"], a[href*="/immobile"], a[href]')
          const href = (linkEl as HTMLAnchorElement | null)?.href ?? ''
          const sourceUrl = href.startsWith('http') ? href : href ? `${baseUrl}${href}` : null

          // Immagine (non bloccata se presente)
          const imgEl = card.querySelector('img[src]')
          const imageUrl = (imgEl as HTMLImageElement | null)?.src ?? null

          results.push({
            id: `wk-dom-${i}`,
            title,
            address,
            zone,
            price,
            area_sqm: area,
            rooms,
            floor,
            source_url: sourceUrl,
            image_url: imageUrl,
          })
        } catch { /* skip card */ }
      })

      return results
    }, BASE_URL)

    console.log(`[wikicasa] 📦 DOM: ${rawListings.length} annunci trovati`)

    // ── Mappa al formato Comparable ──────────────────────────────────────────

    const now = new Date().toISOString()
    const mapped = rawListings
      .filter(r => r.price && r.price > 0 && r.area_sqm && r.area_sqm > 0)
      .map((r, i): Record<string, unknown> => ({
        id:            r.id,
        valuation_id:  null,
        source:        'wikicasa',
        source_url:    r.source_url,
        title:         r.title ?? `Annuncio Wikicasa ${i + 1}`,
        address:       r.address ?? params.city,
        city:          params.city,
        zone:          r.zone,
        latitude:      null,
        longitude:     null,
        property_type: params.property_type ?? 'appartamento',
        price:         r.price,
        area_sqm:      r.area_sqm,
        price_per_sqm: r.price && r.area_sqm ? Math.round(r.price / r.area_sqm) : null,
        condition:     null,
        floor:         r.floor ? (isNaN(Number(r.floor)) ? null : Number(r.floor)) : null,
        rooms:         r.rooms,
        bathrooms:     null,
        energy_class:  null,
        image_url:     r.image_url,
        similarity_score: null,
        distance_km:   null,
        listing_date:  null,
        metadata:      { scraper: 'wikicasa-puppeteer', scraped_at: now },
        created_at:    now,
      }))

    const maxResults = Math.min(params.max_results ?? 30, 50)
    const result = mapped.slice(0, maxResults)

    console.timeEnd('[wikicasa] scrape')
    console.log(`[wikicasa] ✅ ${result.length} comparabili estratti\n`)

    return { data: result, total: result.length, source_url: searchUrl }

  } finally {
    await page.close()
  }
}

// ─── Vite Plugin ──────────────────────────────────────────────────────────────

export function wikicasaDevPlugin(): Plugin {
  return {
    name: 'wikicasa-dev-proxy',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        '/api/scrape-wikicasa',
        async (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Content-Type', 'application/json')

          if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

          try {
            const body = await new Promise<Record<string, unknown>>((resolve, reject) => {
              let raw = ''
              req.on('data', (c: Buffer) => { raw += c.toString() })
              req.on('end', () => { try { resolve(JSON.parse(raw || '{}')) } catch { reject(new Error('Invalid JSON')) } })
              req.on('error', reject)
            })

            const result = await scrape({
              city:          String(body.city ?? 'roma'),
              zone:          body.zone          as string | undefined,
              property_type: body.property_type as string | undefined,
              contract_type: body.contract_type as string | undefined,
              price_min:     body.price_min     as number | undefined,
              price_max:     body.price_max     as number | undefined,
              area_min:      body.area_min      as number | undefined,
              area_max:      body.area_max      as number | undefined,
              max_results:   body.max_results   as number | undefined,
            })

            res.writeHead(200)
            res.end(JSON.stringify(result))
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            console.error('[wikicasa] ✗', message)
            res.writeHead(500)
            res.end(JSON.stringify({ error: message }))
          }
        }
      )
    },
  }
}
