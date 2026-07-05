import { Suspense, lazy, useMemo, useState } from 'react'
import { useRouter } from '@/lib/router'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ListingsPageSkeleton } from '@/components/listings/ListingsPageSkeleton'
import { AgentsPageSkeleton } from '@/components/agents/AgentsPageSkeleton'
import { ClientsPageSkeleton } from '@/components/clients/ClientsPageSkeleton'
import { LeadsPageSkeleton } from '@/components/leads/LeadsPageSkeleton'
import { TasksPageSkeleton } from '@/components/tasks/TasksPageSkeleton'
import { CalendarPageSkeleton } from '@/components/calendar/CalendarPageSkeleton'
import { ESignPageSkeleton } from '@/components/esign/ESignPageSkeleton'

const ListingsPage = lazy(() => import('@/pages/ListingsPage').then(m => ({ default: m.ListingsPage })))
const AgentsPage = lazy(() => import('@/pages/AgentsPage').then(m => ({ default: m.AgentsPage })))
const ClientsPage = lazy(() => import('@/pages/ClientsPage').then(m => ({ default: m.ClientsPage })))
const LeadsPage = lazy(() => import('@/pages/LeadsPage').then(m => ({ default: m.LeadsPage })))
const TasksPage = lazy(() => import('@/pages/TasksPage').then(m => ({ default: m.TasksPage })))
const CalendarPage = lazy(() => import('@/pages/CalendarPage').then(m => ({ default: m.CalendarPage })))
const ESignPage = lazy(() => import('@/pages/ESignPage').then(m => ({ default: m.ESignPage })))
const GoogleAuthCallbackPage = lazy(() => import('@/pages/GoogleAuthCallbackPage').then(m => ({ default: m.GoogleAuthCallbackPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))

function PageLoader() {
  return <div className="flex items-center justify-center p-8">Loading...</div>
}

export function PageRouter() {
  const { page } = useRouter()

  // Each Suspense fallback reuses the same skeleton the page itself shows
  // while its data loads, so there's exactly one continuous skeleton across
  // both the JS-chunk-load and data-load phases — never a text flash.
  const PAGES = useMemo(() => [
    { id: 'dashboard', element: <DashboardPage /> },
    { id: 'listings', element: <Suspense fallback={<ListingsPageSkeleton />}><ListingsPage /></Suspense> },
    { id: 'agents', element: <Suspense fallback={<AgentsPageSkeleton />}><AgentsPage /></Suspense> },
    { id: 'clients', element: <Suspense fallback={<ClientsPageSkeleton />}><ClientsPage /></Suspense> },
    { id: 'leads', element: <Suspense fallback={<LeadsPageSkeleton />}><LeadsPage /></Suspense> },
    { id: 'tasks', element: <Suspense fallback={<TasksPageSkeleton />}><TasksPage /></Suspense> },
    { id: 'calendar', element: <Suspense fallback={<CalendarPageSkeleton />}><CalendarPage /></Suspense> },
    { id: 'esign', element: <Suspense fallback={<ESignPageSkeleton />}><ESignPage /></Suspense> },
    { id: 'google-auth-callback', element: <Suspense fallback={<PageLoader />}><GoogleAuthCallbackPage /></Suspense> },
    { id: 'settings', element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },
    { id: 'not-found', element: <NotFoundPage /> },
  ], [])

  // Mount a page the first time it's visited, then keep it mounted (hidden
  // via CSS, not unmounted) so switching back is instant and preserves
  // scroll/filter state. Pages never visited this session never mount, so
  // their data fetches and subscriptions don't run until needed. Updating
  // state mid-render (rather than in an effect) means React re-renders with
  // the new page included before committing — no blank-frame flash.
  const [visitedPages, setVisitedPages] = useState<ReadonlySet<string>>(() => new Set([page]))
  if (!visitedPages.has(page)) {
    setVisitedPages(prev => new Set(prev).add(page))
  }

  return (
    <>
      {PAGES.filter(({ id }) => visitedPages.has(id)).map(({ id, element }) => (
        <div key={id} className={page === id ? 'contents' : 'hidden'}>
          {element}
        </div>
      ))}
    </>
  )
}
