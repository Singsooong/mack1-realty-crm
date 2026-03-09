import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(c => !c)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
