import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Check, ChevronDown, Loader2, RefreshCw, Unlink } from 'lucide-react'

interface GoogleCalendarButtonProps {
  isAuthenticated: boolean
  connectedEmail: string | null | undefined
  getAuthUrl: () => Promise<string>
  disconnect: () => Promise<void>
}

export function GoogleCalendarButton({ isAuthenticated, connectedEmail, getAuthUrl, disconnect }: GoogleCalendarButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleConnect() {
    try {
      setLoading(true)
      const authUrl = await getAuthUrl()
      window.location.href = authUrl
    } catch (err) {
      console.error('Failed to get auth URL:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    try {
      setLoading(true)
      await disconnect()
    } catch (err) {
      console.error('Failed to disconnect Google Calendar:', err)
    } finally {
      setLoading(false)
    }
  }

  if (isAuthenticated) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" disabled={loading}>
            <Check className="h-4 w-4 text-emerald-600" />
            {connectedEmail === undefined
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : (connectedEmail ?? 'Google Calendar Connected')}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleConnect} className="gap-2 cursor-pointer">
            <RefreshCw className="h-4 w-4" />
            Reconnect
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDisconnect}
            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <Unlink className="h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={loading}
      variant="outline"
      className="gap-2"
    >
      {loading ? 'Connecting…' : 'Connect Google Calendar'}
    </Button>
  )
}
