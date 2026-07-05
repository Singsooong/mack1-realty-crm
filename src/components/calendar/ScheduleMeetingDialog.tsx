import { useState } from 'react'
import { format, parse } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { TimePicker } from '@/components/ui/time-picker'
import { Button } from '@/components/ui/button'
import { Plus, Calendar as CalendarIcon, Clock, AlertCircle, Video, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ClientContact {
  name: string
  email: string
}

interface ScheduleMeetingProps {
  onSchedule: (data: ScheduleMeetingData) => Promise<void>
  contacts: ClientContact[]
}

export interface ScheduleMeetingData {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  clientEmail: string
  attendeeEmails: string[]
  includeGoogleMeet: boolean
}

const defaultForm = (): ScheduleMeetingData => ({
  title: '',
  description: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  startTime: '09:00',
  endTime: '10:00',
  location: '',
  clientEmail: '',
  attendeeEmails: [],
  includeGoogleMeet: true,
})

export function ScheduleMeetingDialog({ onSchedule, contacts }: ScheduleMeetingProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ScheduleMeetingData>(defaultForm)
  const [dateOpen, setDateOpen] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const selectedDate = parse(formData.date, 'yyyy-MM-dd', new Date())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const selectedDateTime = new Date(`${formData.date}T${formData.startTime}`)
    if (selectedDateTime <= new Date()) {
      setError('Start time must be in the future.')
      return
    }
    try {
      setLoading(true)
      setError(null)
      await onSchedule(formData)
      toast.success('Meeting scheduled successfully')
      setOpen(false)
      setFormData(defaultForm())
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to schedule meeting'
      setError(errorMsg)
      console.error('Failed to schedule meeting:', err)
    } finally {
      setLoading(false)
    }
  }

  // Closing the dialog must clear any leftover state — otherwise a validation
  // error (or a half-filled form) is still there the next time it opens.
  function handleOpenChange(next: boolean) {
    if (loading) return
    setOpen(next)
    if (!next) {
      setError(null)
      setFormData(defaultForm())
      setDateOpen(false)
      setStartOpen(false)
      setEndOpen(false)
    }
  }

  function formatDisplayTime(time24: string) {
    const [hh, mm] = time24.split(':')
    const h = parseInt(hh, 10)
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}:${mm} ${period}`
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Schedule Meeting
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-3 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meeting Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Meeting Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Property Showing"
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Client Selection */}
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

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional notes about the meeting…"
              className="w-full min-h-16 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Date</label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setFormData({ ...formData, date: format(date, 'yyyy-MM-dd') })
                      setDateOpen(false)
                    }
                  }}
                  disabled={(date) => date < today}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Start Time</label>
              <Popover open={startOpen} onOpenChange={setStartOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-start font-normal">
                    <Clock className="mr-2 h-4 w-4" />
                    {formatDisplayTime(formData.startTime)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <TimePicker
                    value={formData.startTime}
                    onChange={(t) => setFormData({ ...formData, startTime: t })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">End Time</label>
              <Popover open={endOpen} onOpenChange={setEndOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-start font-normal">
                    <Clock className="mr-2 h-4 w-4" />
                    {formatDisplayTime(formData.endTime)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <TimePicker
                    value={formData.endTime}
                    onChange={(t) => setFormData({ ...formData, endTime: t })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., 123 Main St, Suite 100"
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Google Meet Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <input
              type="checkbox"
              id="includeGoogleMeet"
              checked={formData.includeGoogleMeet}
              onChange={e => setFormData({ ...formData, includeGoogleMeet: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="includeGoogleMeet" className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer flex-1">
              <Video className="h-4 w-4" />
              <span>Add Google Meet link</span>
            </label>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scheduling…
              </>
            ) : 'Schedule Meeting'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
