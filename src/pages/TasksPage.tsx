import { useState } from 'react'
import { tasksData } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Calendar, User, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  high: 'bg-red-950 text-red-400',
  medium: 'bg-amber-950 text-amber-400',
  low: 'bg-zinc-800 text-zinc-400',
}

const CATEGORY_STYLES: Record<Task['category'], string> = {
  'follow-up': 'bg-blue-950 text-blue-400',
  'inspection': 'bg-purple-950 text-purple-400',
  'paperwork': 'bg-zinc-800 text-zinc-400',
  'showing': 'bg-emerald-950 text-emerald-400',
  'other': 'bg-zinc-800 text-zinc-400',
}

export function TasksPage() {
  const [tasks, setTasks] = useState(tasksData)
  const toggle = (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  const pending = tasks.filter(t => !t.completed)
  const completed = tasks.filter(t => t.completed)

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">{pending.length} pending · {completed.length} completed</p>
        </div>
        <Button size="sm">+ New Task</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {pending.length > 0 && (
            <div className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pending</p>
              <div className="flex flex-col gap-1">
                {pending.map((task, i) => (
                  <div key={task.id}>
                    {i > 0 && <Separator />}
                    <div className="flex items-start gap-3 py-3 hover:bg-muted/20 rounded-md px-2 -mx-2 transition-colors">
                      <Checkbox checked={task.completed} onCheckedChange={() => toggle(task.id)} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-medium text-foreground">{task.title}</p>
                          <Badge className={`text-xs ${PRIORITY_STYLES[task.priority]}`}><Flag className="h-2.5 w-2.5 mr-1" />{task.priority}</Badge>
                          <Badge className={`text-xs capitalize ${CATEGORY_STYLES[task.category]}`}>{task.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{task.assignedTo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div className="p-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Completed</p>
              <div className="flex flex-col gap-1">
                {completed.map((task, i) => (
                  <div key={task.id}>
                    {i > 0 && <Separator />}
                    <div className="flex items-start gap-3 py-3 hover:bg-muted/20 rounded-md px-2 -mx-2 transition-colors opacity-50">
                      <Checkbox checked={task.completed} onCheckedChange={() => toggle(task.id)} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium', task.completed && 'line-through text-muted-foreground')}>{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
