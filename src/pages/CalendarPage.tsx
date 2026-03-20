import { useState } from 'react'
import { useEvents } from '@/hooks/useEvents'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Users } from 'lucide-react'
import type { CalendarEvent } from '@/types'

const EVENT_STYLES: Record<CalendarEvent['type'], string> = {
  showing: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  meeting: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  inspection: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  closing: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
}

export function CalendarPage() {
  const { events, loading, error } = useEvents()
  const [selected, setSelected] = useState<Date | undefined>(new Date('2026-03-10'))

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading calendar…</div>
  if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>

  const selectedDateStr = selected?.toISOString().split('T')[0]
  const todayEvents = events.filter(e => e.date === selectedDateStr)
  const allUpcoming = events.filter(e => e.date >= new Date().toISOString().split('T')[0]).slice(0, 5)

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        <p className="text-sm text-muted-foreground">{events.length} events this month</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        {/* Calendar picker */}
        <Card>
          <CardContent className="p-4">
            <Calendar mode="single" selected={selected} onSelect={setSelected} className="rounded-md" />
          </CardContent>
        </Card>

        {/* Events panel */}
        <div className="flex flex-col gap-4">
          {/* Selected day events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selected ? selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {todayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No events on this day</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {todayEvents.map(event => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border hover:border-border/60 transition-colors">
                      <Badge className={`shrink-0 capitalize ${EVENT_STYLES[event.type]}`}>{event.type}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{event.title}</p>
                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.time}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.attendees.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex flex-col gap-2">
                {allUpcoming.map(event => (
                  <div key={event.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className="flex flex-col items-center w-10 shrink-0">
                      <span className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-lg font-bold text-foreground leading-none">{new Date(event.date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.time} · {event.location}</p>
                    </div>
                    <Badge className={`shrink-0 capitalize ${EVENT_STYLES[event.type]}`}>{event.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
