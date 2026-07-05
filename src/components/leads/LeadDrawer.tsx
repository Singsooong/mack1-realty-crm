import { useEffect, useState } from 'react'
import { Loader2, UserPlus } from 'lucide-react'
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
import { useAuth } from '@/hooks/useAuth'
import type { Lead, Agent } from '@/types'

type LeadFormData = Omit<Lead, 'id' | 'assignedAgentName'>

interface LeadDrawerProps {
  open: boolean
  onClose: () => void
  lead: Lead | null  // null = Add mode, non-null = Edit mode
  agents: Agent[]
  onSave: (id: string | null, data: LeadFormData) => Promise<void>
}

export function LeadDrawer({ open, onClose, lead, agents, onSave }: LeadDrawerProps) {
  const { isAdmin, agentRecord } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [propertyInterest, setPropertyInterest] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Lead['status']>('new')
  const [assignedAgentId, setAssignedAgentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill in Edit mode; clear in Add mode
  useEffect(() => {
    if (open) {
      if (lead) {
        setName(lead.name)
        setEmail(lead.email)
        setPhone(lead.phone)
        setPropertyInterest(lead.propertyInterest)
        setMessage(lead.message)
        setStatus(lead.status)
        setAssignedAgentId(lead.assignedAgentId)
      } else {
        setName('')
        setEmail('')
        setPhone('')
        setPropertyInterest('')
        setMessage('')
        setStatus('new')
        // Non-admins can only create leads assigned to themselves — the RLS
        // policy rejects any other assigned_agent_id. Default and lock to self.
        setAssignedAgentId(isAdmin ? '' : (agentRecord?.id ?? ''))
      }
      setError(null)
    }
  }, [open, lead, isAdmin, agentRecord])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(lead?.id ?? null, {
        name,
        email,
        phone,
        propertyInterest,
        message,
        status,
        assignedAgentId,
        date: lead?.date ?? new Date().toISOString(),
      })
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
            <UserPlus className="h-4 w-4 text-indigo-400" />
          </div>
          <SheetTitle className="text-[#e8e8f0]">{lead ? 'Edit Lead' : 'Add New Lead'}</SheetTitle>
          <p className="text-xs text-[#6b6b80] mt-1">
            {lead ? 'Update this lead\'s information' : 'Create a new lead record'}
          </p>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Phone</label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Property Interest</label>
            <Input
              value={propertyInterest}
              onChange={e => setPropertyInterest(e.target.value)}
              placeholder="e.g. 3-bed house in Downtown"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Lead inquiry or notes..."
              rows={3}
              className="rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Status</label>
              <Select value={status} onValueChange={v => setStatus(v as Lead['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">Assign To</label>
              <Select value={assignedAgentId} onValueChange={setAssignedAgentId} disabled={!isAdmin}>
                <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
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
