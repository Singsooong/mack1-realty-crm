import { useRouter } from '@/lib/router'
import { DashboardPage } from '@/pages/DashboardPage'
import { ListingsPage } from '@/pages/ListingsPage'
import { AgentsPage } from '@/pages/AgentsPage'
import { ContactsPage } from '@/pages/ContactsPage'
import { LeadsPage } from '@/pages/LeadsPage'

export function PageRouter() {
  const { page } = useRouter()
  const pages: Partial<Record<string, React.ReactElement>> = {
    dashboard: <DashboardPage />,
    listings: <ListingsPage />,
    agents: <AgentsPage />,
    contacts: <ContactsPage />,
    leads: <LeadsPage />,
  }
  return pages[page] ?? <div className="p-6 text-muted-foreground">Coming soon: {page}</div>
}
