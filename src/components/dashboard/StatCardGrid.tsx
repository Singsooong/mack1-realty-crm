import { StatCard } from './StatCard'
import type { StatCard as StatCardType } from '@/types'

export function StatCardGrid({ cards }: { cards: StatCardType[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.id} card={card} />
      ))}
    </div>
  )
}
