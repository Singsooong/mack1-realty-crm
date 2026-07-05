import { Search, Sun, Moon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { NotificationBell } from '@/components/shared/NotificationBell'

export function Header() {
  const { isDark, toggleTheme } = useTheme()
  const { agentRecord } = useAuth()
  const initials = agentRecord?.name
    ? agentRecord.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <header className="flex items-center justify-between px-6 h-[72px] bg-background border-b border-border shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search properties, agents..." className="pl-9 w-72 bg-muted/40 border-border" />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        {/* Theme toggle pill */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 transition-colors hover:bg-muted"
        >
          <Sun className={cn('h-3.5 w-3.5 transition-opacity', isDark ? 'opacity-40' : 'opacity-100')} />
          <div className={cn(
            'relative h-[18px] w-[34px] rounded-full transition-colors',
            isDark ? 'bg-indigo-500' : 'bg-slate-200'
          )}>
            <div className={cn(
              'absolute top-[2px] h-[14px] w-[14px] rounded-full shadow-sm transition-all duration-200',
              isDark ? 'translate-x-[16px] bg-white' : 'translate-x-[2px] bg-indigo-500'
            )} />
          </div>
          <Moon className={cn('h-3.5 w-3.5 transition-opacity', isDark ? 'opacity-100' : 'opacity-40')} />
        </button>

        <Separator orientation="vertical" className="h-6 mx-1" />
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarImage src={agentRecord?.avatarUrl ?? undefined} alt={agentRecord?.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold text-foreground">{agentRecord?.name}</span>
            <span className="text-xs text-muted-foreground capitalize">{agentRecord?.role}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
