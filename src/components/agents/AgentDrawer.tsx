import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
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
import type { Agent } from '@/types'

type AgentFormData = Pick<Agent, 'name' | 'email' | 'phone' | 'avatarUrl' | 'specialty' | 'status' | 'role'>

interface AgentDrawerProps {
  open: boolean
  onClose: () => void
  agent: Agent | null  // null = Add mode, non-null = Edit mode
  onSave: (id: string | null, data: AgentFormData) => Promise<void>
}

export function AgentDrawer({ open, onClose, agent, onSave }: AgentDrawerProps) {
  const [name, setName]             = useState('')
  const [email, setEmail]           = useState('')
  const [phone, setPhone]           = useState('')
  const [specialty, setSpecialty]   = useState('')
  const [avatarUrl, setAvatarUrl]   = useState('')
  const [status, setStatus]         = useState<Agent['status']>('active')
  const [role, setRole]             = useState<Agent['role']>('agent')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // Pre-fill in Edit mode; clear in Add mode
  useEffect(() => {
    if (open) {
      setName(agent?.name ?? '')
      setEmail(agent?.email ?? '')
      setPhone(agent?.phone ?? '')
      setSpecialty(agent?.specialty ?? '')
      setAvatarUrl(agent?.avatarUrl ?? '')
      setStatus(agent?.status ?? 'active')
      setRole(agent?.role ?? 'agent')
      setError(null)
    }
  }, [open, agent])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(agent?.id ?? null, { name, email, phone, specialty, avatarUrl, status, role })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v && !loading) onClose() }}>
      <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{agent ? 'Edit Agent' : 'Add New Agent'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@example.com"
              required
              disabled={!!agent}
            />
            {agent && (
              <p className="text-xs text-muted-foreground">Email cannot be changed after creation.</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Phone</label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Specialty</label>
            <Input
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              placeholder="Residential"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Avatar URL</label>
            <Input
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={v => setStatus(v as Agent['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Role</label>
              <Select value={role} onValueChange={v => setRole(v as Agent['role'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
