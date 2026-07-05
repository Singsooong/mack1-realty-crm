import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import { useClientNotes } from '@/hooks/useClientNotes'
import { useClientDocuments } from '@/hooks/useClientDocuments'
import { useClientTasks } from '@/hooks/useClientTasks'
import { useRouter } from '@/lib/router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientDrawer } from '@/components/clients/ClientDrawer'
import { ClientStatusSelect } from '@/components/clients/ClientStatusSelect'
import { OverviewTab } from '@/components/clients/tabs/OverviewTab'
import { DocumentsTab } from '@/components/clients/tabs/DocumentsTab'
import { NotesTab } from '@/components/clients/tabs/NotesTab'
import { TasksTab } from '@/components/clients/tabs/TasksTab'
import { Skeleton } from '@/components/ui/skeleton'
import type { Client, ClientStatus } from '@/types'

const TYPE_STYLES: Record<string, string> = {
  buyer: 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-950',
  seller: 'bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-400 dark:hover:bg-purple-950',
  investor: 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-950',
}

interface ClientDetailPageProps {
  clientId: string
}

export function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  const { navigate } = useRouter()
  const { contacts, loading, error, updateContact } = useContacts()
  const client = contacts.find(c => c.id === clientId) ?? null

  const notes = useClientNotes(clientId)
  const documents = useClientDocuments(clientId)
  const tasks = useClientTasks(clientId)

  const [drawerOpen, setDrawerOpen] = useState(false)

  if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        <button
          type="button"
          onClick={() => navigate('clients')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Clients
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border border-border p-5">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {['Overview', 'Documents', 'Notes', 'Tasks'].map(label => (
              <Skeleton key={label} className="h-9 w-24" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-6 flex flex-col gap-4 items-start">
        <p className="text-sm text-muted-foreground">Client not found.</p>
        <Button variant="outline" onClick={() => navigate('clients')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>
      </div>
    )
  }

  async function handleStatusChange(status: ClientStatus) {
    // The status dropdown is fire-and-forget (no inline error surface), so this
    // is the one client mutation that needs both success and error toasts.
    try {
      await updateContact(client!.id, { status })
      toast.success('Status updated')
    } catch (e) {
      toast.error('Could not update status', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  async function handleSave(id: string | null, data: Omit<Client, 'id'>) {
    if (id) {
      await updateContact(id, data)
      toast.success('Client updated')
    }
    setDrawerOpen(false)
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate('clients')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Clients
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border border-border p-5">
        <Avatar className="h-14 w-14">
          <AvatarImage src={client.avatarUrl} alt={client.name} />
          <AvatarFallback>{client.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-heading-lg text-foreground">{client.name}</h1>
            <ClientStatusSelect value={client.status} onChange={handleStatusChange} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {client.email}
            {client.phone ? ` · ${client.phone}` : ''}
          </p>
        </div>
        <Badge className={`capitalize ${TYPE_STYLES[client.type]}`}>{client.type}</Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.documents.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.notes.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.tasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <OverviewTab
            client={client}
            notesCount={notes.notes.length}
            documentsCount={documents.documents.length}
            tasksCount={tasks.tasks.length}
            onEdit={() => setDrawerOpen(true)}
          />
        </TabsContent>

        <TabsContent value="documents" className="pt-4">
          <DocumentsTab
            documents={documents.documents}
            loading={documents.loading}
            error={documents.error}
            onUpload={documents.uploadDocument}
            onDelete={documents.removeDocument}
            getDocumentUrl={documents.getDocumentUrl}
          />
        </TabsContent>

        <TabsContent value="notes" className="pt-4">
          <NotesTab
            notes={notes.notes}
            loading={notes.loading}
            error={notes.error}
            onAdd={notes.addNote}
            onRemove={notes.removeNote}
          />
        </TabsContent>

        <TabsContent value="tasks" className="pt-4">
          <TasksTab
            tasks={tasks.tasks}
            loading={tasks.loading}
            error={tasks.error}
            onAdd={tasks.addTask}
            onSetStatus={tasks.setTaskStatus}
            onRemove={tasks.removeTask}
          />
        </TabsContent>
      </Tabs>

      <ClientDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        client={client}
        onSave={handleSave}
      />
    </div>
  )
}
