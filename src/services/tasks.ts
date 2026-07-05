import { supabase } from '../lib/supabase'
import type { Task } from '../types'

interface RawTask {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  due_date: string
  assigned_agent_id: string
  client_id: string | null
  agents: { name: string } | null
}

function transformTask(row: RawTask): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as Task['category'],
    priority: row.priority as Task['priority'],
    status: row.status as Task['status'],
    dueDate: row.due_date,
    assignedAgentId: row.assigned_agent_id,
    assignedAgentName: row.agents?.name ?? '',
    clientId: row.client_id,
  }
}

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, agents(name)')
    .order('due_date', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as RawTask[]).map(transformTask)
}

export async function fetchTasksByClient(clientId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, agents(name)')
    .eq('client_id', clientId)
    .order('due_date', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as RawTask[]).map(transformTask)
}

export async function createTask(data: Omit<Task, 'id' | 'assignedAgentName'>): Promise<Task> {
  const { data: row, error } = await supabase
    .from('tasks')
    .insert({
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: data.status,
      due_date: data.dueDate,
      assigned_agent_id: data.assignedAgentId,
      client_id: data.clientId ?? null,
    })
    .select('*, agents(name)')
    .single()
  if (error) throw new Error(error.message)
  return transformTask(row as RawTask)
}

export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'assignedAgentName'>>): Promise<void> {
  const dbUpdates: Partial<RawTask> = {}
  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority
  if (updates.category !== undefined) dbUpdates.category = updates.category
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
  if (updates.assignedAgentId !== undefined) dbUpdates.assigned_agent_id = updates.assignedAgentId
  if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId
  const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
