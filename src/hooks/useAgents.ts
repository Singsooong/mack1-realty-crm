import { useState, useEffect } from 'react'
import { fetchAgents, updateAgent } from '../services/agents'
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

  return { agents, loading, error, updateAgent: handleUpdateAgent }
}
