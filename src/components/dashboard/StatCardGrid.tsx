import { StatCard } from './StatCard'
import { statCardsData } from '@/lib/mock-data'

export function StatCardGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {statCardsData.map((card) => (
        <StatCard key={card.id} card={card} />
      ))}
    </div>
  )
}
