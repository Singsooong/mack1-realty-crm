import { FileSignature, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableHeader } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { TableHeaderSkeleton, TableSkeleton } from '@/components/shared/TableSkeleton'

// Shared by PageRouter's Suspense fallback and ESignPage's own
// data-loading state — one skeleton, no text flash before it.
export function ESignPageSkeleton() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium leading-tight text-foreground">E-Sign</h1>
          <Skeleton className="h-4 w-28 mt-1" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" disabled>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button className="gap-2" disabled>
            <FileSignature className="h-4 w-4" /> New Document
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-64" />
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Document name, agent, recipient name or email…" className="pl-9" disabled />
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableHeaderSkeleton columns={7} />
          </TableHeader>
          <TableBody>
            <TableSkeleton columns={7} />
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
