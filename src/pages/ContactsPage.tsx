import { useState } from 'react'
import { contactsData } from '@/lib/mock-data'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MoreHorizontal } from 'lucide-react'

const TYPE_STYLES: Record<string, string> = {
  buyer: 'bg-blue-950 text-blue-400 hover:bg-blue-950',
  seller: 'bg-purple-950 text-purple-400 hover:bg-purple-950',
  investor: 'bg-amber-950 text-amber-400 hover:bg-amber-950',
}

export function ContactsPage() {
  const [search, setSearch] = useState('')
  const filtered = contactsData.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground">{contactsData.length} contacts</p>
        </div>
        <Button size="sm">+ Add Contact</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search contacts..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(contact => (
              <TableRow key={contact.id} className="border-border hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contact.avatarUrl} alt={contact.name} />
                      <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground text-sm">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`capitalize ${TYPE_STYLES[contact.type]}`}>{contact.type}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{contact.phone}</TableCell>
                <TableCell>
                  <Badge variant={contact.status === 'active' ? 'secondary' : 'outline'} className={contact.status === 'active' ? 'bg-emerald-950 text-emerald-400 hover:bg-emerald-950' : ''}>
                    {contact.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(contact.lastContact).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </TableCell>
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
