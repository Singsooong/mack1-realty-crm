import { useCallback, useEffect, useState } from 'react'
import { createTask, deleteTask, fetchTasksByClient, updateTask } from '../services/tasks'
import { useAuth } from './useAuth'
import type { Task } from '../types'

/** The fields the client Tasks tab collects; agent + client are filled by the hook. */
export type NewClientTask = Omit<Task, 'id' | 'assignedAgentName' | 'assignedAgentId' | 'clientId'>

export function useClientTasks(clientId: string) {
  const { agentRecord } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchTasksByClient(clientId)
      .then(data => { if (!cancelled) setTasks(data) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [clientId])

  const addTask = useCallback(async (input: NewClientTask) => {
    if (!agentRecord) return
    // Tasks RLS is per-agent: a task must be assigned to the caller's own agent
    // record to satisfy the insert policy, so we self-assign here.
    const created = await createTask({ ...input, clientId, assignedAgentId: agentRecord.id })
    setTasks(prev => [...prev, created])
  }, [clientId, agentRecord])

  const setTaskStatus = useCallback(async (id: string, status: Task['status']) => {
    await updateTask(id, { status })
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, status } : t)))
  }, [])

  const removeTask = useCallback(async (id: string) => {
    await deleteTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  return { tasks, loading, error, addTask, setTaskStatus, removeTask }
}
