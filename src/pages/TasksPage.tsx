import { useState } from 'react'
import { toast } from 'sonner'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { useTasks } from '@/hooks/useTasks'
import { useAgents } from '@/hooks/useAgents'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calendar, User, Flag, MoreHorizontal } from 'lucide-react'
import { TaskDrawer } from '@/components/tasks/TaskDrawer'
import { DeleteTaskDialog } from '@/components/tasks/DeleteTaskDialog'
import { TasksPageSkeleton } from '@/components/tasks/TasksPageSkeleton'
import type { Task } from '@/types'

type TaskFormData = Omit<Task, 'id' | 'assignedAgentName'>

const COLUMNS: { id: Task['status']; label: string }[] = [
  { id: 'pending',     label: 'Pending' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed',   label: 'Completed' },
]

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  high:   'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  low:    'bg-muted text-muted-foreground',
}

const CATEGORY_STYLES: Record<Task['category'], string> = {
  'follow-up':  'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  'inspection': 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  'paperwork':  'bg-muted text-muted-foreground',
  'showing':    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'other':      'bg-muted text-muted-foreground',
}

export function TasksPage() {
  const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks()
  const { agents } = useAgents()

  const [drawerOpen, setDrawerOpen]       = useState(false)
  const [editingTask, setEditingTask]     = useState<Task | null>(null)
  const [deletingTask, setDeletingTask]   = useState<Task | null>(null)

  function handleDrawerClose() {
    setDrawerOpen(false)
    setEditingTask(null)
  }

  async function handleSave(id: string | null, data: TaskFormData) {
    if (id === null) {
      await createTask(data)
    } else {
      await updateTask(id, data)
    }
    toast.success(id === null ? 'Task created' : 'Task updated')
    handleDrawerClose()
  }

  async function handleDelete() {
    if (!deletingTask) return
    await deleteTask(deletingTask.id)
    toast.success('Task deleted')
    setDeletingTask(null)
  }

  function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return
    updateTask(draggableId, { status: destination.droppableId as Task['status'] })
  }

  if (loading) return <TasksPageSkeleton />
  if (error)   return <div className="p-6 text-sm text-destructive">Error: {error}</div>

  const agentMap = Object.fromEntries(agents.map(a => [a.id, a.name]))

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-xl text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">{tasks.length} tasks</p>
        </div>
        <Button onClick={() => { setEditingTask(null); setDrawerOpen(true) }}>
          + New Task
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id)
            return (
              <div key={col.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{col.label}</p>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{colTasks.length}</span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex flex-col gap-2 min-h-[120px] rounded-lg p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-muted/60' : 'bg-muted/20'}`}
                    >
                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Card
                                className={`cursor-grab active:cursor-grabbing transition-shadow ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                onClick={() => { setEditingTask(task); setDrawerOpen(true) }}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <p className="text-sm font-medium text-foreground leading-tight flex-1">{task.title}</p>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 shrink-0 text-muted-foreground"
                                          onClick={e => e.stopPropagation()}
                                        >
                                          <MoreHorizontal className="h-3.5 w-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={e => { e.stopPropagation(); setEditingTask(task); setDrawerOpen(true) }}>
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem variant="destructive" onClick={e => { e.stopPropagation(); setDeletingTask(task) }}>
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    <Badge className={`text-xs ${PRIORITY_STYLES[task.priority]}`}>
                                      <Flag className="h-2.5 w-2.5 mr-1" />{task.priority}
                                    </Badge>
                                    <Badge className={`text-xs capitalize ${CATEGORY_STYLES[task.category]}`}>
                                      {task.category}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    {task.dueDate && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                    )}
                                    {task.assignedAgentId && (
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {task.assignedAgentName || agentMap[task.assignedAgentId] || '—'}
                                      </span>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      <TaskDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        task={editingTask}
        onSave={handleSave}
      />
      <DeleteTaskDialog
        task={deletingTask}
        onConfirm={handleDelete}
        onCancel={() => setDeletingTask(null)}
      />
    </div>
  )
}
