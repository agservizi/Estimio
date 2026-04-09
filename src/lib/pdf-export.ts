import type { Valuation, Property, Client, Comparable } from '@/types'
import { formatCurrency, formatArea, formatPricePerSqm, formatDate, getPropertyTypeLabel, getConditionLabel } from '@/lib/utils'

interface ExportOptions {
  valuation: Valuation
  property: Property
  client?: Client | null
  comparables?: Comparable[]
  agencyName?: string
  agentName?: string
}

function buildReportHTML(opts: ExportOptions): string {
  const { valuation, property, client, comparables = [], agencyName = 'SubitoStima', agentName = '' } = opts

  const formatV = (n: number | null | undefined) => (n ? formatCurrency(n) : '—')

  const comparablesRows = comparables
    .map(
      (c) => `
      <tr>
        <td>${c.address}, ${c.city}</td>
        <td>${formatArea(c.area_sqm)}</td>
        <td>${formatCurrency(c.price)}</td>
        <td>${formatPricePerSqm(c.price_per_sqm)}</td>
        <td>${c.condition ?? '—'}</td>
        <td>${c.similarity_score ? Math.round(c.similarity_score * 100) + '%' : '—'}</td>
      </tr>`
    )
    .join('')

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; font-size: 12px; line-height: 1.5; }

    /* Cover */
    .cover { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #065f46 100%); color: white; padding: 60px 48px; min-height: 280px; display: flex; flex-direction: column; justify-content: space-between; }
    .cover-logo { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 40px; }
    .cover-title { font-size: 28px; font-weight: 700; line-height: 1.2; margin-bottom: 8px; }
    .cover-sub { font-size: 14px; opacity: 0.7; }
    .cover-meta { font-size: 11px; opacity: 0.6; margin-top: 32px; }

    /* Body */
    .body { padding: 40px 48px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 14px; font-weight: 700; color: #4f46e5; border-bottom: 2px solid #e0e7ff; padding-bottom: 6px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; }

    /* Result card */
    .result-card { background: linear-gradient(135deg, #4f46e5, #4338ca); color: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .result-label { font-size: 11px; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .result-value { font-size: 32px; font-weight: 800; }
    .result-range { font-size: 12px; opacity: 0.75; margin-top: 8px; }
    .result-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.2); }
    .result-item-label { font-size: 10px; opacity: 0.65; }
    .result-item-value { font-size: 15px; font-weight: 700; }

    /* Property grid */
    .prop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .prop-item { background: #f8fafc; border-radius: 8px; padding: 12px; }
    .prop-item-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em; margin-bottom: 2px; }
    .prop-item-value { font-size: 13px; font-weight: 600; color: #1e293b; }

    /* Table */
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead { background: #f1f5f9; }
    th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tr:last-child td { border-bottom: none; }

    /* Confidence */
    .confidence { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; }
    .confidence-high { background: #d1fae5; color: #065f46; }
    .confidence-mid { background: #fef3c7; color: #92400e; }
    .confidence-low { background: #fee2e2; color: #991b1b; }

    /* Footer */
    .footer { text-align: center; padding: 24px; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; }

    .note-item { display: flex; gap: 8px; margin-bottom: 8px; font-size: 11px; color: #475569; }
    .note-dot { color: #6366f1; font-weight: bold; margin-top: 1px; }

    .tag { display: inline-block; background: #f1f5f9; color: #475569; border-radius: 4px; padding: 2px 8px; font-size: 10px; font-weight: 600; margin-right: 4px; }
    .tag-yes { background: #d1fae5; color: #065f46; }
  </style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div>
    <div class="cover-logo">${agencyName}</div>
    <div class="cover-title">Perizia di Stima<br/>Immobiliare</div>
    <div class="cover-sub">${property.address}, ${property.city}</div>
  </div>
  <div class="cover-meta">
    Redatta da: ${agentName} &nbsp;|&nbsp; Data: ${formatDate(valuation.created_at)} &nbsp;|&nbsp; Ref. ${valuation.id.slice(0, 8).toUpperCase()}
  </div>
</div>

<div class="body">

  <!-- RISULTATO -->
  <div class="result-card">
    <div class="result-label">Valore di mercato stimato</div>
    <div class="result-value">${formatV(valuation.estimated_avg)}</div>
    <div class="result-range">Range: ${formatV(valuation.estimated_min)} — ${formatV(valuation.estimated_max)}</div>
    <div class="result-grid">
      <div>
        <div class="result-item-label">Prezzo di pubblicazione</div>
        <div class="result-item-value">${formatV(valuation.suggested_listing_price)}</div>
      </div>
      <div>
        <div class="result-item-label">Indice affidabilità</div>
        <div class="result-item-value">${valuation.confidence_score ? Math.round(valuation.confidence_score * 100) + '%' : '—'}</div>
      </div>
      <div>
        <div class="result-item-label">Comparabili usati</div>
        <div class="result-item-value">${comparables.length}</div>
      </div>
    </div>
  </div>

  <!-- IMMOBILE -->
  <div class="section">
    <div class="section-title">Dati dell'immobile</div>
    <div class="prop-grid">
      <div class="prop-item">
        <div class="prop-item-label">Indirizzo</div>
        <div class="prop-item-value">${property.address}</div>
      </div>
      <div class="prop-item">
        <div class="prop-item-label">Città / Zona</div>
        <div class="prop-item-value">${property.city}${property.zone ? ' · ' + property.zone : ''}</div>
      </div>
      <div class="prop-item">
        <div class="prop-item-label">Tipologia</div>
        <div class="prop-item-value">${getPropertyTypeLabel(property.type)}</div>
      </div>
      <div class="prop-item">
        <div class="prop-item-label">Superficie commerciale</div>
        <div class="prop-item-value">${formatArea(property.commercial_area)}</div>
      </div>
      <div class="prop-item">
        <div class="prop-item-label">Stato di conservazione</div>
        <div class="prop-item-value">${getConditionLabel(property.condition)}</div>
      </div>
      <div class="prop-item">
        <div class="prop-item-label">Piano / Totale</div>
        <div class="prop-item-value">${property.floor ?? '—'} / ${property.total_floors ?? '—'}</div>
      </div>
      <div class="prop-item">
        <div class="prop-item-label">Classe energetica</div>
        <div class="prop-item-value">${property.energy_class ?? '—'}</div>
      </div>
      <div class="prop-item">
        <div class="prop-item-label">Anno costruzione</div>
        <div class="prop-item-value">${property.build_year ?? '—'}</div>
      </div>
    </div>
    <div style="margin-top: 12px;">
      ${property.elevator ? '<span class="tag tag-yes">Ascensore</span>' : '<span class="tag">No ascensore</span>'}
      ${property.garage ? '<span class="tag tag-yes">Box garage</span>' : ''}
      ${property.terrace ? '<span class="tag tag-yes">Terrazzo</span>' : ''}
      ${property.balcony ? '<span class="tag tag-yes">Balcone</span>' : ''}
      ${property.garden ? '<span class="tag tag-yes">Giardino</span>' : ''}
      ${property.parking_space ? '<span class="tag tag-yes">Posto auto</span>' : ''}
    </div>
  </div>

  ${client ? `
  <!-- CLIENTE -->
  <div class="section">
    <div class="section-title">Cliente</div>
    <div class="prop-grid">
      <div class="prop-item">
        <div class="prop-item-label">Nome</div>
        <div class="prop-item-value">${client.first_name} ${client.last_name}</div>
      </div>
      <div class="prop-item">
        <div class="prop-item-label">Contatto</div>
        <div class="prop-item-value">${client.email ?? client.phone ?? '—'}</div>
      </div>
    </div>
  </div>` : ''}

  <!-- COMPARABILI -->
  ${comparables.length > 0 ? `
  <div class="section">
    <div class="section-title">Comparabili di mercato utilizzati</div>
    <table>
      <thead>
        <tr>
          <th>Immobile</th>
          <th>Superficie</th>
          <th>Prezzo</th>
          <th>€/m²</th>
          <th>Stato</th>
          <th>Similarità</th>
        </tr>
      </thead>
      <tbody>${comparablesRows}</tbody>
    </table>
  </div>` : ''}

  <!-- NOTE -->
  ${valuation.valuation_notes ? `
  <div class="section">
    <div class="section-title">Note del valutatore</div>
    <p style="font-size: 12px; color: #475569;">${valuation.valuation_notes}</p>
  </div>` : ''}

  <!-- DISCLAIMER -->
  <div class="section" style="background: #f8fafc; border-radius: 8px; padding: 16px;">
    <div class="section-title" style="color: #94a3b8;">Nota legale</div>
    <p style="font-size: 10px; color: #94a3b8; line-height: 1.6;">
      La presente perizia di stima ha carattere indicativo e non costituisce perizia giurata o valutazione ufficiale ai sensi di legge.
      I valori indicati sono basati sull'analisi comparativa di mercato e possono variare in funzione di fattori non considerati nell'analisi.
      Il documento è destinato ad uso interno e informativo.
    </p>
  </div>

</div>

<!-- FOOTER -->
<div class="footer">
  ${agencyName} &nbsp;·&nbsp; Perizia n. ${valuation.id.slice(0, 8).toUpperCase()} &nbsp;·&nbsp; ${formatDate(valuation.created_at)} &nbsp;·&nbsp; Generato con SubitoStima Pro
</div>

</body>
</html>`
}

export async function exportValuationPDF(opts: ExportOptions): Promise<void> {
  // Dynamic import per non appesantire il bundle iniziale
  const html2pdf = (await import('html2pdf.js')).default

  const html = buildReportHTML(opts)
  const container = document.createElement('div')
  container.innerHTML = html
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  document.body.appendChild(container)

  const filename = `Stima_${opts.property.city}_${opts.property.address.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`

  await html2pdf()
    .set({
      margin: 0,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    })
    .from(container.firstElementChild)
    .save()

  document.body.removeChild(container)
}
