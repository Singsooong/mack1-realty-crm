import { TableCell, TableHead, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

interface TableSkeletonProps {
  columns: number
  rows?: number
}

// Placeholder rows for a Table's TableBody while data is still loading.
export function TableSkeleton({ columns, rows = 6 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="border-border hover:bg-transparent">
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full max-w-[140px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// Placeholder header row — column labels are also unknown-looking while
// loading, so this replaces real header text instead of exposing it early.
export function TableHeaderSkeleton({ columns }: { columns: number }) {
  return (
    <TableRow className="hover:bg-transparent border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <TableHead key={i}><Skeleton className="h-4 w-16" /></TableHead>
      ))}
    </TableRow>
  )
}
