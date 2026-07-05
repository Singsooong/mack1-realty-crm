import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { CLIENT_STATUS_BADGE, CLIENT_STATUS_LABEL, CLIENT_STATUS_ORDER } from '@/lib/clientStatus'
import { cn } from '@/lib/utils'
import type { ClientStatus } from '@/types'

interface ClientStatusSelectProps {
  value: ClientStatus
  onChange: (status: ClientStatus) => void
  disabled?: boolean
  className?: string
}

/**
 * The pipeline-stage control shown in the client header. Renders the current
 * stage as a colored pill (matching the table badge) that doubles as the
 * dropdown trigger — free movement to any stage (no forced linear progression).
 */
export function ClientStatusSelect({ value, onChange, disabled, className }: ClientStatusSelectProps) {
  return (
    <Select value={value} onValueChange={v => onChange(v as ClientStatus)} disabled={disabled}>
      <SelectTrigger
        size="sm"
        className={cn('w-auto rounded-full border-0 font-medium', CLIENT_STATUS_BADGE[value], className)}
      >
        {CLIENT_STATUS_LABEL[value]}
      </SelectTrigger>
      <SelectContent align="start">
        {CLIENT_STATUS_ORDER.map(s => (
          <SelectItem key={s} value={s}>{CLIENT_STATUS_LABEL[s]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
