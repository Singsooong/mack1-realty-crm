import { supabase } from '../lib/supabase'
import type { Lead } from '../types'

interface RawLead {
  id: string
  name: string
  email: string
  phone: string
  property_interest: string
  message: string
  status: string
  assigned_agent_id: string
  date: string
  agents: { name: string } | null
}

function transformLead(row: RawLead): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    propertyInterest: row.property_interest,
    message: row.message,
    status: row.status as Lead['status'],
    assignedAgentId: row.assigned_agent_id,
    assignedAgentName: row.agents?.name ?? '',
    date: row.date,
  }
}

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*, agents(name)')
    .order('date', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as RawLead[]).map(transformLead)
}

export async function createLead(data: Omit<Lead, 'id' | 'assignedAgentName'>): Promise<Lead> {
  const { data: row, error } = await supabase
    .from('leads')
    .insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      property_interest: data.propertyInterest,
      message: data.message,
      status: data.status,
      assigned_agent_id: data.assignedAgentId,
      date: data.date,
    })
    .select('*, agents(name)')
    .single()
  if (error) throw new Error(error.message)
  return transformLead(row as RawLead)
}

export async function updateLeadStatus(id: string, status: Lead['status']): Promise<void> {
  const { error } = await supabase.from('leads').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function reassignLead(id: string, agentId: string): Promise<void> {
  const { error } = await supabase.from('leads').update({ assigned_agent_id: agentId }).eq('id', id)
  if (error) throw new Error(error.message)
}
