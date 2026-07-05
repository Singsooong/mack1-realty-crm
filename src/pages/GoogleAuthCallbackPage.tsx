import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from '@/lib/router'
import { googleCalendarService } from '@/services/google-calendar'
import { supabase } from '@/lib/supabase'

export function GoogleAuthCallbackPage() {
  const { navigate } = useRouter()
  const { user, authLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // Guard against StrictMode double-invocation: OAuth codes are single-use
  const hasProcessed = useRef(false)

  useEffect(() => {
    // Wait for auth to load first
    if (authLoading) return
    // Prevent double-execution (React StrictMode mounts effects twice in dev)
    if (hasProcessed.current) return
    hasProcessed.current = true

    async function handleCallback() {
      if (!user?.id) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const errorParam = params.get('error')

      if (errorParam) {
        setError(`Google auth failed: ${errorParam}`)
        setLoading(false)
        return
      }

      if (!code) {
        setError('No authorization code received')
        setLoading(false)
        return
      }

      try {
        // Get the user's session and access token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session?.access_token) {
          console.error('Session error:', sessionError)
          throw new Error('Failed to get user session')
        }

        // Exchange the authorization code for Google tokens (via Edge Function)
        await googleCalendarService.exchangeCodeForToken(code, session.access_token)
        setLoading(false)
        // Replace history entry to strip OAuth params (code, iss, scope) from the URL
        window.history.replaceState({}, '', '/calendar')
        navigate('calendar')
      } catch (err) {
        console.error('Google auth error:', err)
        setError(err instanceof Error ? err.message : 'Failed to authenticate with Google')
        setLoading(false)
      }
    }

    handleCallback()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Connecting Google Calendar…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => navigate('calendar')}
            className="text-sm text-primary hover:underline"
          >
            Back to calendar
          </button>
        </div>
      </div>
    )
  }

  return null
}
