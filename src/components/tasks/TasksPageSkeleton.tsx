import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const COLUMN_LABELS = ['Pending', 'In Progress', 'Completed']

// Shared by PageRouter's Suspense fallback and TasksPage's own
// data-loading state — one skeleton, no text flash before it.
export function TasksPageSkeleton() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-xl text-foreground">Tasks</h1>
          <Skeleton className="h-4 w-16 mt-1" />
        </div>
        <Button disabled>+ New Task</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMN_LABELS.map(label => (
          <div key={label} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
            </div>
            <div className="flex flex-col gap-2 min-h-[120px] rounded-lg p-2 bg-muted/20">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3 flex flex-col gap-2">
                    <Skeleton className="h-4 w-4/5" />
                    <div className="flex gap-1">
                      <Skeleton className="h-4 w-14" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
