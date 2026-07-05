import { PropertyCard } from './PropertyCard'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import type { Property } from '@/types'

interface PropertyGridProps {
  properties: Property[]
  onViewAll?: () => void
  onSelect?: (property: Property) => void
}

export function PropertyGrid({ properties, onViewAll, onSelect }: PropertyGridProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-caption-sm uppercase text-muted-foreground">Recent Properties</h2>
        <Button variant="link" size="sm" className="gap-1 text-foreground underline underline-offset-4 decoration-1 hover:decoration-2" onClick={onViewAll}>
          View all <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {properties.length === 0 ? (
        <div className="flex items-center justify-center h-32 rounded-none border border-dashed border-border text-sm text-muted-foreground">
          No properties yet
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} onClick={() => onSelect?.(property)} />
          ))}
        </div>
      )}
    </div>
  )
}
