import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { NewClientTask } from '@/hooks/useClientTasks'
import type { Task } from '@/types'

interface TasksTabProps {
  tasks: Task[]
  loading: boolean
  error: string | null
  onAdd: (input: NewClientTask) => Promise<void>
  onSetStatus: (id: string, status: Task['status']) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

const PRIORITY_BADGE: Record<Task['priority'], string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

export function TasksTab({ tasks, loading, error, onAdd, onSetStatus, onRemove }: TasksTabProps) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleAdd() {
    const trimmed = title.trim()
    if (!trimmed) return
    setSaving(true)
    setActionError(null)
    try {
      await onAdd({
        title: trimmed,
        description: '',
        category: 'follow-up',
        priority,
        status: 'pending',
        dueDate: dueDate || new Date().toISOString().split('T')[0],
      })
      setTitle('')
      setDueDate('')
      setPriority('medium')
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not add task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="New task for this client…"
            className="flex-1"
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          />
          <Input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="sm:w-40"
          />
          <Select value={priority} onValueChange={v => setPriority(v as Task['priority'])}>
            <SelectTrigger className="sm:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add
          </Button>
        </div>
        {actionError && <p className="text-sm text-destructive">{actionError}</p>}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading tasks…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks for this client yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {tasks.map(task => {
            const done = task.status === 'completed'
            return (
              <li key={task.id} className="flex items-center gap-3 p-3">
                <Checkbox
                  checked={done}
                  onCheckedChange={checked => onSetStatus(task.id, checked ? 'completed' : 'pending')}
                  aria-label={done ? 'Mark task incomplete' : 'Mark task complete'}
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <p className="text-xs text-muted-foreground">
                      Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <Badge className={`capitalize ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(task.id)}
                  aria-label="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
