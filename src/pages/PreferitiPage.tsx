import { Heart, MapPin, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useFavoriteIds, useToggleFavorite, useComparableSearch } from '@/hooks/useComparables'
import { formatCurrency, formatPricePerSqm } from '@/lib/utils'

export function PreferitiPage() {
  const navigate = useNavigate()
  const { data: favoriteIds = [], isLoading: loadingIds } = useFavoriteIds()
  const { data: allComparables = [], isLoading: loadingComparables } = useComparableSearch({})
  const toggleFavorite = useToggleFavorite()

  const isLoading = loadingIds || loadingComparables
  const favorited = allComparables.filter((c) => favoriteIds.includes(c.id))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Preferiti"
        description="Comparabili salvati come preferiti"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Preferiti' }]}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : favorited.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nessun preferito salvato"
          description="Salva comparabili nei preferiti per ritrovarli facilmente."
          action={{ label: 'Cerca comparabili', onClick: () => navigate('/comparabili') }}
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{favorited.length} comparabil{favorited.length === 1 ? 'e' : 'i'} salvat{favorited.length === 1 ? 'o' : 'i'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorited.map((comp) => (
              <Card key={comp.id} className="hover:shadow-card-hover transition-all overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{comp.address}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">
                          {comp.city}{comp.zone ? ` · ${comp.zone}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-red-50 hover:bg-red-100 transition-colors"
                      onClick={() => toggleFavorite.mutate({ comparableId: comp.id, isFav: true })}
                      title="Rimuovi dai preferiti"
                    >
                      <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                    </button>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(comp.price, true)}</p>
                      <p className="text-xs text-muted-foreground">{formatPricePerSqm(comp.price_per_sqm)}</p>
                    </div>
                    <div className="text-right text-sm font-semibold text-foreground">
                      {comp.area_sqm} m²
                      {comp.rooms && <p className="text-xs font-normal text-muted-foreground">{comp.rooms} locali</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="slate" className="text-[10px]">{comp.source}</Badge>
                    {comp.source_url && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs ml-auto" asChild>
                        <a href={comp.source_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Apri
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
