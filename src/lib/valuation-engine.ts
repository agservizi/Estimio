import type { Comparable, Property, ValuationResult } from '@/types'

// ─── Correction Coefficients ──────────────────────────────────────────────────

const CONDITION_COEFF: Record<string, number> = {
  nuovo: 1.15,
  ottimo: 1.08,
  ristrutturato: 1.05,
  buono: 1.00,
  discreto: 0.92,
  da_ristrutturare: 0.80,
}

const FLOOR_BONUS: Record<number, number> = {
  0: -0.05,  // piano terra
  1: -0.02,
  2: 0.00,
  3: 0.01,
  4: 0.02,
  5: 0.03,
}

const ENERGY_COEFF: Record<string, number> = {
  A4: 1.08,
  A3: 1.06,
  A2: 1.04,
  A1: 1.02,
  B: 1.00,
  C: 0.98,
  D: 0.95,
  E: 0.92,
  F: 0.88,
  G: 0.85,
}

// ─── Similarity Weighting ─────────────────────────────────────────────────────

function getSimilarityWeight(comp: Comparable): number {
  const score = comp.similarity_score ?? 0.5
  const distancePenalty = comp.distance_km ? Math.max(0, 1 - comp.distance_km * 0.15) : 1

  // Recency bonus: reduce weight for older listings
  let recencyFactor = 1
  if (comp.listing_date) {
    const months = (Date.now() - new Date(comp.listing_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
    recencyFactor = Math.max(0.6, 1 - months * 0.04)
  }

  return score * distancePenalty * recencyFactor
}

// ─── Correction Factors for Target Property ──────────────────────────────────

function getPropertyCorrectionFactor(property: Property): number {
  let factor = 1

  // Condition
  if (property.condition) {
    factor *= CONDITION_COEFF[property.condition] ?? 1
  }

  // Floor (use midpoint if no value)
  const floor = property.floor ?? 3
  const floorBonus = FLOOR_BONUS[Math.min(floor, 5)] ?? 0.03
  factor *= 1 + floorBonus

  // Elevator
  if (!property.elevator && (property.floor ?? 0) > 2) {
    factor *= 0.96
  }

  // Energy class
  if (property.energy_class) {
    factor *= ENERGY_COEFF[property.energy_class] ?? 1
  }

  // Extras
  if (property.garage) factor *= 1.04
  if (property.terrace) factor *= 1.03
  if (property.balcony) factor *= 1.01
  if (property.garden) factor *= 1.025

  return factor
}

// ─── Main Calculation ─────────────────────────────────────────────────────────

export function calculateValuation(
  property: Property,
  selectedComparables: Comparable[]
): ValuationResult {
  if (selectedComparables.length === 0) {
    throw new Error('Almeno un comparabile richiesto')
  }

  // Weighted average of price per sqm
  let weightedSum = 0
  let totalWeight = 0

  for (const comp of selectedComparables) {
    const weight = getSimilarityWeight(comp)
    weightedSum += comp.price_per_sqm * weight
    totalWeight += weight
  }

  const basePricePerSqm = weightedSum / totalWeight

  // Apply property-specific correction
  const correctedPricePerSqm = basePricePerSqm * getPropertyCorrectionFactor(property)

  // Estimated average
  const estimated_avg = Math.round(correctedPricePerSqm * property.commercial_area)

  // Range: ±8% for high confidence, ±15% for low
  const spread = selectedComparables.length >= 5 ? 0.08 : 0.12
  const estimated_min = Math.round(estimated_avg * (1 - spread))
  const estimated_max = Math.round(estimated_avg * (1 + spread))

  // Suggested listing price: slightly above average
  const suggested_listing_price = Math.round(estimated_avg * 1.03)

  // Confidence score based on number of comparables, their similarity, and recency
  const avgSimilarity = selectedComparables.reduce(
    (acc, c) => acc + (c.similarity_score ?? 0.5), 0
  ) / selectedComparables.length

  const countBonus = Math.min(1, selectedComparables.length / 8)
  const confidence_score = Math.min(0.98, avgSimilarity * 0.5 + countBonus * 0.3 + 0.2)

  // Generate notes
  const notes: string[] = []
  notes.push(`Stima basata su ${selectedComparables.length} comparabili selezionati.`)
  notes.push(`Prezzo medio al m² comparabili: ${Math.round(basePricePerSqm).toLocaleString('it-IT')} €/m².`)
  if (property.condition === 'da_ristrutturare') {
    notes.push('Lo stato da ristrutturare ha ridotto il valore stimato del ~20%.')
  }
  if (property.condition === 'nuovo' || property.condition === 'ottimo') {
    notes.push("L'ottimo stato di conservazione ha valorizzato positivamente la stima.")
  }
  if (property.energy_class && ['A4', 'A3', 'A2', 'A1'].includes(property.energy_class)) {
    notes.push("L'elevata classe energetica apporta un premium di mercato.")
  }
  if (property.garage) notes.push('La presenza di box/garage incrementa il valore del 4%.')
  if (confidence_score < 0.7) {
    notes.push('Affidabilità media: consigliamo di aggiungere più comparabili simili.')
  }

  return {
    estimated_min,
    estimated_avg,
    estimated_max,
    suggested_listing_price,
    confidence_score: Math.round(confidence_score * 100) / 100,
    price_per_sqm: Math.round(correctedPricePerSqm),
    comparables_used: selectedComparables.length,
    notes,
  }
}
