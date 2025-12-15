import type { MatchAnalysis } from '../engine/main'
import type { PlayerName } from '../engine/types'
import { Table } from './Table'

interface ConfidenceInterval {
  lower: number
  upper: number
}

interface PlayerStats {
  player: PlayerName
  expectedWins: number
  actualWins: number
  totalMatches: number
}

interface PlayerCalibrationCardProps {
  matches: MatchAnalysis[]
}

// Calculate confidence interval using Wilson score interval for binomial proportion
function calculateCI(successes: number, trials: number, p: number): ConfidenceInterval {
  if (trials === 0) {
    return { lower: 0, upper: 0 }
  }

  const proportion = successes / trials

  // Calculate z-score from p-value (two-tailed)
  // For p=0.90 (90% CI), we want 95th percentile (one-tail) = 1.645
  // For p=0.99 (99% CI), we want 99.5th percentile (one-tail) = 2.576
  const z = p === 0.90 ? 1.645 : p === 0.99 ? 2.576 : 1.96

  const denominator = 1 + (z * z) / trials
  const center = (proportion + (z * z) / (2 * trials)) / denominator
  const margin = (z / denominator) * Math.sqrt(
    (proportion * (1 - proportion)) / trials + (z * z) / (4 * trials * trials)
  )

  const lower = Math.max(0, center - margin) * trials
  const upper = Math.min(1, center + margin) * trials

  return { lower, upper }
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

function computeRelativeDifference(expected: number, actual: number): number {
  return expected > 0 ? (actual - expected) / expected * 100 : 0
}

function formatRelativeDiff(diff: number): string {
  return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`
}

function confidenceIntervalText(ci: ConfidenceInterval, expected: number): string {
  const lowerDiff = computeRelativeDifference(expected, ci.lower)
  const upperDiff = computeRelativeDifference(expected, ci.upper)
  return `[${formatRelativeDiff(lowerDiff)}, ${formatRelativeDiff(upperDiff)}]`
}

export function PlayerCalibrationCard({ matches }: PlayerCalibrationCardProps) {
  const playerStats = calculatePlayerStats(matches)

  const columns = [
    { header: 'Player', type: 'string' as const },
    { header: 'Expected Wins', type: 'number' as const },
    { header: 'Actual Wins', type: 'number' as const },
    { header: 'Difference', type: 'number' as const },
    { header: '90% CI', type: 'string' as const },
    { header: '99% CI', type: 'string' as const },
    { header: 'Matches', type: 'number' as const }
  ]

  const rows = playerStats.map((stats) => {
    const ci90 = calculateCI(stats.actualWins, stats.totalMatches, 0.90)
    const ci99 = calculateCI(stats.actualWins, stats.totalMatches, 0.99)

    const relativeDifference = computeRelativeDifference(stats.expectedWins, stats.actualWins)

    // Color based on which CI the expected wins fall into
    let diffColor = 'text-gray-400'

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
        simple: `[${ci90.lower.toFixed(1)}, ${ci90.upper.toFixed(1)}]`,
        rendered: (
          <span className="text-gray-400">
            {confidenceIntervalText(ci90, stats.expectedWins)}
          </span>
        )
      },
      {
        simple: `[${ci99.lower.toFixed(1)}, ${ci99.upper.toFixed(1)}]`,
        rendered: (
          <span className="text-gray-400">
            {confidenceIntervalText(ci99, stats.expectedWins)}
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
