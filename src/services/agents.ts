import { supabase } from '../lib/supabase'
import type { Agent } from '../types'

interface RawAgent {
  id: string
  user_id: string | null
  name: string
  email: string
  phone: string
  avatar_url: string
  specialty: string
  listings: number
  sales: number
  revenue: string
  rating: number
  status: string
  role: string
}

function transformAgent(row: RawAgent): Agent {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    specialty: row.specialty,
    listings: row.listings,
    sales: row.sales,
    revenue: row.revenue,
    rating: row.rating,
    status: row.status as Agent['status'],
    role: row.role as Agent['role'],
  }
}

export async function fetchAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('name')
  if (error) throw new Error(error.message)
  return (data as RawAgent[]).map(transformAgent)
}

export async function updateAgent(id: string, updates: Partial<Omit<Agent, 'id'>>): Promise<void> {
  const dbUpdates: Partial<RawAgent> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.email !== undefined) dbUpdates.email = updates.email
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl
  if (updates.specialty !== undefined) dbUpdates.specialty = updates.specialty
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.role !== undefined) dbUpdates.role = updates.role
  const { error } = await supabase.from('agents').update(dbUpdates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function createAgent(
  data: Pick<Agent, 'name' | 'email' | 'phone' | 'avatarUrl' | 'specialty' | 'status' | 'role'>
): Promise<Agent> {
  const { data: result, error } = await supabase.functions.invoke('create-agent', {
    body: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      specialty: data.specialty,
      status: data.status,
      role: data.role,
      avatar_url: data.avatarUrl,
    },
  })
  if (error) throw new Error(error.message)
  return transformAgent(result as RawAgent)
}

export async function deleteAgent(id: string): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-agent', {
    body: { agentId: id },
  })
  if (error) throw new Error(error.message)
}
