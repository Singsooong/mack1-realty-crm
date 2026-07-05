import { Compass } from 'lucide-react'
import { useRouter } from '@/lib/router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { navigate } = useRouter()

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center space-y-4">
        <Compass className="mx-auto size-10 text-muted-foreground" />
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-foreground">Page not found</h1>
          <p className="text-sm text-muted-foreground">The page you tried to visit doesn't exist.</p>
        </div>
        <Button onClick={() => navigate('dashboard')}>Back to dashboard</Button>
      </div>
    </div>
  )
}
