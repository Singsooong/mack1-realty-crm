import { useState, useEffect } from 'react'
import { fetchEvents, createEvent, deleteEvent } from '../services/events'
import type { CalendarEvent } from '../types'

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreateEvent(data: Omit<CalendarEvent, 'id' | 'attendees'>) {
    const created = await createEvent(data)
    setEvents(prev => [...prev, created])
    return created
  }

  async function handleDeleteEvent(id: string) {
    await deleteEvent(id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  return { events, loading, error, createEvent: handleCreateEvent, deleteEvent: handleDeleteEvent }
}
