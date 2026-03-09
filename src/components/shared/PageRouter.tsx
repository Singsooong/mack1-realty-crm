import { useRouter } from '@/lib/router'
import { DashboardPage } from '@/pages/DashboardPage'

export function PageRouter() {
  const { page } = useRouter()
  if (page === 'dashboard') return <DashboardPage />
  return <div className="p-6 text-muted-foreground">Coming soon: {page}</div>
}
