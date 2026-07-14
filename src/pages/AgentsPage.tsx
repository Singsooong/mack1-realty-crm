import { useState } from 'react'
import { toast } from 'sonner'
import { useAgents } from '@/hooks/useAgents'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Copy, Check, CirclePlus } from 'lucide-react'
import { AgentsTable } from '@/components/agents/AgentsTable'
import { AgentDrawer } from '@/components/agents/AgentDrawer'
import { DeleteAgentDialog } from '@/components/agents/DeleteAgentDialog'
import { uploadAgentAvatar } from '@/services/agents'
import { AgentsPageSkeleton } from '@/components/agents/AgentsPageSkeleton'
import type { Agent } from '@/types'

type AgentFormData = Pick<Agent, 'name' | 'email' | 'phone' | 'avatarUrl' | 'specialty' | 'status' | 'role'>

export function AgentsPage() {
  const { isAdmin, agentRecord } = useAuth()
  const { agents, loading, error, createAgent, updateAgent, deleteAgent, resetAgentPassword } = useAgents()
  const [drawerOpen, setDrawerOpen]       = useState(false)
  const [editingAgent, setEditingAgent]   = useState<Agent | null>(null)
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null)
  const [bulkDeleting, setBulkDeleting]   = useState<Agent[] | null>(null)
  const [passwordDisplay, setPasswordDisplay] = useState<{ agentName: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  function handleDrawerClose() {
    setDrawerOpen(false)
    setEditingAgent(null)
  }

  async function handleSave(id: string | null, data: AgentFormData, password?: string, avatarFile?: File) {
    let resolvedData = data
    if (avatarFile) {
      const avatarUrl = await uploadAgentAvatar(avatarFile)
      resolvedData = { ...data, avatarUrl }
    }
    if (id === null) {
      const result = await createAgent(resolvedData, password)
      setPasswordDisplay({ agentName: result.agent.name, password: result.password })
    } else {
      await updateAgent(id, resolvedData)
      if (password) {
        const result = await resetAgentPassword(id, password)
        const agent = agents.find(a => a.id === id)
        if (agent) {
          setPasswordDisplay({ agentName: agent.name, password: result.password })
        }
      }
    }
    toast.success(id === null ? 'Agent added' : 'Agent updated')
    handleDrawerClose()
  }

  async function handleDelete() {
    if (!deletingAgent) return
    await deleteAgent(deletingAgent.id)
    toast.success('Agent deleted')
    setDeletingAgent(null)
  }

  async function handleBulkDelete() {
    if (!bulkDeleting) return
    const results = await Promise.allSettled(bulkDeleting.map(a => deleteAgent(a.id)))
    const failed = results.filter(r => r.status === 'rejected').length
    if (failed) toast.error(`${failed} of ${bulkDeleting.length} could not be deleted`)
    else toast.success(`${bulkDeleting.length} agent${bulkDeleting.length > 1 ? 's' : ''} deleted`)
    setBulkDeleting(null)
  }

  async function copyPasswordToClipboard() {
    if (passwordDisplay) {
      await navigator.clipboard.writeText(passwordDisplay.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return <AgentsPageSkeleton isAdmin={isAdmin} />
  if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium leading-tight text-foreground">Agents</h1>
          <p className="text-sm text-muted-foreground">{agents.length} agents on your team</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditingAgent(null); setDrawerOpen(true) }}>
            <CirclePlus />
            Add New Agent
          </Button>
        )}
      </div>

      <AgentsTable
        agents={agents}
        isAdmin={isAdmin}
        currentAgentId={agentRecord?.id}
        onEdit={(agent) => { setEditingAgent(agent); setDrawerOpen(true) }}
        onDelete={setDeletingAgent}
        onBulkDelete={setBulkDeleting}
      />

      <AgentDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        agent={editingAgent}
        onSave={handleSave}
      />
      <DeleteAgentDialog
        agent={deletingAgent}
        onConfirm={handleDelete}
        onCancel={() => setDeletingAgent(null)}
      />

      <Dialog open={!!bulkDeleting} onOpenChange={(open) => { if (!open) setBulkDeleting(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {bulkDeleting?.length} agents?</DialogTitle>
            <DialogDescription>
              This permanently removes the selected agents and their login access. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!passwordDisplay} onOpenChange={(open) => { if (!open) setPasswordDisplay(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agent Created Successfully</DialogTitle>
            <DialogDescription>
              Share this temporary password with {passwordDisplay?.agentName}. They can change it after first login.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-lg bg-muted/40 border border-border">
              <p className="text-sm text-muted-foreground mb-2">Temporary Password</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono break-all">{passwordDisplay?.password}</code>
                <Button
                  variant="ghost"
                  onClick={copyPasswordToClipboard}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Keep this password secure. The agent will be required to set their own password on first login.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setPasswordDisplay(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
