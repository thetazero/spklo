import { StatisticsCard } from '../components/StatisticsCard'
import { CalibrationCard } from '../components/CalibrationCard'
import type { MatchAnalysis } from '../engine/main'

interface StatsPageProps {
  totalMatches: number
  bceLoss: number
  matches: MatchAnalysis[]
}

export function StatsPage({ totalMatches, bceLoss, matches }: StatsPageProps) {
  return (
    <div className="space-y-6">
      <StatisticsCard totalMatches={totalMatches} bceLoss={bceLoss} />
      <CalibrationCard matches={matches} numBuckets={5} />
    </div>
  )
}
