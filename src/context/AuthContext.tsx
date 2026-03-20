import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Agent } from '../types'

interface AuthContextValue {
  user: User | null
  agentRecord: Agent | null
  isAdmin: boolean
  authLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  agentRecord: null,
  isAdmin: false,
  authLoading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
})

async function fetchAgentRecord(userId: string): Promise<Agent | null> {
  const { data } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    avatarUrl: data.avatar_url,
    specialty: data.specialty,
    listings: data.listings,
    sales: data.sales,
    revenue: data.revenue,
    rating: data.rating,
    status: data.status,
    role: data.role,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [agentRecord, setAgentRecord] = useState<Agent | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    // onAuthStateChange fires immediately with INITIAL_SESSION on mount,
    // covering both the "restore from localStorage" case and "no session" case.
    // No separate getSession() call needed — avoids a double-fetch race condition.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        const agent = await fetchAgentRecord(session.user.id)
        setAgentRecord(agent)
      } else {
        setUser(null)
        setAgentRecord(null)
      }
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user,
      agentRecord,
      isAdmin: agentRecord?.role === 'admin',
      authLoading,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, agentRecord, authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) {
    // LoginPage imported inline to avoid circular dep with AuthContext
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
  const { signIn } = useAuth()
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
          <p className="text-sm text-muted-foreground mt-1">DataBrain CRM</p>
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
