import { useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import type { Agent } from '../types'
import { AuthContext } from './auth-context'

async function fetchAgentRecord(userId: string): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) console.error('[Auth] fetchAgentRecord error:', error)
  if (!data) return null
  // The agents table allows nulls on these columns; coerce to the Agent type's
  // non-null shape, matching the convention in services/agents.ts transformAgent.
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone ?? '',
    avatarUrl: data.avatar_url ?? '',
    specialty: data.specialty ?? '',
    listings: data.listings ?? 0,
    sales: data.sales ?? 0,
    revenue: data.revenue ?? '',
    rating: data.rating ?? 0,
    status: (data.status as Agent['status']) ?? 'active',
    role: (data.role as Agent['role']) ?? 'agent',
  }
}

/**
 * Called whenever the session transitions to "no user". Decides how to react
 * to the session ending, based on whether it was deliberate.
 *
 * @param event       the Supabase auth event that fired (e.g. 'SIGNED_OUT')
 * @param intentional true if our own signOut() triggered this; false if the
 *                    session died on its own (refresh failed / token revoked)
 *
 * TODO(you): implement. When `intentional` is false, the user is being kicked
 * out involuntarily — they should be told why. When it's true, signOut()
 * already shows its own "Signed out" toast, so this should stay quiet to
 * avoid a double toast. Use `toast.error(...)` from 'sonner' (already imported).
 * Consider: do you want a different message for an expired session vs. one that
 * was revoked? (You can't always tell them apart from the client, so a single
 * clear "Your session has expired — please sign in again." is usually enough.)
 */
function handleSessionEnded(_event: string, intentional: boolean): void {
  // Deliberate signOut() already shows its own "Signed out" toast — stay quiet
  // here to avoid a double toast.
  if (intentional) return
  // Involuntary: the session died under the user (refresh failed, token revoked,
  // user deleted, password changed elsewhere). We can't reliably tell those
  // apart from the client, so one clear message covers all of them.
  toast.error('Session expired', {
    description: 'Please sign in again.',
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [agentRecord, setAgentRecord] = useState<Agent | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [agentLoading, setAgentLoading] = useState(false)
  // Track the last user ID we fetched an agent record for. Supabase fires
  // SIGNED_IN on every tab-focus via visibilitychange, so we skip re-fetching
  // when the user hasn't actually changed.
  const loadedUserIdRef = useRef<string | null>(null)
  // True while an explicit user-initiated signOut() is in flight, so we can
  // tell a deliberate logout apart from one forced by a dead/expired session.
  const intentionalSignOutRef = useRef(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Resolve auth loading for every event — auth state is now known.
      setAuthLoading(false)

      if (!session?.user) {
        // We had a user and now we don't. If this wasn't an intentional
        // signOut(), the session was killed under us (refresh token expired,
        // revoked, user deleted, password changed elsewhere).
        // TODO(you): implement handleSessionEnded — see request below.
        handleSessionEnded(event, intentionalSignOutRef.current)
        intentionalSignOutRef.current = false

        setUser(null)
        setAgentRecord(null)
        setAgentLoading(false)
        loadedUserIdRef.current = null
        return
      }

      setUser(session.user)

      if (event === 'TOKEN_REFRESHED') {
        // Token silently refreshed — user ID unchanged, no need to re-fetch agent.
        return
      }

      // Skip re-fetching when same user is already loaded (e.g. tab-focus
      // causes Supabase to re-emit SIGNED_IN via visibilitychange).
      if (session.user.id === loadedUserIdRef.current) {
        return
      }
      loadedUserIdRef.current = session.user.id

      // Defer the DB query with setTimeout to avoid deadlocking Supabase's
      // internal auth state machine. Making a query synchronously inside
      // onAuthStateChange causes it to hang indefinitely because the auth
      // lock is still held when the query tries to attach the latest JWT.
      setAgentLoading(true)
      setTimeout(async () => {
        const agent = await fetchAgentRecord(session.user.id)
        setAgentRecord(agent)
        setAgentLoading(false)
      }, 0)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Sign in failed', { description: error.message })
      return { error: error.message }
    }
    toast.success('Signed in successfully')
    return { error: null }
  }

  async function signOut() {
    intentionalSignOutRef.current = true
    await supabase.auth.signOut()
    window.history.replaceState({}, '', window.location.pathname)
    toast.success('Signed out')
  }

  async function refreshAgentRecord() {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return
    const agent = await fetchAgentRecord(currentUser.id)
    setAgentRecord(agent)
  }

  return (
    <AuthContext.Provider value={{
      user,
      agentRecord,
      isAdmin: agentRecord?.role === 'admin',
      authLoading,
      agentLoading,
      signIn,
      signOut,
      refreshAgentRecord,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, agentRecord, authLoading, agentLoading } = useContext(AuthContext)

  if (authLoading || agentLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <LoginPageInner />
  }

  if (!agentRecord) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Account not configured. Contact your administrator.</p>
      </div>
    )
  }

  return <>{children}</>
}

// Defined here to avoid circular import: LoginPage needs useAuth, AuthContext renders LoginPage
function LoginPageInner() {
  const { signIn } = useContext(AuthContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) setError(error)
    setLoading(false)
  }

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 border border-border rounded-lg bg-card shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">Mack1 Realty</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
