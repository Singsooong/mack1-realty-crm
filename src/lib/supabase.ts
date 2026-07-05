import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env and fill in your project values.'
  )
}

// --- Optional 401 safety net -------------------------------------------------
// Belt-and-suspenders for the rare case where a request fires with a stale JWT
// and supabase-js doesn't emit SIGNED_OUT on its own (e.g. tab backgrounded for
// hours, autoRefresh hadn't caught up). Normal token expiry is handled by
// autoRefreshToken; this only reacts to a 401 that actually reaches the wire.
//
// Re-entrancy guard: once we've reacted, in-flight requests shouldn't each fire
// their own signOut().
let handlingAuthFailure = false

const authAwareFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init)

  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  // Ignore 401s from the auth endpoints themselves — a wrong password at login
  // or the refresh/logout calls are NOT "the session died mid-use".
  const isAuthEndpoint = url.includes('/auth/v1/')

  if (response.status === 401 && !isAuthEndpoint && !handlingAuthFailure) {
    handlingAuthFailure = true
    // scope:'local' clears the session client-side without a server round-trip
    // using a token we already know is rejected. This emits SIGNED_OUT, which
    // AuthProvider.onAuthStateChange picks up -> handleSessionEnded -> login
    // screen + "session expired" toast. Note: this path does NOT set
    // intentionalSignOutRef, so handleSessionEnded correctly treats it as an
    // involuntary logout.
    supabase.auth.signOut({ scope: 'local' }).finally(() => {
      handlingAuthFailure = false
    })
  }

  return response
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: { fetch: authAwareFetch },
})
