import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendBadgeProps {
  value: number
  direction: 'up' | 'down'
}

export function TrendBadge({ value, direction }: TrendBadgeProps) {
  const Icon = direction === 'up' ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        // Nike: the only non-neutral chrome colors are success (#007d48, up) and
        // sale (#d30005, down), rendered as TEXT with no container — the system's
        // only container-less "badge". Brighter variants on dark surfaces.
        direction === 'up'
          ? 'text-[#007d48] dark:text-[#1eaa52]'
          : 'text-[#d30005] dark:text-[#f1564a]',
      )}
    >
      <Icon className="h-3 w-3" />
      {value}%
    </span>
  )
}
