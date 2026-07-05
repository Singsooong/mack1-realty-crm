import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar, AlertCircle, Video, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { MergedCalendarEvent } from '@/hooks/useGoogleCalendar'
import type { ScheduleMeetingData } from './ScheduleMeetingDialog'

interface ClientContact {
  name: string
  email: string
}

interface EditMeetingDialogProps {
  event: MergedCalendarEvent
  contacts: ClientContact[]
  onUpdate: (data: ScheduleMeetingData) => Promise<void>
  onClose: () => void
}

function eventToFormData(event: MergedCalendarEvent): ScheduleMeetingData {
  const date = event.startTime.split('T')[0]
  const startTime = event.startTime.split('T')[1]?.substring(0, 5) ?? '09:00'
  const endTime = event.endTime.split('T')[1]?.substring(0, 5) ?? '10:00'
  const [firstAttendee, ...rest] = event.attendees
  return {
    title: event.title,
    description: event.description ?? '',
    date,
    startTime,
    endTime,
    location: event.location ?? '',
    clientEmail: firstAttendee?.email ?? '',
    attendeeEmails: rest.map(a => a.email),
    includeGoogleMeet: !!event.meetLink,
  }
}

export function EditMeetingDialog({ event, contacts, onUpdate, onClose }: EditMeetingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ScheduleMeetingData>(() => eventToFormData(event))

  const todayStr = new Date().toLocaleDateString('en-CA')
  const nowTimeStr = new Date().toTimeString().substring(0, 5)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      await onUpdate(formData)
      toast.success('Meeting updated successfully')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update meeting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !loading && !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Edit Meeting
          </DialogTitle>
        </DialogHeader>
        {error && (
          <div className="flex items-start gap-3 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Meeting Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Client</label>
            <select
              required
              value={formData.clientEmail}
              onChange={e => setFormData({ ...formData, clientEmail: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select a client</option>
              {contacts.map(contact => (
                <option key={contact.email} value={contact.email}>
                  {contact.name} ({contact.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full min-h-16 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Date</label>
            <input
              type="date"
              required
              min={todayStr}
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Start Time</label>
              <input
                type="time"
                required
                min={formData.date === todayStr ? nowTimeStr : undefined}
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">End Time</label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <input
              type="checkbox"
              id="editIncludeGoogleMeet"
              checked={formData.includeGoogleMeet}
              onChange={e => setFormData({ ...formData, includeGoogleMeet: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="editIncludeGoogleMeet" className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer flex-1">
              <Video className="h-4 w-4" />
              <span>Add Google Meet link</span>
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
