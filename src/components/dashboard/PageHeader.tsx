import { Button } from '@/components/ui/button'
import { Plus, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function PageHeader() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <Badge variant="secondary" className="text-xs">Overview</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Export
        </Button>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Property
        </Button>
      </div>
    </div>
  )
}
