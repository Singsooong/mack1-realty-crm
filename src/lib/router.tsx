import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Page } from '../types'

interface RouterContextValue {
  page: Page
  /** Extra query params beyond `page` (e.g. { doc: '<id>' } for deep-links). */
  params: Record<string, string>
  navigate: (page: Page, params?: Record<string, string>) => void
}

const RouterContext = createContext<RouterContextValue>({
  page: 'dashboard',
  params: {},
  navigate: () => {},
})

const PAGES: Page[] = [
  'dashboard',
  'listings',
  'agents',
  'clients',
  'leads',
  'tasks',
  'calendar',
  'esign',
  'settings',
  'google-auth-callback',
]

function readState(): { page: Page; params: Record<string, string> } {
  // Page identity lives in the path (`/listings`); deep-link data stays in
  // the query string (`/listings?listing=<id>`).
  const segment = window.location.pathname.replace(/^\/+|\/+$/g, '')
  const isRoot = segment === ''
  const page = isRoot ? 'dashboard' : (PAGES as string[]).includes(segment) ? (segment as Page) : 'not-found'
  const params: Record<string, string> = {}
  new URLSearchParams(window.location.search).forEach((value, key) => {
    params[key] = value
  })
  return { page, params }
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [{ page, params }, setState] = useState(readState)

  useEffect(() => {
    const handlePopState = () => setState(readState())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (newPage: Page, extra: Record<string, string> = {}) => {
    const search = new URLSearchParams(extra)
    const query = search.toString()
    window.history.pushState({}, '', `/${newPage}${query ? `?${query}` : ''}`)
    setState({ page: newPage, params: extra })
  }

  return (
    <RouterContext.Provider value={{ page, params, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  return useContext(RouterContext)
}
