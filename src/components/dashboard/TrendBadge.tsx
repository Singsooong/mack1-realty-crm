import { TrendingUp, TrendingDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TrendBadgeProps {
  value: number
  direction: 'up' | 'down'
}

export function TrendBadge({ value, direction }: TrendBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1 text-xs font-semibold',
        direction === 'up'
          ? 'bg-emerald-950 text-emerald-400 hover:bg-emerald-950'
          : 'bg-red-950 text-red-400 hover:bg-red-950',
      )}
    >
      {direction === 'up'
        ? <TrendingUp className="h-3 w-3" />
        : <TrendingDown className="h-3 w-3" />}
      {value}%
    </Badge>
  )
}
