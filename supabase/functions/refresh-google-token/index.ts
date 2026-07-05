import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

  if (!supabaseUrl || !supabaseKey || !googleClientId || !googleClientSecret) {
    return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
      status: 500, headers: corsHeaders,
    })
  }

  // Service-role client for DB writes and auth validation
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: corsHeaders,
      })
    }

    const token = authHeader.replace('Bearer ', '')

    // Validate JWT via Supabase auth — works for both HS256 and ES256 tokens
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401, headers: corsHeaders,
      })
    }

    const userId = user.id

    // Fetch stored refresh token for this user
    const { data: row, error: dbReadError } = await supabase
      .from('user_google_tokens')
      .select('refresh_token')
      .eq('user_id', userId)
      .single()

    if (dbReadError || !row?.refresh_token) {
      return new Response(JSON.stringify({ error: 'No refresh token found — reconnect Google Calendar' }), {
        status: 400, headers: corsHeaders,
      })
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: row.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))

      // invalid_grant means the refresh token was revoked or expired (e.g. 7-day testing-mode limit).
      // Delete the stale row so the UI prompts reconnect instead of looping.
      if (errorData.error === 'invalid_grant') {
        await supabase.from('user_google_tokens').delete().eq('user_id', userId)
        return new Response(JSON.stringify({ error: 'google_auth_expired' }), {
          status: 401, headers: corsHeaders,
        })
      }

      const errorMsg = errorData.error_description || errorData.error || 'Token refresh failed'
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400, headers: corsHeaders,
      })
    }

    const tokenData = await tokenResponse.json()
    const { access_token, expires_in } = tokenData
    const expiresAt = Math.floor(Date.now() / 1000) + expires_in

    const { error: dbWriteError } = await supabase
      .from('user_google_tokens')
      .update({
        access_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (dbWriteError) {
      return new Response(JSON.stringify({ error: 'Failed to save refreshed token' }), {
        status: 500, headers: corsHeaders,
      })
    }

    return new Response(JSON.stringify({ access_token, expires_at: expiresAt }), {
      status: 200, headers: corsHeaders,
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500, headers: corsHeaders })
  }
})
