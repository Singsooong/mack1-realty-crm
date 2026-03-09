import {
  LayoutDashboard, Home, Users, BookUser, Target,
  CheckSquare, Calendar, FileSignature, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import logo from '@/assets/mack1-transparent.png'
import { NavItem } from './NavItem'
import { cn } from '@/lib/utils'
import { useRouter } from '@/lib/router'
import type { Page } from '@/types'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Home, Users, BookUser, Target, CheckSquare, Calendar, FileSignature, Settings,
}

const MAIN_NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'listings', label: 'Listings', icon: 'Home' },
  { id: 'agents', label: 'Agents', icon: 'Users' },
  { id: 'contacts', label: 'Contacts', icon: 'BookUser' },
  { id: 'leads', label: 'Leads', icon: 'Target' },
  { id: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
  { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
  { id: 'esign', label: 'E-Sign', icon: 'FileSignature' },
]

interface SidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const { page, navigate } = useRouter()

  return (
    <nav
      aria-label="Sidebar navigation"
      className={cn(
        'relative flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out shrink-0',
        isCollapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-[72px] px-3">
        {isCollapsed ? (
          <img src={logo} alt="Mack 1 Realty Group" className="h-10 w-10 object-contain object-left" />
        ) : (
          <img src={logo} alt="Mack 1 Realty Group" className="h-14 w-full object-contain object-left" />
        )}
      </div>

      <Separator />

      {/* Collapse toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3.5 top-[52px] z-10 h-7 w-7 rounded-full shadow-sm"
      >
        {isCollapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft className="h-3 w-3" />}
      </Button>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 flex flex-col gap-0.5">
        {MAIN_NAV.map((item) => (
          <NavItem
            key={item.id}
            icon={ICON_MAP[item.icon]}
            label={item.label}
            isActive={item.id === page}
            isCollapsed={isCollapsed}
            onClick={() => navigate(item.id)}
          />
        ))}

        <div className="mt-auto pt-4">
          <Separator className="mb-4" />
          <NavItem
            icon={Settings}
            label="Settings"
            isActive={page === 'settings'}
            isCollapsed={isCollapsed}
            onClick={() => navigate('settings')}
          />
        </div>
      </div>
    </nav>
  )
}
