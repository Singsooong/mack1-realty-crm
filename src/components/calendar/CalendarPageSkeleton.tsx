import { Skeleton } from '@/components/ui/skeleton'

// Shared by PageRouter's Suspense fallback and CalendarPage's own
// data-loading state — one skeleton, no text flash before it. Approximates
// the month-grid + sidebar regions rather than redrawing the real calendar.
export function CalendarPageSkeleton() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-xl text-foreground">Calendar</h1>
          <Skeleton className="h-4 w-36 mt-1" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        <Skeleton className="h-[520px] w-full" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    </div>
  )
}
