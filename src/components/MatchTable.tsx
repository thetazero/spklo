import { useState } from 'react'
import type { MatchAnalysis } from '../engine/main'
import type { PlayerName } from '../engine/types'
import { TeamEloDisplay } from './TeamEloDisplay'

interface MatchTableProps {
  matches: MatchAnalysis[]
  selectedPlayers?: PlayerName[]
}

const MATCHES_PER_PAGE = 20

export function MatchTable({ matches, selectedPlayers = [] }: MatchTableProps) {
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

  // Check if selected players are in a team
  const isSelectedTeam = (team: Set<PlayerName>): boolean => {
    if (selectedPlayers.length === 0) return false
    if (selectedPlayers.length === 1) {
      return team.has(selectedPlayers[0])
    }
    // Two players selected - check if both are in the team
    return selectedPlayers.every(p => team.has(p))
  }

  // Determine column headers
  const hasSelectedPlayers = selectedPlayers.length > 0
  const teamAHeader = hasSelectedPlayers ? 'Team A' : 'Winning Team'
  const teamBHeader = hasSelectedPlayers ? 'Team B' : 'Losing Team'

  return (
    <div className="w-full my-8">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-700 text-gray-100">
              <th className="p-3 text-left font-semibold">{teamAHeader}</th>
              <th className="p-3 text-left font-semibold">{teamBHeader}</th>
              <th className="p-3 text-left font-semibold">Win Probability</th>
            </tr>
          </thead>
          <tbody>
            {currentMatches.map((analysis, idx) => {
              // Determine if we need to swap teams (selected players should be on left)
              const selectedOnWinSide = isSelectedTeam(analysis.winTeam)
              const selectedOnLoseSide = isSelectedTeam(analysis.loseTeam)
              const shouldSwap = hasSelectedPlayers && selectedOnLoseSide && !selectedOnWinSide

              // Team A (left column) and Team B (right column)
              const teamA = shouldSwap ? analysis.loseTeam : analysis.winTeam
              const teamB = shouldSwap ? analysis.winTeam : analysis.loseTeam

              const [teamA1, teamA2] = Array.from(teamA)
              const [teamB1, teamB2] = Array.from(teamB)

              const teamAKey = getPairwiseKey(teamA1, teamA2)
              const teamBKey = getPairwiseKey(teamB1, teamB2)
              const teamAPairwiseBefore = analysis.beforePairwise.get(teamAKey) || 0
              const teamBPairwiseBefore = analysis.beforePairwise.get(teamBKey) || 0

              // Determine elo delta based on which team won
              const teamAWon = teamA === analysis.winTeam
              const teamAPairwiseDelta = teamAWon ? analysis.pairwiseDelta : -analysis.pairwiseDelta
              const teamBPairwiseDelta = teamAWon ? -analysis.pairwiseDelta : analysis.pairwiseDelta

              // Win probability is always from winner's perspective, adjust if swapped
              const winProbability = shouldSwap ? 1 - analysis.expectedWinProbability : analysis.expectedWinProbability


              const a1EloDelta = analysis.eloChanges.get(teamA1);
              const a2EloDelta = analysis.eloChanges.get(teamA2);
              const b1EloDelta = analysis.eloChanges.get(teamB1);
              const b2EloDelta = analysis.eloChanges.get(teamB2);

              if (a1EloDelta === undefined || a2EloDelta === undefined || b1EloDelta === undefined || b2EloDelta === undefined) {
                console.log(analysis)
                throw new Error('Elo delta missing for a player');
              }

              return (
                <tr key={startIdx + idx} className="border-b border-gray-700 hover:bg-gray-800">
                  <td className="p-3">
                    <TeamEloDisplay
                      players={[
                        { name: teamA1, elo: getPlayerElo(teamA1, analysis), eloDelta: a1EloDelta },
                        { name: teamA2, elo: getPlayerElo(teamA2, analysis), eloDelta: a2EloDelta }
                      ]}
                      pairwiseAdjustment={teamAPairwiseBefore}
                      pairwiseDelta={teamAPairwiseDelta}
                      showTotal={true}
                    />
                  </td>
                  <td className="p-3">
                    <TeamEloDisplay
                      players={[
                        { name: teamB1, elo: getPlayerElo(teamB1, analysis), eloDelta: b1EloDelta },
                        { name: teamB2, elo: getPlayerElo(teamB2, analysis), eloDelta: b2EloDelta }
                      ]}
                      pairwiseAdjustment={teamBPairwiseBefore}
                      pairwiseDelta={teamBPairwiseDelta}
                      showTotal={true}
                    />
                  </td>
                  <td className="p-3 text-gray-100">{formatPercent(winProbability)}</td>
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
