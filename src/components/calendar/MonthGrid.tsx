import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// A lightweight event shape — just what a day cell needs to render a chip.
export interface GridEvent {
  id: string
  title: string
  type: 'showing' | 'meeting' | 'inspection' | 'closing' | 'google'
}

// Chip palette reuses the app's event-type colors (NOT the reference's green),
// rendered as soft tinted pills so several can stack inside one day cell.
const CHIP_STYLES: Record<GridEvent['type'], string> = {
  showing:    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  meeting:    'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  inspection: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  closing:    'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  google:     'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

// Local-time YYYY-MM-DD key so cells line up with the page's selected-day filter.
function dateKey(d: Date): string {
  return d.toLocaleDateString('en-CA')
}

// A cell is either a real day or null (blank padding before/after the month).
export type Cell = Date | null

interface MonthGridProps {
  month: Date                              // any date within the month being shown
  eventsByDate: Map<string, GridEvent[]>   // keyed by local YYYY-MM-DD
  selected?: Date
  onSelect: (date: Date) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

// 0 = weeks start on Sunday (matches the reference). Set to 1 for a Monday start
// and the leading-blank math below adjusts automatically.
const WEEK_STARTS_ON = 0

/**
 * Build the rows of cells the month grid renders. Each week is exactly 7
 * `Cell`s — a `Date` for a day in this month, or `null` for the blank pad
 * cells shown before the 1st and after the last day. Leading blanks are
 * derived from the 1st's weekday (shifted by `WEEK_STARTS_ON`); trailing
 * blanks pad the final week out to 7 so the grid stays rectangular.
 */
function buildCalendarWeeks(month: Date): Cell[][] {
  const year = month.getFullYear()
  const m = month.getMonth()
  const daysInMonth = new Date(year, m + 1, 0).getDate()
  const lead = (new Date(year, m, 1).getDay() - WEEK_STARTS_ON + 7) % 7

  const cells: Cell[] = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, m, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: Cell[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function MonthGrid({ month, eventsByDate, selected, onSelect, onPrevMonth, onNextMonth }: MonthGridProps) {
  const weeks = buildCalendarWeeks(month)
  const todayKey = dateKey(new Date())
  const selectedKey = selected ? dateKey(selected) : undefined

  return (
    <Card className="p-4 sm:p-6">
      {/* Header: month label + prev/next navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrevMonth}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onNextMonth}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday header — rotated to match WEEK_STARTS_ON */}
      <div className="grid grid-cols-7">
        {[...WEEKDAYS.slice(WEEK_STARTS_ON), ...WEEKDAYS.slice(0, WEEK_STARTS_ON)].map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium uppercase text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid — inner borders form the gridlines */}
      <div className="rounded-lg border-t border-l border-border overflow-hidden">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((cell, ci) => {
              if (!cell) {
                return <div key={ci} className="min-h-[108px] border-b border-r border-border bg-muted/20" />
              }
              const key = dateKey(cell)
              const isToday = key === todayKey
              const isSelected = key === selectedKey
              const dayEvents = eventsByDate.get(key) ?? []
              return (
                <button
                  key={ci}
                  onClick={() => onSelect(cell)}
                  className={cn(
                    'min-h-[108px] border-b border-r border-border p-1.5 flex flex-col gap-1 text-left align-top transition-colors hover:bg-muted/40 cursor-pointer',
                    isSelected && 'bg-indigo-500/5 ring-1 ring-inset ring-indigo-500/30',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-sm shrink-0',
                      isToday ? 'bg-indigo-500 font-semibold text-white' : 'text-foreground',
                    )}
                  >
                    {cell.getDate()}
                  </span>
                  <div className="flex flex-col gap-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map(ev => (
                      <span
                        key={ev.id}
                        title={ev.title}
                        className={cn('truncate rounded px-1.5 py-0.5 text-[11px] font-medium', CHIP_STYLES[ev.type])}
                      >
                        {ev.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="px-1.5 text-[11px] text-muted-foreground">+{dayEvents.length - 2} more</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </Card>
  )
}
