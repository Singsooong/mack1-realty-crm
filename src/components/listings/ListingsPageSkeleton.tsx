import { SlidersHorizontal } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

function ListingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full -mt-4" />
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  )
}

// Shared by PageRouter's Suspense fallback and ListingsPage's own
// data-loading state — one skeleton, no text flash before it.
export function ListingsPageSkeleton() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium leading-tight text-foreground">Listings</h1>
          <Skeleton className="h-4 w-32 mt-1" />
        </div>
        <Button disabled>+ Add Listing</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input placeholder="Search listings..." className="pl-9" disabled />
        </div>
        <Skeleton className="h-9 w-36" />
        <Button variant="outline" size="icon" disabled><SlidersHorizontal className="h-4 w-4" /></Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
      </div>
    </div>
  )
}
