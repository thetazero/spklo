import { StatisticsCard } from '../components/StatisticsCard'

interface StatsPageProps {
  totalMatches: number
  bceLoss: number
}

export function StatsPage({ totalMatches, bceLoss }: StatsPageProps) {
  return (
    <div>
      <StatisticsCard totalMatches={totalMatches} bceLoss={bceLoss} />
    </div>
  )
}