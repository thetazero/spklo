import { useState } from 'react'
import type { MatchAnalysis } from '../engine/main'
import type { PlayerName } from '../engine/types'

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

  const getCombinedTeamElo = (team: Set<PlayerName>, analysis: MatchAnalysis): number => {
    return Array.from(team).reduce((sum, player) => sum + getPlayerElo(player, analysis), 0)
  }

  const formatPercent = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`
  }

  return (
    <div className="w-full my-8">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-700 text-white">
              <th className="p-3 text-left font-semibold">Match #</th>
              <th className="p-3 text-left font-semibold">Winning Team</th>
              <th className="p-3 text-left font-semibold">Team ELO</th>
              <th className="p-3 text-left font-semibold">Losing Team</th>
              <th className="p-3 text-left font-semibold">Team ELO</th>
              <th className="p-3 text-left font-semibold">Win Probability</th>
              <th className="p-3 text-left font-semibold">ELO Change</th>
            </tr>
          </thead>
          <tbody>
            {currentMatches.map((analysis, idx) => {
              const matchNumber = matches.length - (startIdx + idx)
              const winningTeamElo = getCombinedTeamElo(analysis.winTeam, analysis)
              const losingTeamElo = getCombinedTeamElo(analysis.loseTeam, analysis)

              return (
                <tr key={startIdx + idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3">{matchNumber}</td>
                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      {Array.from(analysis.winTeam).map((player) => (
                        <div key={player} className="flex justify-between items-center bg-green-100 px-2 py-1 rounded">
                          <span className="font-medium">{player}</span>
                          <span className="text-xs text-gray-600 ml-2">{Math.round(getPlayerElo(player, analysis))}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-lg text-green-600">{Math.round(winningTeamElo)}</td>
                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      {Array.from(analysis.loseTeam).map((player) => (
                        <div key={player} className="flex justify-between items-center bg-red-100 px-2 py-1 rounded">
                          <span className="font-medium">{player}</span>
                          <span className="text-xs text-gray-600 ml-2">{Math.round(getPlayerElo(player, analysis))}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-lg text-red-600">{Math.round(losingTeamElo)}</td>
                  <td className="p-3">{formatPercent(analysis.expectedWinProbability)}</td>
                  <td className="p-3">
                    <span className="font-semibold text-green-600">+{Math.round(analysis.eloChange)}</span>
                    {' / '}
                    <span className="font-semibold text-red-600">-{Math.round(analysis.eloChange)}</span>
                  </td>
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
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage + 1} of {totalPages} ({reversedMatches.length} matches)
        </span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}