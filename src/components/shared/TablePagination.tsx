import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TablePaginationProps {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPrev: () => void
  onNext: () => void
}

export function TablePagination({ page, pageCount, total, pageSize, onPrev, onNext }: TablePaginationProps) {
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
      <p className="text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}–{to}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">Page {page} of {pageCount}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-1" onClick={onPrev} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <Button variant="outline" className="gap-1" onClick={onNext} disabled={page >= pageCount}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
