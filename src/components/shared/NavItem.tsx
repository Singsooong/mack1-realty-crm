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
        'w-full transition-all h-10 px-3',
        !isCollapsed && 'justify-start gap-3',
        isActive
          ? 'bg-foreground/10 text-foreground font-semibold hover:bg-foreground/10'
          : 'text-sidebar-foreground hover:bg-foreground/6 hover:text-foreground',
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5 shrink-0" />
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
