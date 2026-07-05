import { useState, useEffect } from 'react'
import { fetchLeads, createLead, updateLead, updateLeadStatus, reassignLead, deleteLead } from '../services/leads'
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

  async function handleUpdateLead(id: string, data: Partial<Omit<Lead, 'id' | 'assignedAgentName'>>) {
    const updated = await updateLead(id, data)
    setLeads(prev => prev.map(l => l.id === id ? updated : l))
    return updated
  }

  async function handleUpdateLeadStatus(id: string, status: Lead['status']) {
    await updateLeadStatus(id, status)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  async function handleReassignLead(id: string, agentId: string, agentName: string) {
    await reassignLead(id, agentId)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, assignedAgentId: agentId, assignedAgentName: agentName } : l))
  }

  async function handleDeleteLead(id: string) {
    await deleteLead(id)
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  return { leads, loading, error, createLead: handleCreateLead, updateLead: handleUpdateLead, updateLeadStatus: handleUpdateLeadStatus, reassignLead: handleReassignLead, deleteLead: handleDeleteLead }
}
