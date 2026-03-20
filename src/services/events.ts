import { supabase } from '../lib/supabase'
import type { CalendarEvent } from '../types'

interface RawEvent {
  id: string
  title: string
  date: string
  time: string
  type: string
  location: string
  agent_attendees: string[]
}

export async function fetchEvents(): Promise<CalendarEvent[]> {
  const [eventsResult, agentsResult] = await Promise.all([
    supabase.from('calendar_events').select('*').order('date', { ascending: true }),
    supabase.from('agents').select('id, name'),
  ])
  if (eventsResult.error) throw new Error(eventsResult.error.message)
  if (agentsResult.error) throw new Error(agentsResult.error.message)

  const agentMap = new Map(
    (agentsResult.data as { id: string; name: string }[]).map(a => [a.id, a.name])
  )

  return (eventsResult.data as RawEvent[]).map(row => ({
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time,
    type: row.type as CalendarEvent['type'],
    location: row.location,
    attendeeIds: row.agent_attendees ?? [],
    attendees: (row.agent_attendees ?? []).map(id => agentMap.get(id) ?? id),
  }))
}

export async function createEvent(data: Omit<CalendarEvent, 'id' | 'attendees'>): Promise<CalendarEvent> {
  const { data: row, error } = await supabase
    .from('calendar_events')
    .insert({
      title: data.title,
      date: data.date,
      time: data.time,
      type: data.type,
      location: data.location,
      agent_attendees: data.attendeeIds,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  // Resolve attendee names after insert
  const agentsResult = await supabase.from('agents').select('id, name')
  const agentMap = new Map(
    (agentsResult.data ?? []).map((a: { id: string; name: string }) => [a.id, a.name])
  )
  const raw = row as RawEvent
  return {
    id: raw.id,
    title: raw.title,
    date: raw.date,
    time: raw.time,
    type: raw.type as CalendarEvent['type'],
    location: raw.location,
    attendeeIds: raw.agent_attendees ?? [],
    attendees: (raw.agent_attendees ?? []).map(id => agentMap.get(id) ?? id),
  }
}

export async function updateEvent(id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'attendees'>>): Promise<void> {
  const dbUpdates: Partial<RawEvent> = {}
  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.date !== undefined) dbUpdates.date = updates.date
  if (updates.time !== undefined) dbUpdates.time = updates.time
  if (updates.type !== undefined) dbUpdates.type = updates.type
  if (updates.location !== undefined) dbUpdates.location = updates.location
  if (updates.attendeeIds !== undefined) dbUpdates.agent_attendees = updates.attendeeIds
  const { error } = await supabase.from('calendar_events').update(dbUpdates).eq('id', id)
  if (error) throw new Error(error.message)
}
