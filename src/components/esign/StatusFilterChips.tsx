import { cn } from '@/lib/utils'
import type { Document } from '@/types'

export type StatusFilterValue = 'all' | Document['status']

type ChipConfig = {
  value: StatusFilterValue
  label: string
  /** Dot color when the chip is active. */
  dot: string
  /** Background + text + border when the chip is active. Mirrors the table badge colors. */
  active: string
}

// Order matters: this is the left-to-right display order. "expired" is rendered
// last and only when there are expired documents (see ESignPage), so it never
// adds clutter when the count is zero.
const CHIPS: ChipConfig[] = [
  {
    value: 'all',
    label: 'All',
    dot: 'bg-foreground',
    active: 'bg-foreground/10 text-foreground border-border',
  },
  {
    value: 'sent',
    label: 'Sent',
    dot: 'bg-blue-500',
    active: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900',
  },
  {
    value: 'signed',
    label: 'Signed',
    dot: 'bg-emerald-500',
    active:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900',
  },
  {
    value: 'draft',
    label: 'Drafts',
    dot: 'bg-muted-foreground',
    active: 'bg-muted text-foreground border-border',
  },
  {
    value: 'expired',
    label: 'Expired',
    dot: 'bg-red-500',
    active: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900',
  },
]

interface StatusFilterChipsProps {
  value: StatusFilterValue
  onChange: (value: StatusFilterValue) => void
  counts: Record<StatusFilterValue, number>
}

export function StatusFilterChips({ value, onChange, counts }: StatusFilterChipsProps) {
  // Hide the "Expired" chip entirely unless there's something to filter — keeps
  // the common case (draft/sent/signed) uncluttered.
  const chips = CHIPS.filter(chip => chip.value !== 'expired' || counts.expired > 0)

  return (
    <div role="tablist" aria-label="Filter documents by status" className="flex flex-wrap items-center gap-2">
      {chips.map(chip => {
        const isActive = value === chip.value
        return (
          <button
            key={chip.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(chip.value)}
            className={cn(
              'inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              isActive
                ? chip.active
                : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors',
                isActive ? chip.dot : 'bg-muted-foreground/40',
              )}
            />
            {chip.label}
            <span className={cn('text-xs tabular-nums', isActive ? 'opacity-70' : 'opacity-60')}>
              {counts[chip.value]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
