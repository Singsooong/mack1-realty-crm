import { Bell, Settings, Mic, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { adminUser } from '@/lib/mock-data'
import { Separator } from '@/components/ui/separator'

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 h-[72px] bg-background border-b border-border shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search properties, agents..." className="pl-9 w-72 bg-muted/40 border-border" />
        </div>
        <Button variant="outline" size="sm" className="gap-2 rounded-full">
          <Mic className="h-4 w-4" />
          AI Assistant
        </Button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarImage src={adminUser.avatarUrl} alt={adminUser.name} />
            <AvatarFallback>{adminUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold text-foreground">{adminUser.name}</span>
            <span className="text-xs text-muted-foreground">{adminUser.role}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
