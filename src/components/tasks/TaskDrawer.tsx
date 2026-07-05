import { useEffect, useState } from 'react'
import { Loader2, ListTodo, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAgents } from '@/hooks/useAgents'
import { useAuth } from '@/hooks/useAuth'
import type { Task } from '@/types'

type TaskFormData = Omit<Task, 'id' | 'assignedAgentName'>

interface TaskDrawerProps {
  open: boolean
  onClose: () => void
  task: Task | null  // null = Add mode, non-null = Edit mode
  onSave: (id: string | null, data: TaskFormData) => Promise<void>
}

export function TaskDrawer({ open, onClose, task, onSave }: TaskDrawerProps) {
  const { agents } = useAgents()
  const { isAdmin, agentRecord } = useAuth()

  const [title, setTitle]                 = useState('')
  const [description, setDescription]     = useState('')
  const [category, setCategory]           = useState<Task['category']>('follow-up')
  const [priority, setPriority]           = useState<Task['priority']>('medium')
  const [status, setStatus]               = useState<Task['status']>('pending')
  const [dueDate, setDueDate]             = useState('')
  const [assignedAgentId, setAssignedAgentId] = useState('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  // Pre-fill in Edit mode; clear in Add mode
  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '')
      setDescription(task?.description ?? '')
      setCategory(task?.category ?? 'follow-up')
      setPriority(task?.priority ?? 'medium')
      setStatus(task?.status ?? 'pending')
      setDueDate(task?.dueDate ?? '')
      // Non-admins can only create tasks assigned to themselves — the RLS
      // policy rejects any other assigned_agent_id. Default and lock to self.
      setAssignedAgentId(task?.assignedAgentId ?? (isAdmin ? '' : (agentRecord?.id ?? '')))
      setError(null)
    }
  }, [open, task, isAdmin, agentRecord])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(task?.id ?? null, { title, description, category, priority, status, dueDate, assignedAgentId })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v && !loading) onClose() }}>
      <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
        <SheetHeader className="relative overflow-hidden bg-linear-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] border-b border-[#2a2a3e] p-6 pb-5">
          <div className="absolute top-0 right-0 h-32 w-32 bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)]" />
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/10 mb-3">
            {task ? <Pencil className="h-4 w-4 text-indigo-400" /> : <ListTodo className="h-4 w-4 text-indigo-400" />}
          </div>
          <SheetTitle className="text-[#e8e8f0]">{task ? 'Edit Task' : 'New Task'}</SheetTitle>
          <p className="text-xs text-[#6b6b80] mt-1">
            {task ? 'Update task details and assignment' : 'Create a new task and assign it to an agent'}
          </p>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Title</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Follow up with client…"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Additional details…"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Category</label>
              <Select value={category} onValueChange={v => setCategory(v as Task['category'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="paperwork">Paperwork</SelectItem>
                  <SelectItem value="showing">Showing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Priority</label>
              <Select value={priority} onValueChange={v => setPriority(v as Task['priority'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Status</label>
              <Select value={status} onValueChange={v => setStatus(v as Task['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Assigned Agent</label>
            <Select value={assignedAgentId} onValueChange={setAssignedAgentId} disabled={!isAdmin}>
              <SelectTrigger><SelectValue placeholder="Select agent…" /></SelectTrigger>
              <SelectContent>
                {agents.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <SheetFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
