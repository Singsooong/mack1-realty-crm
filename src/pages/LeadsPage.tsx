import { useState } from 'react'
import { toast } from 'sonner'
import { useLeads } from '@/hooks/useLeads'
import { useAgents } from '@/hooks/useAgents'
import { usePagination } from '@/hooks/usePagination'
import { TablePagination } from '@/components/shared/TablePagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { LeadDrawer } from '@/components/leads/LeadDrawer'
import { DeleteLeadDialog } from '@/components/leads/DeleteLeadDialog'
import { LeadsPageSkeleton } from '@/components/leads/LeadsPageSkeleton'
import type { Lead } from '@/types'

type LeadFormData = Omit<Lead, 'id' | 'assignedAgentName'>

const STATUS_STYLES: Record<Lead['status'], string> = {
  new: 'bg-muted text-muted-foreground',
  contacted: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  qualified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  converted: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  lost: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function LeadsPage() {
  const { leads, loading, error, createLead, updateLead, deleteLead } = useLeads()
  const { agents } = useAgents()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null)
  const { page, pageCount, pageItems, total, pageSize, next, prev } = usePagination(leads)

  function handleDrawerClose() {
    setDrawerOpen(false)
    setEditingLead(null)
  }

  async function handleSave(id: string | null, data: LeadFormData) {
    if (id === null) {
      await createLead(data)
    } else {
      await updateLead(id, data)
    }
    toast.success(id === null ? 'Lead added' : 'Lead updated')
    handleDrawerClose()
  }

  async function handleDelete() {
    if (!deletingLead) return
    await deleteLead(deletingLead.id)
    toast.success('Lead deleted')
    setDeletingLead(null)
  }

  if (loading) return <LeadsPageSkeleton />
  if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium leading-tight text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">{leads.length} active leads</p>
        </div>
        <Button onClick={() => { setEditingLead(null); setDrawerOpen(true) }}>
          + New Lead
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead>Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Property Interest</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned Agent</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map(lead => (
              <TableRow key={lead.id} className="border-border hover:bg-muted/30">
                <TableCell className="font-semibold text-foreground text-sm whitespace-nowrap">{lead.name}</TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm text-muted-foreground">{lead.email}</p>
                    <p className="text-sm text-muted-foreground">{lead.phone}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{lead.propertyInterest}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                  <span className="line-clamp-1">{lead.message}</span>
                </TableCell>
                <TableCell>
                  <Badge className={`capitalize ${STATUS_STYLES[lead.status]}`}>{lead.status}</Badge>
                </TableCell>
                <TableCell className="text-sm font-medium text-foreground whitespace-nowrap">{lead.assignedAgentName}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(lead.date)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingLead(lead); setDrawerOpen(true) }}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeletingLead(lead)}>
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

      <LeadDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        lead={editingLead}
        agents={agents}
        onSave={handleSave}
      />
      <DeleteLeadDialog
        lead={deletingLead}
        onConfirm={handleDelete}
        onCancel={() => setDeletingLead(null)}
      />
    </div>
  )
}
