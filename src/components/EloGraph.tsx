import { useState, useMemo } from 'react'
import type { PlayerName } from '../engine/types'
import type { MatchAnalysis } from '../engine/main'

interface EloGraphProps {
  allMatches: MatchAnalysis[]
  selectedPlayers: PlayerName[]
}

interface TooltipData {
  x: number
  y: number
  matchNumber: number
  elo: number
}

export function EloGraph({ allMatches, selectedPlayers }: EloGraphProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [showAdjusted, setShowAdjusted] = useState(true)

  // Calculate both adjusted and unadjusted elo histories
  const { adjustedHistory, unadjustedHistory } = useMemo(() => {
    if (selectedPlayers.length === 0 || allMatches.length === 0) {
      return { adjustedHistory: [], unadjustedHistory: [] }
    }

    if (selectedPlayers.length === 1) {
      // Single player ELO history
      const player = selectedPlayers[0]
      const adjusted: number[] = []
      const unadjusted: number[] = []
      let cumulativeAdjustment = 0

      // Filter matches for this player
      const playerMatches = allMatches.filter(match =>
        match.winTeam.has(player) || match.loseTeam.has(player)
      )

      // Track adjustments across ALL matches, not just player's matches
      let matchIndex = 0
      for (const match of allMatches) {
        // Track cumulative adjustments for this player across all matches
        if (match.adjustmentEvent?.players.has(player)) {
          cumulativeAdjustment += match.adjustmentEvent.adjustment
        }

        // Only add data points for matches where the player participated
        if (match === playerMatches[matchIndex]) {
          const baseElo = match.beforeElos[player] || 500
          adjusted.push(baseElo)
          unadjusted.push(baseElo - cumulativeAdjustment)
          matchIndex++
        }
      }

      // Add final data point showing elo after the last match
      if (playerMatches.length > 0) {
        const lastMatch = playerMatches[playerMatches.length - 1]
        const lastBeforeElo = lastMatch.beforeElos[player] || 500
        const lastEloChange = lastMatch.eloChanges.get(player) || 0
        const finalElo = lastBeforeElo + lastEloChange
        adjusted.push(finalElo)
        unadjusted.push(finalElo - cumulativeAdjustment)
      }

      return { adjustedHistory: adjusted, unadjustedHistory: unadjusted }
    }

    // Team ELO history (sum of individual ELOs + pairwise adjustment)
    const [player1, player2] = selectedPlayers
    const getPairwiseKey = (p1: PlayerName, p2: PlayerName): string => {
      return p1 < p2 ? `${p1}:${p2}` : `${p2}:${p1}`
    }
    const pairKey = getPairwiseKey(player1, player2)

    const adjusted: number[] = []
    const unadjusted: number[] = []
    let cumulativeAdjustment1 = 0
    let cumulativeAdjustment2 = 0

    // Filter matches for this team
    const teamMatches = allMatches.filter(match =>
      (match.winTeam.has(player1) && match.winTeam.has(player2)) ||
      (match.loseTeam.has(player1) && match.loseTeam.has(player2))
    )

    // Track adjustments across ALL matches, not just team's matches
    let matchIndex = 0
    for (const match of allMatches) {
      // Track cumulative adjustments for each player across all matches
      if (match.adjustmentEvent?.players.has(player1)) {
        cumulativeAdjustment1 += match.adjustmentEvent.adjustment
      }
      if (match.adjustmentEvent?.players.has(player2)) {
        cumulativeAdjustment2 += match.adjustmentEvent.adjustment
      }

      // Only add data points for matches where both players participated together
      if (match === teamMatches[matchIndex]) {
        const elo1 = match.beforeElos[player1] || 500
        const elo2 = match.beforeElos[player2] || 500
        const pairwise = match.beforePairwise.get(pairKey) || 0

        adjusted.push(elo1 + elo2 + pairwise)

        const unadjustedElo1 = elo1 - cumulativeAdjustment1
        const unadjustedElo2 = elo2 - cumulativeAdjustment2
        unadjusted.push(unadjustedElo1 + unadjustedElo2 + pairwise)

        matchIndex++
      }
    }

    // Add final data point showing elo after the last match
    if (teamMatches.length > 0) {
      const lastMatch = teamMatches[teamMatches.length - 1]
      const lastElo1 = lastMatch.beforeElos[player1] || 500
      const lastElo2 = lastMatch.beforeElos[player2] || 500
      const lastPairwise = lastMatch.beforePairwise.get(pairKey) || 0
      const eloChange1 = lastMatch.eloChanges.get(player1) || 0
      const eloChange2 = lastMatch.eloChanges.get(player2) || 0
      const pairwiseDelta = lastMatch.winTeam.has(player1) && lastMatch.winTeam.has(player2)
        ? lastMatch.winnerPairwiseDelta
        : lastMatch.loserPairwiseDelta

      const finalElo1 = lastElo1 + eloChange1
      const finalElo2 = lastElo2 + eloChange2
      const finalPairwise = lastPairwise + pairwiseDelta

      adjusted.push(finalElo1 + finalElo2 + finalPairwise)
      unadjusted.push((finalElo1 - cumulativeAdjustment1) + (finalElo2 - cumulativeAdjustment2) + finalPairwise)
    }

    return { adjustedHistory: adjusted, unadjustedHistory: unadjusted }
  }, [selectedPlayers, allMatches])

  const eloHistory = showAdjusted ? adjustedHistory : unadjustedHistory

  if (eloHistory.length === 0) return null

  const minElo = Math.min(...eloHistory)
  const maxElo = Math.max(...eloHistory)
  const range = maxElo - minElo
  const padding = range * 0.1 || 50 // 10% padding or at least 50 points

  const chartMin = minElo - padding
  const chartMax = maxElo + padding
  const chartRange = chartMax - chartMin

  // SVG dimensions
  const width = 800
  const height = 300
  const marginLeft = 60
  const marginRight = 20
  const marginTop = 20
  const marginBottom = 40
  const chartWidth = width - marginLeft - marginRight
  const chartHeight = height - marginTop - marginBottom

  // Calculate points for the line
  const points = eloHistory.map((elo, index) => {
    const x = marginLeft + (index / (eloHistory.length - 1)) * chartWidth
    const y = marginTop + chartHeight - ((elo - chartMin) / chartRange) * chartHeight
    return { x, y, elo, matchIndex: index }
  })

  // Create path for the line
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  // Y-axis ticks (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const value = chartMin + (chartRange * i) / 4
    const y = marginTop + chartHeight - ((value - chartMin) / chartRange) * chartHeight
    return { value, y }
  })

  // X-axis ticks (show every ~10th match or fewer if not many matches)
  const xTickInterval = Math.max(1, Math.floor(eloHistory.length / 10))
  const xTicks = points.filter((_, i) => i % xTickInterval === 0 || i === eloHistory.length - 1)

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-100">ELO Over Time For {selectedPlayers.join(', ')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdjusted(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showAdjusted
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Adjusted
          </button>
          <button
            onClick={() => setShowAdjusted(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !showAdjusted
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Unadjusted
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="text-gray-100">
          {/* Y-axis */}
          <line
            x1={marginLeft}
            y1={marginTop}
            x2={marginLeft}
            y2={height - marginBottom}
            stroke="currentColor"
            strokeWidth="2"
          />

          {/* X-axis */}
          <line
            x1={marginLeft}
            y1={height - marginBottom}
            x2={width - marginRight}
            y2={height - marginBottom}
            stroke="currentColor"
            strokeWidth="2"
          />

          {/* Y-axis ticks and labels */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={marginLeft - 5}
                y1={tick.y}
                x2={marginLeft}
                y2={tick.y}
                stroke="currentColor"
                strokeWidth="1"
              />
              <line
                x1={marginLeft}
                y1={tick.y}
                x2={width - marginRight}
                y2={tick.y}
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.2"
              />
              <text
                x={marginLeft - 10}
                y={tick.y}
                textAnchor="end"
                alignmentBaseline="middle"
                fill="currentColor"
                fontSize="12"
              >
                {Math.round(tick.value)}
              </text>
            </g>
          ))}

          {/* X-axis ticks and labels */}
          {xTicks.map((point, i) => (
            <g key={i}>
              <line
                x1={point.x}
                y1={height - marginBottom}
                x2={point.x}
                y2={height - marginBottom + 5}
                stroke="currentColor"
                strokeWidth="1"
              />
              <text
                x={point.x}
                y={height - marginBottom + 20}
                textAnchor="middle"
                fill="currentColor"
                fontSize="12"
              >
                {point.matchIndex + 1}
              </text>
            </g>
          ))}

          {/* ELO line */}
          <path
            d={pathData}
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#60a5fa"
              stroke="#1e3a8a"
              strokeWidth="1"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({
                x: point.x,
                y: point.y,
                matchNumber: point.matchIndex + 1,
                elo: point.elo
              })}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}

          {/* Tooltip */}
          {tooltip && (() => {
            // Position tooltip to the left if too close to right edge
            const tooltipWidth = 140
            const tooltipHeight = 50
            const showOnLeft = tooltip.x + tooltipWidth + 10 > width - marginRight
            const tooltipX = showOnLeft ? tooltip.x - tooltipWidth - 10 : tooltip.x + 10

            // Position tooltip above if too close to bottom
            const showAbove = tooltip.y + tooltipHeight > height - marginBottom
            const tooltipY = showAbove ? tooltip.y - tooltipHeight - 10 : tooltip.y - 40

            return (
              <g>
                {/* Tooltip background */}
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  fill="#1f2937"
                  stroke="#60a5fa"
                  strokeWidth="1"
                  rx="4"
                />
                {/* Tooltip text */}
                <text
                  x={tooltipX + 5}
                  y={tooltipY + 15}
                  fill="#e5e7eb"
                  fontSize="12"
                  fontWeight="bold"
                >
                  Match #{tooltip.matchNumber}
                </text>
                <text
                  x={tooltipX + 5}
                  y={tooltipY + 30}
                  fill="#e5e7eb"
                  fontSize="12"
                >
                  ELO: {Math.round(tooltip.elo)}
                </text>
              </g>
            )
          })()}

          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fill="currentColor"
            fontSize="14"
            fontWeight="bold"
          >
            Match Number
          </text>
          <text
            x={-height / 2}
            y={15}
            textAnchor="middle"
            fill="currentColor"
            fontSize="14"
            fontWeight="bold"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            ELO Rating
          </text>
        </svg>
      </div>
    </div>
  )
}
