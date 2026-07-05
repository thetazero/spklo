import type { PlayerName } from '../engine/types'

interface PlayerInfo {
  name: PlayerName
  elo: number
  matchCount: number
}

interface TeamCardProps {
  player1: PlayerInfo
  player2: PlayerInfo
  pairMatchCount: number
  totalElo: number
}

export function TeamCard({
  player1,
  player2,
  pairMatchCount,
  totalElo
}: TeamCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">Team ELO</div>
          <div className="text-3xl font-bold text-blue-400">
            {Math.round(totalElo)}
          </div>
        </div>

        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">{player1.name}</div>
          <div className="text-xl font-semibold text-gray-100">
            {Math.round(player1.elo)}
          </div>
          <div className="text-xs text-gray-400">
            {player1.matchCount} matches
          </div>
        </div>

        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">{player2.name}</div>
          <div className="text-xl font-semibold text-gray-100">
            {Math.round(player2.elo)}
          </div>
          <div className="text-xs text-gray-400">
            {player2.matchCount} matches
          </div>
        </div>

        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">Games together</div>
          <div className="text-xl font-semibold text-gray-100">
            {pairMatchCount}
          </div>
        </div>
      </div>
    </div>
  )
}
