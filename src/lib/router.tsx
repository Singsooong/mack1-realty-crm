import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Page } from '../types'

interface RouterContextValue {
  page: Page
  navigate: (page: Page) => void
}

const RouterContext = createContext<RouterContextValue>({
  page: 'dashboard',
  navigate: () => {},
})

export function RouterProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>('dashboard')
  return (
    <RouterContext.Provider value={{ page, navigate: setPage }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  return useContext(RouterContext)
}
