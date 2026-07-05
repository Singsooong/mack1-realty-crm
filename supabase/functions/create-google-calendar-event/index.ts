import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { decodeBase64 } from "jsr:@std/encoding/base64"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// Decode JWT payload without verification (we trust Supabase)
function decodeJWT(token: string) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid token format')

  const decoded = new TextDecoder().decode(
    decodeBase64(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
  )
  return JSON.parse(decoded)
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
      status: 500,
      headers: corsHeaders,
    })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const token = authHeader.replace('Bearer ', '')

    // Decode JWT to get user ID (Supabase verifies with verify_jwt: true)
    const payload = decodeJWT(token)
    const userId = payload.sub

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const body = await req.json()
    const { event, includeGoogleMeet } = body

    // Get the user's Google access token
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_google_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .single()

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: 'Google Calendar not connected' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    // Add conference data if requested
    if (includeGoogleMeet) {
      event.conferenceData = {
        createRequest: {
          requestId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      }
    }

    // Create the event with proper parameters
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
    if (includeGoogleMeet) {
      url.searchParams.append('conferenceDataVersion', '1')
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return new Response(JSON.stringify({
        error: `Failed to create event: ${errorData.error?.message || response.statusText}`
      }), {
        status: response.status,
        headers: corsHeaders,
      })
    }

    const createdEvent = await response.json()
    return new Response(JSON.stringify(createdEvent), {
      status: 200,
      headers: corsHeaders,
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
