import { useRouter } from '@/lib/router'
import { DashboardPage } from '@/pages/DashboardPage'
import { ListingsPage } from '@/pages/ListingsPage'

export function PageRouter() {
  const { page } = useRouter()
  const pages: Partial<Record<string, React.ReactElement>> = {
    dashboard: <DashboardPage />,
    listings: <ListingsPage />,
  }
  return pages[page] ?? <div className="p-6 text-muted-foreground">Coming soon: {page}</div>
}
