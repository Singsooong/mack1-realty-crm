# Agents CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full Create/Read/Update/Delete to the Agents page, gated behind the existing `admin` role, with Supabase Edge Functions handling auth user creation and deletion.

**Architecture:** Two Edge Functions (`create-agent`, `delete-agent`) use the Supabase service-role key to manage Auth users server-side. The frontend service layer calls these via `supabase.functions.invoke`. A Sheet drawer handles Add/Edit; a Dialog handles Delete confirmation — both following the existing Listings pattern exactly.

**Tech Stack:** React 19, TypeScript, Supabase JS v2, Supabase Edge Functions (Deno), shadcn/ui (Sheet, Dialog, DropdownMenu)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `supabase/functions/create-agent/index.ts` | Auth user + agents row creation |
| Create | `supabase/functions/delete-agent/index.ts` | Auth user + agents row deletion |
| Modify | `src/services/agents.ts` | Add `createAgent`, `deleteAgent` service fns |
| Modify | `src/hooks/useAgents.ts` | Expose `createAgent`, `deleteAgent` |
| Create | `src/components/agents/AgentDrawer.tsx` | Add/Edit Sheet drawer |
| Create | `src/components/agents/DeleteAgentDialog.tsx` | Delete confirm dialog |
| Modify | `src/pages/AgentsPage.tsx` | Wire CRUD, button, kebab menu |

---

## Task 1: Edge Function — `create-agent`

**Files:**
- Create: `supabase/functions/create-agent/index.ts`

- [ ] **Step 1: Create the supabase functions directory structure**

```bash
mkdir -p supabase/functions/create-agent
```

- [ ] **Step 2: Write the `create-agent` Edge Function**

Create `supabase/functions/create-agent/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Verify the caller is an admin
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: callerAgent } = await supabaseAdmin
    .from('agents')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (callerAgent?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Parse request body
  const { name, email, phone, specialty, status, role, avatar_url } = await req.json()

  if (!name || !email) {
    return new Response(JSON.stringify({ error: 'name and email are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Create Supabase Auth user with a random temporary password
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
  })

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Insert agents row
  const { data: agent, error: agentError } = await supabaseAdmin
    .from('agents')
    .insert({
      user_id: authData.user.id,
      name,
      email,
      phone: phone || null,
      specialty: specialty || null,
      status: status || 'active',
      role: role || 'agent',
      avatar_url: avatar_url || null,
      listings: 0,
      sales: 0,
      revenue: '$0',
      rating: 0,
    })
    .select()
    .single()

  if (agentError) {
    // Rollback: remove the auth user so it doesn't become orphaned
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return new Response(JSON.stringify({ error: agentError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify(agent), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/create-agent/index.ts
git commit -m "feat: add create-agent edge function"
```

---

## Task 2: Edge Function — `delete-agent`

**Files:**
- Create: `supabase/functions/delete-agent/index.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p supabase/functions/delete-agent
```

- [ ] **Step 2: Write the `delete-agent` Edge Function**

Create `supabase/functions/delete-agent/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Verify the caller is an admin
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: callerAgent } = await supabaseAdmin
    .from('agents')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (callerAgent?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { agentId } = await req.json()

  if (!agentId) {
    return new Response(JSON.stringify({ error: 'agentId is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch the agents row to get user_id
  const { data: agent, error: fetchError } = await supabaseAdmin
    .from('agents')
    .select('user_id')
    .eq('id', agentId)
    .single()

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Delete agents row first
  const { error: deleteError } = await supabaseAdmin
    .from('agents')
    .delete()
    .eq('id', agentId)

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Delete auth user if linked
  if (agent.user_id) {
    await supabaseAdmin.auth.admin.deleteUser(agent.user_id)
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/delete-agent/index.ts
git commit -m "feat: add delete-agent edge function"
```

---

## Task 3: Deploy Edge Functions

**Prerequisites:** Supabase CLI installed (`npm install -g supabase` or `brew install supabase/tap/supabase`). You'll need to be logged in and linked to the project.

- [ ] **Step 1: Initialize supabase in the project (if not already)**

```bash
supabase init
```

If it asks to overwrite anything, say no. This just creates a `supabase/config.toml`.

- [ ] **Step 2: Link to the remote Supabase project**

```bash
supabase link
```

Select the `databrain-dark` project when prompted.

- [ ] **Step 3: Deploy `create-agent`**

```bash
supabase functions deploy create-agent
```

Expected output: `Deployed Function create-agent`

- [ ] **Step 4: Deploy `delete-agent`**

```bash
supabase functions deploy delete-agent
```

Expected output: `Deployed Function delete-agent`

- [ ] **Step 5: Commit config**

```bash
git add supabase/config.toml
git commit -m "chore: add supabase config and deploy edge functions"
```

---

## Task 4: Extend `services/agents.ts`

**Files:**
- Modify: `src/services/agents.ts`

- [ ] **Step 1: Add `createAgent` and `deleteAgent` to the service file**

Open `src/services/agents.ts` and add the following two functions after the existing `updateAgent` function:

```typescript
export async function createAgent(
  data: Pick<Agent, 'name' | 'email' | 'phone' | 'avatarUrl' | 'specialty' | 'status' | 'role'>
): Promise<Agent> {
  const { data: result, error } = await supabase.functions.invoke('create-agent', {
    body: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      specialty: data.specialty,
      status: data.status,
      role: data.role,
      avatar_url: data.avatarUrl,
    },
  })
  if (error) throw new Error(error.message)
  return transformAgent(result as RawAgent)
}

export async function deleteAgent(id: string): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-agent', {
    body: { agentId: id },
  })
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | head -20
```

Expected: No TypeScript errors related to `agents.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/services/agents.ts
git commit -m "feat: add createAgent and deleteAgent service functions"
```

---

## Task 5: Extend `useAgents` hook

**Files:**
- Modify: `src/hooks/useAgents.ts`

- [ ] **Step 1: Replace the full contents of `src/hooks/useAgents.ts`**

```typescript
import { useState, useEffect } from 'react'
import {
  fetchAgents,
  updateAgent,
  createAgent as createAgentService,
  deleteAgent as deleteAgentService,
} from '../services/agents'
import type { Agent } from '../types'

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAgents()
      .then(setAgents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpdateAgent(id: string, updates: Partial<Omit<Agent, 'id'>>) {
    await updateAgent(id, updates)
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  async function handleCreateAgent(
    data: Pick<Agent, 'name' | 'email' | 'phone' | 'avatarUrl' | 'specialty' | 'status' | 'role'>
  ) {
    const newAgent = await createAgentService(data)
    setAgents(prev => [...prev, newAgent].sort((a, b) => a.name.localeCompare(b.name)))
  }

  async function handleDeleteAgent(id: string) {
    await deleteAgentService(id)
    setAgents(prev => prev.filter(a => a.id !== id))
  }

  return {
    agents,
    loading,
    error,
    updateAgent: handleUpdateAgent,
    createAgent: handleCreateAgent,
    deleteAgent: handleDeleteAgent,
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAgents.ts
git commit -m "feat: expose createAgent and deleteAgent from useAgents"
```

---

## Task 6: Create `AgentDrawer` component

**Files:**
- Create: `src/components/agents/AgentDrawer.tsx`

- [ ] **Step 1: Create the agents components directory**

```bash
mkdir -p src/components/agents
```

- [ ] **Step 2: Write `AgentDrawer.tsx`**

Create `src/components/agents/AgentDrawer.tsx`:

```tsx
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/agents/AgentDrawer.tsx
git commit -m "feat: add AgentDrawer component for add/edit"
```

---

## Task 7: Create `DeleteAgentDialog` component

**Files:**
- Create: `src/components/agents/DeleteAgentDialog.tsx`

- [ ] **Step 1: Write `DeleteAgentDialog.tsx`**

Create `src/components/agents/DeleteAgentDialog.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Agent } from '@/types'

interface DeleteAgentDialogProps {
  agent: Agent | null
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function DeleteAgentDialog({ agent, onConfirm, onCancel }: DeleteAgentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset stale state each time a new agent is targeted
  useEffect(() => {
    if (agent) {
      setError(null)
      setLoading(false)
    }
  }, [agent])

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!agent} onOpenChange={(v) => { if (!v && !loading) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Agent</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{agent?.name}</strong>? This will remove their login account entirely and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/agents/DeleteAgentDialog.tsx
git commit -m "feat: add DeleteAgentDialog component"
```

---

## Task 8: Update `AgentsPage` — wire CRUD

**Files:**
- Modify: `src/pages/AgentsPage.tsx`

- [ ] **Step 1: Replace the full contents of `src/pages/AgentsPage.tsx`**

```tsx
import { useState } from 'react'
import { useAgents } from '@/hooks/useAgents'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Star, Phone, Mail, TrendingUp, MoreHorizontal } from 'lucide-react'
import { AgentDrawer } from '@/components/agents/AgentDrawer'
import { DeleteAgentDialog } from '@/components/agents/DeleteAgentDialog'
import type { Agent } from '@/types'

type AgentFormData = Pick<Agent, 'name' | 'email' | 'phone' | 'avatarUrl' | 'specialty' | 'status' | 'role'>

export function AgentsPage() {
  const { isAdmin } = useAuth()
  const { agents, loading, error, createAgent, updateAgent, deleteAgent } = useAgents()
  const [drawerOpen, setDrawerOpen]       = useState(false)
  const [editingAgent, setEditingAgent]   = useState<Agent | null>(null)
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null)

  function handleDrawerClose() {
    setDrawerOpen(false)
    setEditingAgent(null)
  }

  async function handleSave(id: string | null, data: AgentFormData) {
    if (id === null) {
      await createAgent(data)
    } else {
      await updateAgent(id, data)
    }
    handleDrawerClose()
  }

  async function handleDelete() {
    if (!deletingAgent) return
    await deleteAgent(deletingAgent.id)
    setDeletingAgent(null)
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading agents…</div>
  if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agents</h1>
          <p className="text-sm text-muted-foreground">{agents.length} agents on your team</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => { setEditingAgent(null); setDrawerOpen(true) }}>
            + Add New Agent
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <Card key={agent.id} className="hover:border-border transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={agent.avatarUrl} alt={agent.name} />
                    <AvatarFallback>{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge
                    variant={agent.status === 'active' ? 'secondary' : 'outline'}
                    className={agent.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-950' : ''}
                  >
                    {agent.status}
                  </Badge>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingAgent(agent); setDrawerOpen(true) }}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeletingAgent(agent)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{agent.listings}</p>
                  <p className="text-xs text-muted-foreground">Listings</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{agent.sales}</p>
                  <p className="text-xs text-muted-foreground">Sales</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{agent.revenue}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  {agent.rating} rating
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />Top performer
                </span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
                  <Phone className="h-3.5 w-3.5" /> Call
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles with no errors**

```bash
npm run build 2>&1 | head -30
```

Expected: Build completes without TypeScript errors.

- [ ] **Step 3: Run dev server and manually verify**

```bash
npm run dev
```

Check the following as an **admin user**:
- [ ] "Add New Agent" button is visible in the page header
- [ ] Clicking "+ Add New Agent" opens the drawer in Add mode (blank form, title "Add New Agent")
- [ ] Filling the form and clicking Save creates the agent and closes the drawer; new card appears
- [ ] Kebab menu (⋯) appears on each card
- [ ] Clicking "Edit" opens the drawer pre-filled with agent data; saving updates the card
- [ ] Email field is disabled in Edit mode
- [ ] Clicking "Delete" opens the confirm dialog with the agent's name
- [ ] Confirming delete removes the card and deletes the auth account
- [ ] Escape / clicking outside the drawer/dialog does NOT close while a save/delete is in flight

Check as a **non-admin user**:
- [ ] "Add New Agent" button is NOT visible
- [ ] Kebab menu does NOT appear on any card

- [ ] **Step 4: Commit**

```bash
git add src/pages/AgentsPage.tsx
git commit -m "feat: wire CRUD on AgentsPage — add/edit/delete gated by admin role"
```
