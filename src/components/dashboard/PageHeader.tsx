import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface PageHeaderProps {
  onExport?: () => void
  exportDisabled?: boolean
}

export function PageHeader({ onExport, exportDisabled }: PageHeaderProps) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className="flex items-end justify-between">
      <div className="flex flex-col gap-1.5">
        {/* Nike eyebrow: caption-sm, uppercase, no tracking (spec is letterSpacing 0) */}
        <span className="text-caption-sm uppercase text-muted-foreground">{today}</span>
        <h1 className="text-heading-xl text-foreground">Dashboard</h1>
      </div>
      <Button variant="outline" className="gap-2" onClick={onExport} disabled={exportDisabled}>
        <Download className="h-4 w-4" /> Export
      </Button>
    </div>
  )
}
