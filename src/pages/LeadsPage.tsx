import { leadsData } from '@/lib/mock-data'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MoreHorizontal } from 'lucide-react'
import type { Lead } from '@/types'

const STAGE_STYLES: Record<Lead['stage'], string> = {
  new: 'bg-zinc-800 text-zinc-300',
  contacted: 'bg-blue-950 text-blue-400',
  qualified: 'bg-purple-950 text-purple-400',
  proposal: 'bg-amber-950 text-amber-400',
  closed: 'bg-emerald-950 text-emerald-400',
}

const SOURCE_STYLES: Record<Lead['source'], string> = {
  website: 'bg-sky-950 text-sky-400',
  referral: 'bg-violet-950 text-violet-400',
  social: 'bg-pink-950 text-pink-400',
  ads: 'bg-orange-950 text-orange-400',
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
              <TableHead>Lead</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Probability</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {leadsData.map(lead => (
              <TableRow key={lead.id} className="border-border hover:bg-muted/30">
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground text-sm">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`capitalize ${SOURCE_STYLES[lead.source]}`}>{lead.source}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`capitalize ${STAGE_STYLES[lead.stage]}`}>{lead.stage}</Badge>
                </TableCell>
                <TableCell className="text-sm font-medium text-foreground">${lead.value.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <Progress value={lead.probability} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-8">{lead.probability}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{lead.assignedTo}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
