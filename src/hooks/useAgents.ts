import { useState, useEffect } from 'react'
import {
  fetchAgents,
  updateAgent,
  createAgent as createAgentService,
  deleteAgent as deleteAgentService,
} from '../services/agents'
import type { Agent } from '../types'

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAgents()
      .then(setAgents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpdateAgent(id: string, updates: Partial<Omit<Agent, 'id'>>) {
    await updateAgent(id, updates)
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  async function handleCreateAgent(
    data: Pick<Agent, 'name' | 'email' | 'phone' | 'avatarUrl' | 'specialty' | 'status' | 'role'>
  ) {
    const newAgent = await createAgentService(data)
    setAgents(prev => [...prev, newAgent].sort((a, b) => a.name.localeCompare(b.name)))
  }

  async function handleDeleteAgent(id: string) {
    await deleteAgentService(id)
    setAgents(prev => prev.filter(a => a.id !== id))
  }

  return {
    agents,
    loading,
    error,
    updateAgent: handleUpdateAgent,
    createAgent: handleCreateAgent,
    deleteAgent: handleDeleteAgent,
  }
}
