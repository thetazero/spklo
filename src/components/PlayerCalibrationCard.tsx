import type { MatchAnalysis } from '../engine/main'
import {
  computePlayerStats,
  computeRelativeDifference,
  formatRelativeDiff,
} from '../eval/metrics'
import { Table } from './Table'

interface PlayerCalibrationCardProps {
  matches: MatchAnalysis[]
}

export function PlayerCalibrationCard({ matches }: PlayerCalibrationCardProps) {
  const playerStats = computePlayerStats(matches)

  const columns = [
    { header: 'Player', type: 'string' as const },
    { header: 'Expected Wins', type: 'number' as const },
    { header: 'Actual Wins', type: 'number' as const },
    { header: 'Difference', type: 'number' as const },
    { header: 'Matches', type: 'number' as const }
  ]

  const rows = playerStats.map((stats) => {
    const relativeDifference = computeRelativeDifference(stats.expectedWins, stats.actualWins)

    // Color based on which CI the expected wins fall into
    const diffColor = 'text-gray-400'

    return [
      {
        simple: stats.player,
        rendered: <span className="font-semibold">{stats.player}</span>
      },
      {
        simple: stats.expectedWins,
        rendered: (
          <span className={diffColor}>
            {stats.expectedWins.toFixed(1)}
          </span>
        )
      },
      {
        simple: stats.actualWins,
        rendered: `${stats.actualWins}`
      },
      {
        simple: relativeDifference,
        rendered: (
          <span className={`font-semibold ${diffColor}`}>
            {formatRelativeDiff(relativeDifference)}
          </span>
        )
      },
      {
        simple: stats.totalMatches,
        rendered: <span className="text-gray-400">{stats.totalMatches}</span>
      }
    ]
  })

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Player Calibration</h2>
      <Table columns={columns} rows={rows} />
    </div>
  )
}
