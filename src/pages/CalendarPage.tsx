import { useState, useEffect } from 'react'
import { useEvents } from '@/hooks/useEvents'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { useContacts } from '@/hooks/useContacts'
import { useRouter } from '@/lib/router'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Users, Video, X } from 'lucide-react'
import { MonthGrid, type GridEvent } from '@/components/calendar/MonthGrid'
import { GoogleCalendarButton } from '@/components/calendar/GoogleCalendarButton'
import { ScheduleMeetingDialog, type ScheduleMeetingData } from '@/components/calendar/ScheduleMeetingDialog'
import { EventDetailDialog } from '@/components/calendar/EventDetailDialog'
import { EditMeetingDialog } from '@/components/calendar/EditMeetingDialog'
import { CalendarPageSkeleton } from '@/components/calendar/CalendarPageSkeleton'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { CalendarEvent } from '@/types'
import type { MergedCalendarEvent } from '@/hooks/useGoogleCalendar'

const EVENT_STYLES: Record<CalendarEvent['type'], string> = {
  showing: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  meeting: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  inspection: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  closing: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
}

// One normalized shape for both local and Google events; `raw` is kept so the
// detail dialog can branch back to source-specific actions (edit/delete).
interface DisplayEvent {
  id: string
  dateStr: string                  // local YYYY-MM-DD
  time: string                     // display string, e.g. "3:30 PM"
  title: string
  location?: string
  attendees: string[]
  kind: 'local' | 'google'
  type?: CalendarEvent['type']     // only on local events
  meetLink?: string                // only on Google events
  sortAt: number                   // epoch ms for chronological ordering
  raw: CalendarEvent | MergedCalendarEvent
}

// Parse a 12-hour time label ("2:00 PM", "10:00 AM") into minutes since midnight.
// Returns 0 for anything it can't read, so a malformed time just sorts first.
function parseTimeToMinutes(time: string): number {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!m) return 0
  let h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  const ap = m[3]?.toUpperCase()
  if (ap === 'PM' && h !== 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return h * 60 + min
}

export function CalendarPage() {
  const { page } = useRouter()
  const { user } = useAuth()
  const { events: localEvents, loading: localLoading, error: localError } = useEvents()
  const { events: googleEvents, isAuthenticated: googleConnected, connectedEmail, reinitialize, refreshEvents, updateGoogleEvent, deleteGoogleEvent, getAuthUrl, disconnect } = useGoogleCalendar()

  useEffect(() => {
    if (page === 'calendar') reinitialize()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])
  const { contacts } = useContacts()
  const [selected, setSelected] = useState<Date | undefined>(new Date())
  const [viewMonth, setViewMonth] = useState<Date>(() => new Date())
  const [detailEvent, setDetailEvent] = useState<
    | { kind: 'local'; event: CalendarEvent }
    | { kind: 'google'; event: MergedCalendarEvent }
    | null
  >(null)
  const [editingEvent, setEditingEvent] = useState<MergedCalendarEvent | null>(null)

  const loading = localLoading
  const error = localError

  if (loading) return <CalendarPageSkeleton />
  if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>

  // Collapse the two event sources (local CRM + Google) into one display shape
  // so the grid and sidebar render uniformly. We keep `raw` to re-discriminate
  // when opening the detail dialog (local vs Google get different actions).
  const displayEvents: DisplayEvent[] = [
    ...localEvents.map<DisplayEvent>(e => ({
      id: e.id,
      dateStr: e.date,
      time: e.time,
      title: e.title,
      location: e.location,
      attendees: e.attendees,
      kind: 'local',
      type: e.type,
      sortAt: new Date(`${e.date}T00:00:00`).getTime() + parseTimeToMinutes(e.time) * 60000,
      raw: e,
    })),
    ...googleEvents.map<DisplayEvent>(e => ({
      id: e.id,
      dateStr: new Date(e.startTime).toLocaleDateString('en-CA'),  // local key, not UTC
      time: new Date(e.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      title: e.title,
      location: e.location,
      attendees: e.attendees.map(a => a.name || a.email),
      kind: 'google',
      meetLink: e.meetLink,
      sortAt: new Date(e.startTime).getTime(),
      raw: e,
    })),
  ]

  // Index events by local YYYY-MM-DD for the month grid's day cells.
  const eventsByDate = new Map<string, GridEvent[]>()
  for (const e of displayEvents) {
    const list = eventsByDate.get(e.dateStr) ?? []
    list.push({ id: e.id, title: e.title, type: e.kind === 'google' ? 'google' : e.type! })
    eventsByDate.set(e.dateStr, list)
  }

  const selectedDateStr = selected?.toLocaleDateString('en-CA')
  const selectedEvents = displayEvents
    .filter(e => e.dateStr === selectedDateStr)
    .sort((a, b) => a.sortAt - b.sortAt)

  const todayStr = new Date().toLocaleDateString('en-CA')
  const allUpcoming = displayEvents
    .filter(e => e.dateStr >= todayStr)
    .sort((a, b) => a.sortAt - b.sortAt)
    .slice(0, 8)

  function openDetail(e: DisplayEvent) {
    if (e.kind === 'local') setDetailEvent({ kind: 'local', event: e.raw as CalendarEvent })
    else setDetailEvent({ kind: 'google', event: e.raw as MergedCalendarEvent })
  }

  async function handleScheduleMeeting(data: ScheduleMeetingData) {
    if (!user?.id) throw new Error('User not authenticated')

    // Check for duplicate meetings with same date and time
    const hasDuplicate = [
      ...localEvents,
      ...googleEvents,
    ].some(event => {
      const eventDate = 'startTime' in event
        ? event.startTime.split('T')[0]
        : event.date
      const eventStart = 'startTime' in event
        ? event.startTime.split('T')[1]?.substring(0, 5)
        : event.time.split(' - ')[0]

      return eventDate === data.date && eventStart === data.startTime
    })

    if (hasDuplicate) {
      throw new Error(`A meeting already exists on ${data.date} at ${data.startTime}`)
    }

    const googleEvent: any = {
      summary: data.title,
      description: data.description,
      start: {
        dateTime: `${data.date}T${data.startTime}:00`,
        timeZone: 'Asia/Manila',
      },
      end: {
        dateTime: `${data.date}T${data.endTime}:00`,
        timeZone: 'Asia/Manila',
      },
      location: data.location,
      attendees: [
        { email: data.clientEmail },
        ...data.attendeeEmails.map(email => ({ email })),
      ],
    }

    // Use Edge Function to create event (handles Google Meet creation server-side)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) throw new Error('Failed to get auth token')
    const token = session.access_token

    const response = await fetch(`${supabaseUrl}/functions/v1/create-google-calendar-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        event: googleEvent,
        includeGoogleMeet: data.includeGoogleMeet,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create Google Calendar event')
    }

    // Refresh events after creation
    await refreshEvents()
  }

  async function handleUpdateMeeting(eventId: string, data: ScheduleMeetingData) {
    await updateGoogleEvent(eventId, {
      summary: data.title,
      description: data.description,
      start: { dateTime: `${data.date}T${data.startTime}:00`, timeZone: 'Asia/Manila' },
      end: { dateTime: `${data.date}T${data.endTime}:00`, timeZone: 'Asia/Manila' },
      location: data.location,
      attendees: [
        { email: data.clientEmail },
        ...data.attendeeEmails.map(email => ({ email })),
      ],
    })
  }

  async function handleDeleteMeeting(eventId: string) {
    await deleteGoogleEvent(eventId)
    toast.success('Meeting deleted')
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium leading-tight text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            {displayEvents.filter(e => e.dateStr >= todayStr).length} upcoming meetings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GoogleCalendarButton isAuthenticated={googleConnected} connectedEmail={connectedEmail} getAuthUrl={getAuthUrl} disconnect={disconnect} />
          <ScheduleMeetingDialog onSchedule={handleScheduleMeeting} contacts={contacts.map(c => ({ name: c.name, email: c.email }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Month grid */}
        <MonthGrid
          month={viewMonth}
          eventsByDate={eventsByDate}
          selected={selected}
          onSelect={setSelected}
          onPrevMonth={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          onNextMonth={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
        />

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Selected-day detail */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">
                {selected
                  ? selected.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'Select a date'}
              </h2>
              {selected && (
                <button
                  onClick={() => setSelected(undefined)}
                  aria-label="Clear selection"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {!selected ? (
              <p className="text-sm text-muted-foreground py-2">Pick a day to see its meetings.</p>
            ) : selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No meetings on this day.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {selectedEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => openDetail(event)}
                    className="rounded-lg border border-border p-3 text-left hover:border-indigo-500/40 hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground text-sm leading-snug">{event.title}</p>
                      <Badge className={`shrink-0 capitalize ${event.kind === 'google' ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' : EVENT_STYLES[event.type!]}`}>
                        {event.kind === 'google' ? 'Google' : event.type}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-2.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 shrink-0" />{event.time}</span>
                      {event.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" />{event.location}</span>}
                      {event.attendees.length > 0 && <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 shrink-0" />{event.attendees.join(', ')}</span>}
                      {event.meetLink && <span className="flex items-center gap-1.5 text-indigo-500"><Video className="h-3.5 w-3.5 shrink-0" />Google Meet</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming */}
          <Card className="p-5">
            <h2 className="text-base font-semibold text-foreground mb-3">Upcoming</h2>
            {allUpcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No upcoming meetings.</p>
            ) : (
              <div className="flex flex-col">
                {allUpcoming.map(event => {
                  const d = new Date(`${event.dateStr}T00:00:00`)
                  return (
                    <button
                      key={event.id}
                      onClick={() => openDetail(event)}
                      className="flex items-center gap-3 py-3 border-b border-border last:border-0 hover:bg-muted/40 rounded-md -mx-1 px-1 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex flex-col items-center justify-center w-11 h-11 shrink-0 rounded-lg bg-muted">
                        <span className="text-[10px] font-medium uppercase text-muted-foreground leading-none">
                          {d.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-base font-bold text-foreground leading-tight">{d.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.time}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <EventDetailDialog
        detail={detailEvent}
        onClose={() => setDetailEvent(null)}
        onEdit={detailEvent?.kind === 'google' ? () => {
          setEditingEvent(detailEvent.event)
          setDetailEvent(null)
        } : undefined}
        onDelete={detailEvent?.kind === 'google' ? () => handleDeleteMeeting(detailEvent.event.id) : undefined}
      />

      {editingEvent && (
        <EditMeetingDialog
          event={editingEvent}
          contacts={contacts.map(c => ({ name: c.name, email: c.email }))}
          onUpdate={(data) => handleUpdateMeeting(editingEvent.id, data)}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  )
}
