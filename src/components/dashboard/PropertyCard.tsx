import { MapPin, BedDouble, Bath, Square, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Property } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-950',
  sold: 'bg-muted text-muted-foreground hover:bg-muted',
  pending: 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-950',
}

export function PropertyCard({ property, onClick }: { property: Property; onClick?: () => void }) {
  const name = property.name || property.address || 'Untitled'
  const city = property.location?.city || property.city || 'N/A'
  const state = property.location?.state || property.state || 'N/A'
  const price = property.price || property.listPrice || 0
  const beds = property.beds ?? 0
  const baths = property.baths ?? 0
  const sqft = property.sqft || 0
  const imageUrl = property.imageUrl || property.imageUrls?.[0] || ''
  const status = property.status || 'available'

  return (
    <Card onClick={onClick} className="overflow-hidden hover:border-border transition-colors cursor-pointer group">
      <div className="relative h-44 overflow-hidden -mt-4">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
        >
          <Eye className="h-4 w-4" />
        </Button>
        {status && (
          <Badge className={`absolute bottom-3 left-3 capitalize ${STATUS_STYLES[status] || ''}`}>
            {status}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-1.5 gap-2">
          <h3 className="text-sm font-semibold text-foreground leading-tight">{name}</h3>
          {price > 0 && (
            <span className="text-base font-bold text-foreground whitespace-nowrap">
              ${price.toLocaleString()}<span className="text-xs text-muted-foreground">/mo</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 mb-2.5">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">{city}, {state}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2.5">
          {beds > 0 && <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{beds} Beds</span>}
          {baths > 0 && <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{baths} Baths</span>}
          {sqft > 0 && <span className="flex items-center gap-1"><Square className="h-3.5 w-3.5" />{sqft.toLocaleString()} sqft</span>}
        </div>

        {/* Secondary metadata row */}
        {(property.yearBuilt || property.mlsNumber) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-2">
            {property.yearBuilt && <span>Built {property.yearBuilt}</span>}
            {property.mlsNumber && <span className="font-mono">MLS# {property.mlsNumber}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
