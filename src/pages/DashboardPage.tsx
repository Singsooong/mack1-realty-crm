import { PageHeader } from '@/components/dashboard/PageHeader'
import { StatCardGrid } from '@/components/dashboard/StatCardGrid'
import { LeadsTrendChart } from '@/components/dashboard/LeadsTrendChart'
import { StatusAnalysisChart } from '@/components/dashboard/StatusAnalysisChart'
import { PropertyGrid } from '@/components/dashboard/PropertyGrid'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useRouter } from '@/lib/router'
import { downloadCsv } from '@/lib/csv'

export function DashboardPage() {
  const { navigate } = useRouter()
  const { statCards, leadPipeline, leadsByMonth, recentProperties, loading, error } = useDashboardStats()

  function handleExport() {
    // One flat CSV mirroring exactly what's on screen — each section is tagged
    // so the rows stay parseable in a spreadsheet.
    const rows: (string | number)[][] = [
      ...statCards.map((c) => ['Overview', c.label, c.value]),
      ...leadPipeline.map((s) => ['Lead Pipeline', s.label, s.value]),
      ...leadsByMonth.map((m) => ['Leads Over Time', m.month, m.leads]),
    ]
    const today = new Date().toISOString().slice(0, 10)
    downloadCsv(`dashboard-${today}.csv`, ['Section', 'Metric', 'Value'], rows)
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-none border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load dashboard data: {error}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6">
        <PageHeader exportDisabled />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[116px] rounded-none bg-muted animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] gap-6">
          <div className="h-[320px] rounded-none bg-muted animate-pulse" />
          <div className="h-[320px] rounded-none bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <PageHeader onExport={handleExport} />
      <StatCardGrid cards={statCards} />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] gap-6">
        <StatusAnalysisChart title="Lead Pipeline" data={leadPipeline} />
        <LeadsTrendChart data={leadsByMonth} />
      </div>
      <PropertyGrid
        properties={recentProperties}
        onViewAll={() => navigate('listings')}
        onSelect={(property) => navigate('listings', { listing: property.id })}
      />
    </div>
  )
}
