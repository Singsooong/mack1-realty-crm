import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useContacts } from '@/hooks/useContacts'
import { usePagination } from '@/hooks/usePagination'
import { useRouter } from '@/lib/router'
import { ClientDrawer } from '@/components/clients/ClientDrawer'
import { DeleteClientDialog } from '@/components/clients/DeleteClientDialog'
import { ClientDetailPage } from '@/pages/ClientDetailPage'
import { TablePagination } from '@/components/shared/TablePagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, MoreHorizontal, Pencil, Search, Trash2 } from 'lucide-react'
import { CLIENT_STATUS_BADGE, CLIENT_STATUS_LABEL } from '@/lib/clientStatus'
import { ClientsPageSkeleton } from '@/components/clients/ClientsPageSkeleton'
import type { Client } from '@/types'

const TYPE_STYLES: Record<string, string> = {
  buyer: 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-950',
  seller: 'bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-400 dark:hover:bg-purple-950',
  investor: 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-950',
}

export function ClientsPage() {
  const { params } = useRouter()

  // A client id in the query string means we're on the dedicated detail view.
  // Rendering it here (rather than as its own top-level page) keeps the existing
  // single-segment router untouched — same trick Listings uses for deep-links.
  if (params.client) {
    return <ClientDetailPage clientId={params.client} />
  }

  return <ClientsList />
}

function ClientsList() {
  const { navigate } = useRouter()
  const { contacts, loading, error, createContact, updateContact, deleteContact } = useContacts()
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)

  const filtered = useMemo(
    () => contacts.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    ),
    [contacts, search],
  )
  const { page, pageCount, pageItems, total, pageSize, next, prev } = usePagination(filtered)

  if (loading) return <ClientsPageSkeleton />
  if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>

  function handleAdd() {
    setEditingClient(null)
    setDrawerOpen(true)
  }

  function handleEdit(client: Client) {
    setEditingClient(client)
    setDrawerOpen(true)
  }

  function handleDrawerClose() {
    setDrawerOpen(false)
    setEditingClient(null)
  }

  async function handleSave(id: string | null, data: Omit<Client, 'id'>) {
    if (id === null) await createContact(data)
    else await updateContact(id, data)
    toast.success(id === null ? 'Client added' : 'Client updated')
    handleDrawerClose()
  }

  async function handleDelete() {
    if (!deletingClient) return
    await deleteContact(deletingClient.id)
    toast.success('Client deleted')
    setDeletingClient(null)
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium leading-tight text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground">{contacts.length} clients</p>
        </div>
        <Button onClick={handleAdd}>+ Add Client</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clients..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map(client => (
              <TableRow
                key={client.id}
                className="border-border hover:bg-muted/30 cursor-pointer"
                onClick={() => navigate('clients', { client: client.id })}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={client.avatarUrl} alt={client.name} />
                      <AvatarFallback>{client.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground text-sm">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`capitalize ${TYPE_STYLES[client.type]}`}>{client.type}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{client.phone}</TableCell>
                <TableCell>
                  <Badge className={CLIENT_STATUS_BADGE[client.status]}>{CLIENT_STATUS_LABEL[client.status]}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(client.lastContact).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate('clients', { client: client.id })}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(client)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeletingClient(client)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          pageCount={pageCount}
          total={total}
          pageSize={pageSize}
          onPrev={prev}
          onNext={next}
        />
      </div>

      <ClientDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        client={editingClient}
        onSave={handleSave}
      />

      <DeleteClientDialog
        client={deletingClient}
        onConfirm={handleDelete}
        onCancel={() => setDeletingClient(null)}
      />
    </div>
  )
}
