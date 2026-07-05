import type { SummaryStats } from '../eval/metrics'
import { BASELINE_LOG_LOSS } from '../eval/metrics'

interface StatisticItemProps {
  label: string
  value: string | number
}

function StatisticItem({ label, value }: StatisticItemProps) {
  return (
    <div className="p-4 bg-gray-700 rounded">
      <div className="text-sm text-gray-400">{label}</div>
      <div className="text-2xl font-bold text-gray-100">{value}</div>
    </div>
  )
}

interface StatisticsCardProps {
  summary: SummaryStats
}

export function StatisticsCard({ summary }: StatisticsCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatisticItem label="Total Matches" value={summary.totalMatches} />
        <StatisticItem label="Total BCE Loss" value={summary.totalLogLoss.toFixed(2)} />
        <StatisticItem label="Average BCE Loss" value={summary.avgLogLoss.toFixed(4)} />
        <StatisticItem label="Implied Win Probability" value={`${(summary.impliedWinProbability * 100).toFixed(3)}%`} />
        <StatisticItem label="Accuracy" value={`${(summary.accuracy * 100).toFixed(1)}%`} />
        <StatisticItem label="Brier Score" value={summary.brier.toFixed(4)} />
        <StatisticItem label="Calibration Error" value={`${(summary.ece * 100).toFixed(2)}%`} />
        <StatisticItem label="Skill vs Coin Flip" value={`${(summary.skillScore * 100).toFixed(1)}%`} />
      </div>
      <div className="text-xs text-gray-500 mt-3">
        Baseline (coin-flip) log loss: {BASELINE_LOG_LOSS.toFixed(4)}. Skill = 1 − avg loss / baseline.
      </div>
    </div>
  )
}
