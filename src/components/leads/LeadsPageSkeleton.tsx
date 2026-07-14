import { Button } from '@/components/ui/button'
import { Table, TableBody, TableHeader } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { TableHeaderSkeleton, TableSkeleton } from '@/components/shared/TableSkeleton'

// Shared by PageRouter's Suspense fallback and LeadsPage's own data-loading
// state, so there's only ever one skeleton — never a text flash before it.
export function LeadsPageSkeleton() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium leading-tight text-foreground">Leads</h1>
          <Skeleton className="h-4 w-28 mt-1" />
        </div>
        <Button disabled>+ New Lead</Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableHeaderSkeleton columns={8} />
          </TableHeader>
          <TableBody>
            <TableSkeleton columns={8} />
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
