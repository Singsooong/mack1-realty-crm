import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { googleCalendarService, type GoogleCalendarEvent } from '../services/google-calendar'

export interface MergedCalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string // ISO string
  endTime: string // ISO string
  location?: string
  attendees: Array<{ email: string; name?: string }>
  meetLink?: string
  source: 'local' | 'google'
  googleEventId?: string
}

export function useGoogleCalendar() {
  const { user } = useAuth()
  const [events, setEvents] = useState<MergedCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [connectedEmail, setConnectedEmail] = useState<string | null | undefined>(undefined)

  const getSupabaseToken = useCallback(async (): Promise<string> => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error('No active session')
    return token
  }, [])

  // Check if user has Google Calendar connected
  const checkGoogleAuth = useCallback(async () => {
    if (!user?.id) return false
    try {
      const tokens = await googleCalendarService.getStoredTokens(user.id)
      const hasAuth = !!tokens
      setIsAuthenticated(hasAuth)
      if (hasAuth) {
        const { data } = await supabase.auth.getSession()
        const sbToken = data.session?.access_token
        if (sbToken) {
          const email = await googleCalendarService.getConnectedEmail(user.id, sbToken)
          setConnectedEmail(email)
        }
      } else {
        setConnectedEmail(null)
      }
      return hasAuth
    } catch (err) {
      setIsAuthenticated(false)
      setConnectedEmail(null)
      return false
    }
  }, [user?.id])

  const fetchGoogleEvents = useCallback(async () => {
    if (!user?.id) return []
    try {
      const now = new Date()
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      const sbToken = await getSupabaseToken()
      const googleEvents = await googleCalendarService.fetchCalendarEvents(
        user.id,
        sbToken,
        now.toISOString(),
        nextMonth.toISOString()
      )

      return googleEvents.map(event => ({
        id: `google-${event.id}`,
        title: event.summary,
        description: event.description,
        startTime: event.start.dateTime || event.start.date || '',
        endTime: event.end.dateTime || event.end.date || '',
        location: event.location,
        attendees: (event.attendees || []).map(a => ({
          email: a.email,
          name: a.displayName,
        })),
        meetLink: event.hangoutLink,
        source: 'google' as const,
        googleEventId: event.id,
      }))
    } catch (err) {
      console.error('Failed to fetch Google Calendar events:', err)
      return []
    }
  }, [user?.id, getSupabaseToken])

  const refreshEvents = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const googleEvents = await fetchGoogleEvents()
      setEvents(googleEvents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [user?.id, fetchGoogleEvents])

  // Sequential init: confirm auth first, then fetch events.
  // Avoids the race condition where refreshEvents ran before tokens were in the DB.
  useEffect(() => {
    let cancelled = false
    async function init() {
      const hasAuth = await checkGoogleAuth()
      if (cancelled) return
      if (hasAuth) {
        await refreshEvents()
      } else {
        setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [checkGoogleAuth, refreshEvents])

  const createGoogleEvent = useCallback(
    async (event: Omit<GoogleCalendarEvent, 'id'>) => {
      if (!user?.id) throw new Error('User not authenticated')
      const sbToken = await getSupabaseToken()
      const created = await googleCalendarService.createCalendarEvent(user.id, sbToken, event)
      await refreshEvents()
      return created
    },
    [user?.id, refreshEvents]
  )

  const deleteGoogleEvent = useCallback(
    async (eventId: string) => {
      if (!user?.id) throw new Error('User not authenticated')
      const sbToken = await getSupabaseToken()
      const googleEventId = eventId.replace('google-', '')
      await googleCalendarService.deleteCalendarEvent(user.id, sbToken, googleEventId)
      await refreshEvents()
    },
    [user?.id, refreshEvents]
  )

  const updateGoogleEvent = useCallback(
    async (eventId: string, updates: Parameters<typeof googleCalendarService.updateCalendarEvent>[3]) => {
      if (!user?.id) throw new Error('User not authenticated')
      const sbToken = await getSupabaseToken()
      const googleEventId = eventId.replace('google-', '')
      await googleCalendarService.updateCalendarEvent(user.id, sbToken, googleEventId, updates)
      await refreshEvents()
    },
    [user?.id, refreshEvents, getSupabaseToken]
  )

  // Called by CalendarPage when it becomes visible after OAuth redirect
  const reinitialize = useCallback(async () => {
    const hasAuth = await checkGoogleAuth()
    if (hasAuth) await refreshEvents()
  }, [checkGoogleAuth, refreshEvents])

  const getAuthUrl = useCallback(async () => {
    return await googleCalendarService.getAuthUrl()
  }, [])

  const disconnect = useCallback(async () => {
    if (!user?.id) throw new Error('User not authenticated')
    await googleCalendarService.disconnectCalendar(user.id)
    setIsAuthenticated(false)
    setConnectedEmail(null)
    setEvents([])
  }, [user?.id])

  return {
    events,
    loading,
    error,
    isAuthenticated,
    connectedEmail,
    reinitialize,
    refreshEvents,
    createGoogleEvent,
    updateGoogleEvent,
    deleteGoogleEvent,
    getAuthUrl,
    disconnect,
  }
}
