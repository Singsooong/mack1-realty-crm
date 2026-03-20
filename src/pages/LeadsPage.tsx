import { leadsData } from '@/lib/mock-data'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import type { Lead } from '@/types'

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
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">{leadsData.length} active leads</p>
        </div>
        <Button size="sm">+ New Lead</Button>
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
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {leadsData.map(lead => (
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
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground gap-1">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
