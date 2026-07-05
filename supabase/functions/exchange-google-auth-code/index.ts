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
  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

  if (!supabaseUrl || !supabaseKey || !googleClientId || !googleClientSecret) {
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
    const { code } = body

    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing authorization code' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Get the redirect URI (same as used during auth request)
    // It's sent from the client to ensure it matches what was registered
    const { redirectUri } = body

    if (!redirectUri) {
      return new Response(JSON.stringify({ error: 'Missing redirect URI' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Exchange the authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      const errorMsg = errorData.error_description || errorData.error || 'Token exchange failed'
      console.error('Google token exchange error:', errorData)
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    // Calculate expiration time
    const expiresAt = Date.now() + (expires_in * 1000)

    // Store tokens in database
    const { error: dbError } = await supabase.from('user_google_tokens').upsert({
      user_id: userId,
      access_token,
      refresh_token: refresh_token || null,
      expires_at: Math.floor(expiresAt / 1000), // Store as Unix timestamp (seconds)
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(JSON.stringify({ error: 'Failed to save tokens' }), {
        status: 500,
        headers: corsHeaders,
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    })
  } catch (error) {
    console.error('Exchange token error:', error)
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
