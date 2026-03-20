import { useState, useEffect } from 'react'
import { fetchLeads, createLead, updateLeadStatus, reassignLead } from '../services/leads'
import type { Lead } from '../types'

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeads()
      .then(setLeads)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreateLead(data: Omit<Lead, 'id' | 'assignedAgentName'>) {
    const created = await createLead(data)
    setLeads(prev => [created, ...prev])
    return created
  }

  async function handleUpdateLeadStatus(id: string, status: Lead['status']) {
    await updateLeadStatus(id, status)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  async function handleReassignLead(id: string, agentId: string, agentName: string) {
    await reassignLead(id, agentId)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, assignedAgentId: agentId, assignedAgentName: agentName } : l))
  }

  return { leads, loading, error, createLead: handleCreateLead, updateLeadStatus: handleUpdateLeadStatus, reassignLead: handleReassignLead }
}
