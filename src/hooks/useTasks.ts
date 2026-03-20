import { useState, useEffect } from 'react'
import { fetchTasks, createTask, toggleTaskComplete, updateTask } from '../services/tasks'
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

  async function handleToggleComplete(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const newCompleted = !task.completed
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t))
    try {
      await toggleTaskComplete(id, newCompleted)
    } catch (e) {
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: task.completed } : t))
      throw e
    }
  }

  async function handleCreateTask(data: Omit<Task, 'id' | 'assignedAgentName'>) {
    const created = await createTask(data)
    setTasks(prev => [...prev, created])
    return created
  }

  return { tasks, loading, error, toggleTaskComplete: handleToggleComplete, createTask: handleCreateTask }
}
