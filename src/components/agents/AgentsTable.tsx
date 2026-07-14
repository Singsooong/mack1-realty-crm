import { useMemo, useState } from 'react'
import { Search, ArrowUpDown, MoreHorizontal, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Agent } from '@/types'

type SortKey = 'name' | 'role' | 'email' | 'listings' | 'sales' | 'status'
type SortState = { key: SortKey; dir: 'asc' | 'desc' }

const PAGE_SIZE = 10

/**
 * Single source of truth for column ordering. Numeric columns compare
 * numerically; everything else is a case-insensitive locale compare.
 * Direction is applied by the caller, so this always returns the ascending
 * relationship.
 */
function compareAgents(a: Agent, b: Agent, key: SortKey): number {
  if (key === 'listings') return a.listings - b.listings
  if (key === 'sales') return a.sales - b.sales
  return String(a[key]).localeCompare(String(b[key]), undefined, { sensitivity: 'base' })
}

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

interface SortButtonProps {
  label: string
  sortKey: SortKey
  sort: SortState | null
  onSort: (key: SortKey) => void
  className?: string
}

function SortButton({ label, sortKey, sort, onSort, className }: SortButtonProps) {
  const active = sort?.key === sortKey
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors hover:text-foreground',
        active ? 'text-foreground' : 'text-muted-foreground',
        className,
      )}
    >
      {label}
      <ArrowUpDown className={cn('h-3.5 w-3.5', active ? 'opacity-100' : 'opacity-40')} />
    </button>
  )
}

interface AgentsTableProps {
  agents: Agent[]
  isAdmin: boolean
  currentAgentId?: string
  onEdit: (agent: Agent) => void
  onDelete: (agent: Agent) => void
  onBulkDelete: (agents: Agent[]) => void
}

export function AgentsTable({
  agents,
  isAdmin,
  currentAgentId,
  onEdit,
  onDelete,
  onBulkDelete,
}: AgentsTableProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Agent['status']>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | Agent['role']>('all')
  const [sort, setSort] = useState<SortState | null>({ key: 'name', dir: 'asc' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pageIndex, setPageIndex] = useState(0)

  function handleSort(key: SortKey) {
    setSort(prev =>
      prev?.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    )
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return agents.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (roleFilter !== 'all' && a.role !== roleFilter) return false
      if (q && !`${a.name} ${a.email} ${a.specialty}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [agents, query, statusFilter, roleFilter])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => compareAgents(a, b, sort.key) * dir)
  }, [filtered, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const page = Math.min(pageIndex, pageCount - 1)
  const pageRows = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const pageIds = pageRows.map(a => a.id)
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id))
  const somePageSelected = pageIds.some(id => selected.has(id))

  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev)
      if (allPageSelected) pageIds.forEach(id => next.delete(id))
      else pageIds.forEach(id => next.add(id))
      return next
    })
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Bulk delete never includes the admin's own record (guarded server-side too).
  const selectedAgents = agents.filter(a => selected.has(a.id) && a.id !== currentAgentId)

  // Columns: select + name + role + email + listings + sales + status (+ actions).
  const colCount = 7 + (isAdmin ? 2 : 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: search + facet filters on the left */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => { setQuery(e.target.value); setPageIndex(0) }}
            placeholder="Search agents…"
            className="pl-8"
          />
        </div>

        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v as typeof statusFilter); setPageIndex(0) }}>
          <SelectTrigger size="sm" className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={roleFilter} onValueChange={v => { setRoleFilter(v as typeof roleFilter); setPageIndex(0) }}>
          <SelectTrigger size="sm" className="w-[120px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
          </SelectContent>
        </Select>

        {/* Contextual bulk action — appears only when admins have a selection */}
        {isAdmin && selectedAgents.length > 0 && (
          <Button
            variant="outline"
            className="ml-auto gap-1.5 text-destructive"
            onClick={() => { onBulkDelete(selectedAgents); setSelected(new Set()) }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete ({selectedAgents.length})
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {isAdmin && (
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all on this page"
                  />
                </TableHead>
              )}
              <TableHead className="pl-4">
                <SortButton label="Name" sortKey="name" sort={sort} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortButton label="Role" sortKey="role" sort={sort} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortButton label="Email" sortKey="email" sort={sort} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-right">
                <SortButton label="Listings" sortKey="listings" sort={sort} onSort={handleSort} className="justify-end" />
              </TableHead>
              <TableHead className="text-right">
                <SortButton label="Sales" sortKey="sales" sort={sort} onSort={handleSort} className="justify-end" />
              </TableHead>
              <TableHead>
                <SortButton label="Status" sortKey="status" sort={sort} onSort={handleSort} />
              </TableHead>
              {isAdmin && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>

          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                  No agents match your filters.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map(agent => {
                const isSelf = agent.id === currentAgentId
                const isSelected = selected.has(agent.id)
                return (
                  <TableRow key={agent.id} data-state={isSelected ? 'selected' : undefined}>
                    {isAdmin && (
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(agent.id)}
                          aria-label={`Select ${agent.name}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={agent.avatarUrl} alt={agent.name} />
                          <AvatarFallback className="text-xs">{initials(agent.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{agent.name}</p>
                          {agent.specialty && (
                            <p className="truncate text-xs text-muted-foreground">{agent.specialty}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">{agent.role}</TableCell>
                    <TableCell className="text-muted-foreground">{agent.email}</TableCell>
                    <TableCell className="text-right tabular-nums">{agent.listings}</TableCell>
                    <TableCell className="text-right tabular-nums">{agent.sales}</TableCell>
                    <TableCell>
                      <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                        {agent.status}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(agent)}>Edit</DropdownMenuItem>
                            {!isSelf && (
                              <DropdownMenuItem variant="destructive" onClick={() => onDelete(agent)}>
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer: selection count + pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {isAdmin && selected.size > 0
            ? `${selected.size} of ${sorted.length} selected`
            : `${sorted.length} ${sorted.length === 1 ? 'agent' : 'agents'}`}
        </span>
        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <span className="tabular-nums">Page {page + 1} of {pageCount}</span>
            <Button
              variant="outline"
              disabled={page === 0}
              onClick={() => setPageIndex(p => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page >= pageCount - 1}
              onClick={() => setPageIndex(p => Math.min(pageCount - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
