import { Table, TableBody, TableHeader } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { TableHeaderSkeleton, TableSkeleton } from '@/components/shared/TableSkeleton'

interface AgentsPageSkeletonProps {
  // Unknown until AgentsPage mounts and useAuth resolves, so the Suspense
  // fallback (rendered before that) defaults to the superset column layout.
  isAdmin?: boolean
}

// Shared by PageRouter's Suspense fallback and AgentsPage's own
// data-loading state — one skeleton, no text flash before it.
export function AgentsPageSkeleton({ isAdmin = true }: AgentsPageSkeletonProps) {
  const columnCount = isAdmin ? 8 : 6

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium leading-tight text-foreground">Agents</h1>
          <Skeleton className="h-4 w-36 mt-1" />
        </div>
        {isAdmin && <Skeleton className="h-9 w-36" />}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-full sm:w-64" />
          <Skeleton className="h-9 w-[130px]" />
          <Skeleton className="h-9 w-[120px]" />
        </div>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableHeaderSkeleton columns={columnCount} />
            </TableHeader>
            <TableBody>
              <TableSkeleton columns={columnCount} />
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
