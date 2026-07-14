import { Building2, DollarSign, Tag, Users, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TrendBadge } from './TrendBadge'
import { MiniSparkline } from './MiniSparkline'
import type { StatCard as StatCardType } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = {
  building: Building2,
  dollar: DollarSign,
  tag: Tag,
  users: Users,
}

export function StatCard({ card }: { card: StatCardType }) {
  const Icon = ICON_MAP[card.iconVariant]
  const hasTrend = card.trend !== undefined && card.trendDirection !== undefined
  const hasSparkline = card.sparklineData !== undefined && card.sparklineData.length > 0

  return (
    <Card>
      <CardContent className="p-6 flex justify-between items-start gap-4">
        <div className="flex flex-col gap-2 min-w-0">
          <span className="text-xs font-medium leading-normal uppercase text-muted-foreground">{card.label}</span>
          <span className="text-3xl font-medium leading-tight text-foreground">{card.value}</span>
          {hasTrend ? (
            <div className="flex items-center gap-2 mt-1">
              <TrendBadge value={card.trend!} direction={card.trendDirection!} />
              {card.hint && <span className="text-xs text-muted-foreground">{card.hint}</span>}
            </div>
          ) : card.hint ? (
            <span className="text-xs text-muted-foreground mt-1">{card.hint}</span>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          {hasSparkline && (
            <MiniSparkline
              data={card.sparklineData!}
              color={card.sparklineColor ?? 'oklch(0.696 0.17 162.48)'}
              variant={card.sparklineVariant ?? 'line'}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
