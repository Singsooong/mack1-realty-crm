import { PropertyCard } from './PropertyCard'
import { propertiesData } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

export function PropertyGrid() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Recent Properties</h2>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
          View all <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {propertiesData.slice(0, 4).map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  )
}
