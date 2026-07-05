import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Agent } from '../types'

export interface AuthContextValue {
  user: User | null
  agentRecord: Agent | null
  isAdmin: boolean
  authLoading: boolean
  agentLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshAgentRecord: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  agentRecord: null,
  isAdmin: false,
  authLoading: true,
  agentLoading: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshAgentRecord: async () => {},
})
