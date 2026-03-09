import { useRouter } from '@/lib/router'
import { DashboardPage } from '@/pages/DashboardPage'
import { ListingsPage } from '@/pages/ListingsPage'
import { AgentsPage } from '@/pages/AgentsPage'
import { ContactsPage } from '@/pages/ContactsPage'
import { LeadsPage } from '@/pages/LeadsPage'
import { TasksPage } from '@/pages/TasksPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { ESignPage } from '@/pages/ESignPage'

export function PageRouter() {
  const { page } = useRouter()

  const pages: Partial<Record<string, React.ReactElement>> = {
    dashboard: <DashboardPage />,
    listings: <ListingsPage />,
    agents: <AgentsPage />,
    contacts: <ContactsPage />,
    leads: <LeadsPage />,
    tasks: <TasksPage />,
    calendar: <CalendarPage />,
    esign: <ESignPage />,
  }

  return pages[page] ?? (
    <div className="p-6 flex items-center justify-center h-full text-muted-foreground">
      Page not found: {page}
    </div>
  )
}
