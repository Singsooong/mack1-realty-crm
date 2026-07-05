import { supabase } from '../lib/supabase'

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  location?: string
  attendees?: Array<{ email: string; displayName?: string }>
  hangoutLink?: string
}

interface GoogleAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

class GoogleCalendarService {
  private clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  private apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  private scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ]
  private getRedirectUri = () => {
    // Use the current origin to handle different ports (localhost:5173, 5174, etc)
    return `${window.location.origin}/google-auth-callback`
  }

  async getAuthUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.getRedirectUri(),
      response_type: 'code',
      scope: this.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    })
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  async exchangeCodeForToken(code: string, accessToken: string): Promise<GoogleAuthTokens> {
    // Call the secure Edge Function to exchange code for tokens
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const redirectUri = this.getRedirectUri()

    const response = await fetch(`${supabaseUrl}/functions/v1/exchange-google-auth-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ code, redirectUri }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to exchange code for token')
    }

    // The tokens are already saved by the Edge Function, so we just return a placeholder
    // The actual tokens will be retrieved from the database when needed
    return {
      accessToken: 'stored_securely',
      refreshToken: undefined,
      expiresAt: Date.now() + 3600 * 1000,
    }
  }

  async refreshAccessToken(_supabaseAccessToken: string): Promise<string> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

    // Ensure we have a fresh, valid Supabase JWT before calling the edge function
    let { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      const refreshed = await supabase.auth.refreshSession()
      session = refreshed.data.session
    }
    if (!session?.access_token) throw new Error('No active Supabase session')

    const response = await fetch(`${supabaseUrl}/functions/v1/refresh-google-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      if (err.error === 'google_auth_expired') {
        throw new Error('GOOGLE_AUTH_EXPIRED')
      }
      const msg = err.error || err.message || `Edge function ${response.status}`
      throw new Error(msg)
    }

    const data = await response.json()
    return data.access_token
  }

  async getStoredTokens(userId: string): Promise<GoogleAuthTokens | null> {
    const { data, error } = await supabase
      .from('user_google_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) return null
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? undefined,
      expiresAt: data.expires_at,
    }
  }

  async saveTokens(userId: string, tokens: GoogleAuthTokens): Promise<void> {
    const { error } = await supabase.from('user_google_tokens').upsert({
      user_id: userId,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt,
      updated_at: new Date().toISOString(),
    })

    if (error) throw new Error(`Failed to save tokens: ${error.message}`)
  }

  async getValidAccessToken(userId: string, supabaseAccessToken: string): Promise<string> {
    const tokens = await this.getStoredTokens(userId)
    if (!tokens) throw new Error('No Google Calendar tokens found')

    // expires_at is stored as Unix seconds; compare against current time in seconds
    const nowSeconds = Math.floor(Date.now() / 1000)
    if (nowSeconds >= tokens.expiresAt) {
      // Refresh via edge function (requires client_secret, server-side only)
      return await this.refreshAccessToken(supabaseAccessToken)
    }

    return tokens.accessToken
  }

  private async doFetchEvents(accessToken: string, params: URLSearchParams): Promise<Response> {
    return fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  }

  async fetchCalendarEvents(userId: string, supabaseAccessToken: string, timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      showDeleted: 'false',
      singleEvents: 'true',
      orderBy: 'startTime',
    })

    if (timeMin) params.append('timeMin', timeMin)
    if (timeMax) params.append('timeMax', timeMax)

    let accessToken = await this.getValidAccessToken(userId, supabaseAccessToken)
    let response = await this.doFetchEvents(accessToken, params)

    // If 401, the stored token may be stale (e.g. saved with wrong expiry unit).
    // Force a refresh and retry once before giving up.
    if (response.status === 401) {
      accessToken = await this.refreshAccessToken(supabaseAccessToken)
      response = await this.doFetchEvents(accessToken, params)
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.error?.message || response.statusText || 'Unknown error'
      throw new Error(`Failed to fetch Google Calendar events: ${errorMsg}`)
    }

    const data = await response.json()
    return data.items || []
  }

  async createCalendarEvent(userId: string, supabaseAccessToken: string, event: Omit<GoogleCalendarEvent, 'id'>): Promise<GoogleCalendarEvent> {
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
    if ((event as any).conferenceData) {
      url.searchParams.append('conferenceDataVersion', '1')
    }

    const doRequest = (token: string) =>
      fetch(url.toString(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })

    let accessToken = await this.getValidAccessToken(userId, supabaseAccessToken)
    let response = await doRequest(accessToken)

    if (response.status === 401) {
      accessToken = await this.refreshAccessToken(supabaseAccessToken)
      response = await doRequest(accessToken)
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.error?.message || response.statusText || 'Unknown error'
      throw new Error(`Failed to create Google Calendar event: ${errorMsg}`)
    }

    return response.json()
  }

  async getConnectedEmail(userId: string, supabaseAccessToken: string): Promise<string | null> {
    let accessToken = await this.getValidAccessToken(userId, supabaseAccessToken)
    let response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (response.status === 401) {
      accessToken = await this.refreshAccessToken(supabaseAccessToken)
      response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    }
    if (!response.ok) return null
    const data = await response.json()
    // The primary calendar's `id` is always the owner's email address
    return data.id ?? null
  }

  async disconnectCalendar(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_google_tokens')
      .delete()
      .eq('user_id', userId)

    if (error) throw new Error(`Failed to disconnect Google Calendar: ${error.message}`)
  }

  async updateCalendarEvent(userId: string, supabaseAccessToken: string, eventId: string, updates: Partial<Omit<GoogleCalendarEvent, 'id'>>): Promise<GoogleCalendarEvent> {
    const doRequest = (token: string) =>
      fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

    let accessToken = await this.getValidAccessToken(userId, supabaseAccessToken)
    let response = await doRequest(accessToken)

    if (response.status === 401) {
      accessToken = await this.refreshAccessToken(supabaseAccessToken)
      response = await doRequest(accessToken)
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.error?.message || response.statusText || 'Unknown error'
      throw new Error(`Failed to update Google Calendar event: ${errorMsg}`)
    }

    return response.json()
  }

  async deleteCalendarEvent(userId: string, supabaseAccessToken: string, eventId: string): Promise<void> {
    const doRequest = (token: string) =>
      fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

    let accessToken = await this.getValidAccessToken(userId, supabaseAccessToken)
    let response = await doRequest(accessToken)

    if (response.status === 401) {
      accessToken = await this.refreshAccessToken(supabaseAccessToken)
      response = await doRequest(accessToken)
    }

    if (!response.ok) {
      throw new Error(`Failed to delete Google Calendar event: ${response.statusText}`)
    }
  }
}

export const googleCalendarService = new GoogleCalendarService()
