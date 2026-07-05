import { useState } from 'react'
import { Bell, CheckCheck, FileSignature } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useRouter } from '@/lib/router'
import { useNotifications } from '@/hooks/useNotifications'
import { buildEsignNotificationCopy } from '@/services/notifications'
import type { AppNotification } from '@/types'

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Show up to this many rows at full height; beyond it the list scrolls.
const VISIBLE_LIMIT = 5

/** Local midnight at the start of the current calendar week (Sunday). */
function startOfWeek(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d.getTime()
}

/** Split the flat (newest-first) list into date buckets, dropping empty ones. */
function groupByWeek(notifications: AppNotification[]) {
  const weekStart = startOfWeek()
  const groups: { label: string; items: AppNotification[] }[] = [
    { label: 'This week', items: [] },
    { label: 'Earlier', items: [] },
  ]
  for (const n of notifications) {
    const bucket = new Date(n.createdAt).getTime() >= weekStart ? groups[0] : groups[1]
    bucket.items.push(n)
  }
  return groups.filter(g => g.items.length > 0)
}

export function NotificationBell() {
  const { notifications, unreadCount, loading, loadingMore, hasMore, loadMore, markRead, markAllRead } =
    useNotifications()
  const { navigate } = useRouter()
  const [open, setOpen] = useState(false)

  const scrollable = notifications.length > VISIBLE_LIMIT
  const groups = groupByWeek(notifications)

  function handleClick(n: AppNotification) {
    if (!n.readAt) void markRead(n.id)
    setOpen(false)
    if (n.documentId) navigate('esign', { doc: n.documentId })
    else navigate('esign')
  }

  function renderRow(n: AppNotification) {
    const copy = buildEsignNotificationCopy(n)
    return (
      <button
        key={n.id}
        onClick={() => handleClick(n)}
        className={cn(
          'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50',
          !n.readAt && 'bg-muted/30',
        )}
      >
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-950">
          <FileSignature className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{copy.title}</p>
          <p className="truncate text-xs text-muted-foreground">{copy.description}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatRelative(n.createdAt)}</p>
        </div>
        {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />}
      </button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={() => void markAllRead()}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>

        <div className={cn('overflow-y-auto', scrollable && 'max-h-[380px]')}>
          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            groups.map(group => (
              <div key={group.label}>
                <p className="sticky top-0 z-10 bg-popover px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  {group.label}
                </p>
                {group.items.map(renderRow)}
              </div>
            ))
          )}
        </div>

        {hasMore && (
          <div className="border-t border-border">
            <button
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="w-full px-4 py-2.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
