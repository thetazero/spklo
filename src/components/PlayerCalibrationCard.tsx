import type { MatchAnalysis } from '../engine/main'
import type { PlayerName } from '../engine/types'
import { Table } from './Table'

interface PlayerStats {
  player: PlayerName
  expectedWins: number
  actualWins: number
  totalMatches: number
}

interface PlayerCalibrationCardProps {
  matches: MatchAnalysis[]
}

function calculatePlayerStats(matches: MatchAnalysis[]): PlayerStats[] {
  const playerData = new Map<PlayerName, { expectedWins: number; actualWins: number; totalMatches: number }>()

  for (const match of matches) {
    const winnerPlayers = Array.from(match.winTeam)
    const loserPlayers = Array.from(match.loseTeam)

    // Update winning team
    for (const player of winnerPlayers) {
      if (!playerData.has(player)) {
        playerData.set(player, { expectedWins: 0, actualWins: 0, totalMatches: 0 })
      }
      const data = playerData.get(player)!
      data.expectedWins += match.expectedWinProbability
      data.actualWins += 1
      data.totalMatches += 1
    }

    // Update losing team
    for (const player of loserPlayers) {
      if (!playerData.has(player)) {
        playerData.set(player, { expectedWins: 0, actualWins: 0, totalMatches: 0 })
      }
      const data = playerData.get(player)!
      data.expectedWins += (1 - match.expectedWinProbability)
      data.actualWins += 0
      data.totalMatches += 1
    }
  }

  // Convert to array and sort by player name
  return Array.from(playerData.entries())
    .map(([player, data]) => ({
      player,
      expectedWins: data.expectedWins,
      actualWins: data.actualWins,
      totalMatches: data.totalMatches
    }))
    .sort((a, b) => a.player.localeCompare(b.player))
    .filter(stats => stats.totalMatches > 5);
}

export function PlayerCalibrationCard({ matches }: PlayerCalibrationCardProps) {
  const playerStats = calculatePlayerStats(matches)

  const columns = [
    { header: 'Player', type: 'string' as const },
    { header: 'Expected Wins', type: 'number' as const },
    { header: 'Actual Wins', type: 'number' as const },
    { header: 'Difference', type: 'number' as const },
    { header: 'Matches', type: 'number' as const }
  ]

  const rows = playerStats.map((stats) => {
    const relativeDifference = stats.expectedWins > 0
      ? (stats.expectedWins / stats.actualWins - 1) * 100
      : 0
    const diffColor = 'text-gray-400'

    return [
      {
        simple: stats.player,
        rendered: <span className="font-semibold">{stats.player}</span>
      },
      {
        simple: stats.expectedWins,
        rendered: `${stats.expectedWins.toFixed(1)}`
      },
      {
        simple: stats.actualWins,
        rendered: `${stats.actualWins}`
      },
      {
        simple: relativeDifference,
        rendered: (
          <span className={`font-semibold ${diffColor}`}>
            {relativeDifference > 0 ? '+' : ''}{relativeDifference.toFixed(1)}%
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
