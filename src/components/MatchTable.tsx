import { useState } from 'react'
import type { MatchAnalysis } from '../engine/main'
import type { PlayerName } from '../engine/types'
import { TeamEloDisplay } from './TeamEloDisplay'

interface MatchTableProps {
  matches: MatchAnalysis[]
}

const MATCHES_PER_PAGE = 20

export function MatchTable({ matches }: MatchTableProps) {
  const [currentPage, setCurrentPage] = useState(0)

  // Reverse order to show newest first
  const reversedMatches = [...matches].reverse()
  const totalPages = Math.ceil(reversedMatches.length / MATCHES_PER_PAGE)
  const startIdx = currentPage * MATCHES_PER_PAGE
  const endIdx = startIdx + MATCHES_PER_PAGE
  const currentMatches = reversedMatches.slice(startIdx, endIdx)

  const getPlayerElo = (player: PlayerName, analysis: MatchAnalysis): number => {
    return analysis.beforeElos[player] || 1000
  }

  const formatPercent = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getPairwiseKey = (player1: PlayerName, player2: PlayerName): string => {
    return player1 < player2 ? `${player1}:${player2}` : `${player2}:${player1}`
  }

  return (
    <div className="w-full my-8">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-700 text-gray-100">
              <th className="p-3 text-left font-semibold">Match #</th>
              <th className="p-3 text-left font-semibold">Winning Team</th>
              <th className="p-3 text-left font-semibold">Losing Team</th>
              <th className="p-3 text-left font-semibold">Win Probability</th>
            </tr>
          </thead>
          <tbody>
            {currentMatches.map((analysis, idx) => {
              const matchNumber = matches.length - (startIdx + idx)

              // Get winners and their pairwise info
              const [winner1, winner2] = Array.from(analysis.winTeam)
              const winnerKey = getPairwiseKey(winner1, winner2)
              const winnerPairwiseBefore = analysis.beforePairwise.get(winnerKey) || 0

              // Get losers and their pairwise info
              const [loser1, loser2] = Array.from(analysis.loseTeam)
              const loserKey = getPairwiseKey(loser1, loser2)
              const loserPairwiseBefore = analysis.beforePairwise.get(loserKey) || 0

              return (
                <tr key={startIdx + idx} className="border-b border-gray-700 hover:bg-gray-800">
                  <td className="p-3 text-gray-100">{matchNumber}</td>
                  <td className="p-3">
                    <TeamEloDisplay
                      players={[
                        { name: winner1, elo: getPlayerElo(winner1, analysis), eloDelta: analysis.eloChange },
                        { name: winner2, elo: getPlayerElo(winner2, analysis), eloDelta: analysis.eloChange }
                      ]}
                      pairwiseAdjustment={winnerPairwiseBefore}
                      pairwiseDelta={analysis.pairwiseDelta}
                      showTotal={true}
                    />
                  </td>
                  <td className="p-3">
                    <TeamEloDisplay
                      players={[
                        { name: loser1, elo: getPlayerElo(loser1, analysis), eloDelta: -analysis.eloChange },
                        { name: loser2, elo: getPlayerElo(loser2, analysis), eloDelta: -analysis.eloChange }
                      ]}
                      pairwiseAdjustment={loserPairwiseBefore}
                      pairwiseDelta={-analysis.pairwiseDelta}
                      showTotal={true}
                    />
                  </td>
                  <td className="p-3 text-gray-100">{formatPercent(analysis.expectedWinProbability)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center items-center gap-4 mt-6 p-4">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-gray-400">
          Page {currentPage + 1} of {totalPages} ({reversedMatches.length} matches)
        </span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}
