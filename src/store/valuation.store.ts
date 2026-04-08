import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Property, Comparable, ValuationResult } from '@/types'
import { calculateValuation } from '@/lib/valuation-engine'

interface ValuationDraft {
  property: Partial<Property>
  selectedComparableIds: string[]
  result: ValuationResult | null
  notes: string
  currentStep: number
}

interface ValuationState {
  draft: ValuationDraft
  availableComparables: Comparable[]

  setProperty: (updates: Partial<Property>) => void
  setStep: (step: number) => void
  toggleComparable: (id: string) => void
  setAllComparables: (comparables: Comparable[]) => void
  recalculate: () => void
  resetDraft: () => void
  setNotes: (notes: string) => void
}

const DEFAULT_DRAFT: ValuationDraft = {
  property: {
    type: 'appartamento',
    contract_type: 'vendita',
    commercial_area: 80,
    elevator: false,
    balcony: false,
    terrace: false,
    garden: false,
    garage: false,
    parking_space: false,
    cellar: false,
    condition: 'buono',
  },
  selectedComparableIds: [],
  result: null,
  notes: '',
  currentStep: 0,
}

export const useValuationStore = create<ValuationState>()(
  persist(
    (set, get) => ({
      draft: DEFAULT_DRAFT,
      availableComparables: [],

      setProperty: (updates) =>
        set((state) => ({
          draft: {
            ...state.draft,
            property: { ...state.draft.property, ...updates },
          },
        })),

      setStep: (step) =>
        set((state) => ({
          draft: { ...state.draft, currentStep: step },
        })),

      toggleComparable: (id) => {
        set((state) => {
          const ids = state.draft.selectedComparableIds
          const newIds = ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
          return {
            draft: { ...state.draft, selectedComparableIds: newIds },
          }
        })
        get().recalculate()
      },

      setAllComparables: (comparables) => set({ availableComparables: comparables }),

      recalculate: () => {
        const { draft, availableComparables } = get()
        const selected = availableComparables.filter((c) =>
          draft.selectedComparableIds.includes(c.id)
        )

        if (selected.length === 0 || !draft.property.commercial_area) {
          set((state) => ({
            draft: { ...state.draft, result: null },
          }))
          return
        }

        try {
          const result = calculateValuation(draft.property as Property, selected)
          set((state) => ({
            draft: { ...state.draft, result },
          }))
        } catch {
          // Not enough data yet
        }
      },

      resetDraft: () => set({ draft: DEFAULT_DRAFT }),

      setNotes: (notes) =>
        set((state) => ({
          draft: { ...state.draft, notes },
        })),
    }),
    {
      name: 'estimio-valuation-draft',
      partialize: (state) => ({ draft: state.draft }),
    }
  )
)
