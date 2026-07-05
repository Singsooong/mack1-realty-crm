import { useEffect, useMemo, useState } from 'react'

const DEFAULT_PAGE_SIZE = 10

/**
 * Client-side pagination over an already-loaded array.
 *
 * The full list lives in memory (our service hooks load everything and mutate
 * locally on CRUD), so this just slices the current page out of it.
 *
 * When the underlying list shrinks — a search filter narrows results, or a row
 * is deleted — the active page is clamped back into range so the user is never
 * stranded on a now-empty page.
 */
export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  )

  return {
    page,
    pageCount,
    pageItems,
    setPage,
    next: () => setPage(p => Math.min(p + 1, pageCount)),
    prev: () => setPage(p => Math.max(p - 1, 1)),
    total: items.length,
    pageSize,
  }
}
