import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, MapPin, Users, Video, FileText, ExternalLink, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import type { CalendarEvent } from '@/types'
import type { MergedCalendarEvent } from '@/hooks/useGoogleCalendar'

const EVENT_STYLES: Record<CalendarEvent['type'], string> = {
  showing: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  meeting: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  inspection: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  closing: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
}

type EventDetail =
  | { kind: 'local'; event: CalendarEvent }
  | { kind: 'google'; event: MergedCalendarEvent }

interface EventDetailDialogProps {
  detail: EventDetail | null
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => Promise<void>
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  )
}

export function EventDetailDialog({ detail, onClose, onEdit, onDelete }: EventDetailDialogProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setConfirmingDelete(false)
    setDeleting(false)
  }, [detail])

  if (!detail) return null

  if (detail.kind === 'local') {
    const { event } = detail
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <Badge className={`capitalize ${EVENT_STYLES[event.type]}`}>{event.type}</Badge>
              {event.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <Row icon={<Clock className="h-4 w-4" />} label="Date & Time">
              {event.date} · {event.time}
            </Row>
            {event.location && (
              <Row icon={<MapPin className="h-4 w-4" />} label="Location">
                {event.location}
              </Row>
            )}
            {event.attendees.length > 0 && (
              <Row icon={<Users className="h-4 w-4" />} label="Attendees">
                <div className="flex flex-col gap-1">
                  {event.attendees.map((name, i) => (
                    <span key={i}>{name}</span>
                  ))}
                </div>
              </Row>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const { event } = detail
  const start = new Date(event.startTime)
  const end = new Date(event.endTime)
  const dateStr = start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Google</Badge>
            {event.title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          <Row icon={<Clock className="h-4 w-4" />} label="Date & Time">
            {dateStr} · {timeStr}
          </Row>
          {event.location && (
            <Row icon={<MapPin className="h-4 w-4" />} label="Location">
              {event.location}
            </Row>
          )}
          {event.description && (
            <Row icon={<FileText className="h-4 w-4" />} label="Description">
              <p className="whitespace-pre-wrap text-muted-foreground">{event.description}</p>
            </Row>
          )}
          {event.attendees.length > 0 && (
            <Row icon={<Users className="h-4 w-4" />} label="Attendees">
              <div className="flex flex-col gap-1">
                {event.attendees.map((a, i) => (
                  <span key={i}>{a.name ? `${a.name} (${a.email})` : a.email}</span>
                ))}
              </div>
            </Row>
          )}
          {event.meetLink && (
            <Row icon={<Video className="h-4 w-4 text-blue-500" />} label="Google Meet">
              <Button
                asChild                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white mt-1"
              >
                <a href={event.meetLink} target="_blank" rel="noopener noreferrer">
                  <Video className="h-3.5 w-3.5" />
                  Join Meeting
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              </Button>
            </Row>
          )}
        </div>

        {(onEdit || onDelete) && !confirmingDelete && (
          <div className="flex gap-2 pt-2 border-t border-border mt-2">
            {onEdit && (
              <Button variant="outline" className="flex-1 gap-2" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" className="flex-1 gap-2 text-destructive hover:text-destructive hover:border-destructive" onClick={() => setConfirmingDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        )}

        {confirmingDelete && (
          <div className="flex flex-col gap-3 pt-2 border-t border-border mt-2">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Delete this meeting from Google Calendar?
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button                variant="destructive"
                className="flex-1"
                disabled={deleting}
                onClick={async () => {
                  if (!onDelete) return
                  setDeleting(true)
                  try {
                    await onDelete()
                    onClose()
                  } finally {
                    setDeleting(false)
                  }
                }}
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
