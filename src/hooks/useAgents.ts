import { useState, useEffect } from 'react'
import {
  fetchAgents,
  updateAgent,
  createAgent as createAgentService,
  deleteAgent as deleteAgentService,
  resetAgentPassword as resetAgentPasswordService,
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
    data: Pick<Agent, 'name' | 'email' | 'phone' | 'avatarUrl' | 'specialty' | 'status' | 'role'>,
    password?: string
  ): Promise<{ agent: Agent; password: string }> {
    const result = await createAgentService(data, password)
    setAgents(prev => [...prev, result.agent].sort((a, b) => a.name.localeCompare(b.name)))
    return result
  }

  async function handleDeleteAgent(id: string) {
    await deleteAgentService(id)
    setAgents(prev => prev.filter(a => a.id !== id))
  }

  async function handleResetAgentPassword(
    agentId: string,
    newPassword: string
  ): Promise<{ password: string }> {
    return resetAgentPasswordService(agentId, newPassword)
  }

  return {
    agents,
    loading,
    error,
    updateAgent: handleUpdateAgent,
    createAgent: handleCreateAgent,
    deleteAgent: handleDeleteAgent,
    resetAgentPassword: handleResetAgentPassword,
  }
}
