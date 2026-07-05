import { StatisticsCard } from '../components/StatisticsCard'
import { CalibrationCard } from '../components/CalibrationCard'
import { PlayerCalibrationCard } from '../components/PlayerCalibrationCard'
import type { MatchAnalysis } from '../engine/main'
import { computeSummaryStats } from '../eval/metrics'

interface StatsPageProps {
  matches: MatchAnalysis[]
}

export function StatsPage({ matches }: StatsPageProps) {
  const summary = computeSummaryStats(matches)
  return (
    <div className="space-y-6">
      <StatisticsCard summary={summary} />
      <CalibrationCard matches={matches} numBuckets={5} />
      <PlayerCalibrationCard matches={matches} />
    </div>
  )
}
