import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableHeader } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { TableHeaderSkeleton, TableSkeleton } from '@/components/shared/TableSkeleton'

// Shared by PageRouter's Suspense fallback and ClientsPage's own
// data-loading state — one skeleton, no text flash before it.
export function ClientsPageSkeleton() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium leading-tight text-foreground">Clients</h1>
          <Skeleton className="h-4 w-20 mt-1" />
        </div>
        <Button disabled>+ Add Client</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clients..." className="pl-9" disabled />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableHeaderSkeleton columns={6} />
          </TableHeader>
          <TableBody>
            <TableSkeleton columns={6} />
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
