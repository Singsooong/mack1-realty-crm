import { PageHeader } from '@/components/dashboard/PageHeader'
import { StatCardGrid } from '@/components/dashboard/StatCardGrid'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { StatusAnalysisChart } from '@/components/dashboard/StatusAnalysisChart'
import { PropertyGrid } from '@/components/dashboard/PropertyGrid'

export function DashboardPage() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <PageHeader />
      <StatCardGrid />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] gap-6">
        <StatusAnalysisChart />
        <RevenueChart />
      </div>
      <PropertyGrid />
    </div>
  )
}
