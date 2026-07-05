import { Mail, Phone, Calendar, Cake, Tag, FileText, StickyNote, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Client } from '@/types'

interface OverviewTabProps {
  client: Client
  notesCount: number
  documentsCount: number
  tasksCount: number
  onEdit: () => void
}

function Field({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">{value || '—'}</p>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
        <Icon className="h-5 w-5 text-indigo-400" />
      </div>
      <div>
        <p className="text-heading-lg text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function OverviewTab({ client, notesCount, documentsCount, tasksCount, onEdit }: OverviewTabProps) {
  const lastContact = client.lastContact
    ? new Date(client.lastContact).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—'
  // Parse with an explicit local time so a 'YYYY-MM-DD' date isn't shifted a
  // day earlier by UTC interpretation in timezones behind UTC.
  const birthDate = client.birthDate
    ? new Date(`${client.birthDate}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat icon={StickyNote} label="Notes" value={notesCount} />
        <Stat icon={FileText} label="Documents" value={documentsCount} />
        <Stat icon={CheckSquare} label="Tasks" value={tasksCount} />
      </div>

      <div className="rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Client Details</h3>
          <Button variant="outline" onClick={onEdit}>Edit</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field icon={Mail} label="Email Address" value={client.email} />
          <Field icon={Phone} label="Phone Number" value={client.phone} />
          <Field icon={Tag} label="Type" value={client.type.charAt(0).toUpperCase() + client.type.slice(1)} />
          <Field icon={Calendar} label="Last Contact" value={lastContact} />
          <Field icon={Cake} label="Birthdate" value={birthDate} />
        </div>
      </div>
    </div>
  )
}
