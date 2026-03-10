import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface NavItemProps {
  icon: LucideIcon
  label: string
  isActive: boolean
  isCollapsed: boolean
  onClick: () => void
}

export function NavItem({ icon: Icon, label, isActive, isCollapsed, onClick }: NavItemProps) {
  const btn = (
    <Button
      variant="ghost"
      size={isCollapsed ? 'icon' : 'default'}
      className={cn(
        'w-full transition-all',
        !isCollapsed && 'justify-start gap-3',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span>{label}</span>}
    </Button>
  )

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return btn
}
