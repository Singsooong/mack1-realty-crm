import { useState, useEffect } from 'react'
import { fetchTasks, createTask, updateTask, deleteTask } from '../services/tasks'
import type { Task } from '../types'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreateTask(data: Omit<Task, 'id' | 'assignedAgentName'>) {
    const created = await createTask(data)
    setTasks(prev => [...prev, created])
    return created
  }

  async function handleUpdateTask(id: string, data: Partial<Omit<Task, 'id' | 'assignedAgentName'>>) {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    try {
      await updateTask(id, data)
    } catch (e) {
      // Revert on failure
      fetchTasks().then(setTasks)
      throw e
    }
  }

  async function handleDeleteTask(id: string) {
    const snapshot = tasks
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      await deleteTask(id)
    } catch (e) {
      setTasks(snapshot)
      throw e
    }
  }

  return {
    tasks,
    loading,
    error,
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
  }
}
