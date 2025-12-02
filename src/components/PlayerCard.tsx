import type { PlayerName } from '../engine/types'

interface PlayerCardProps {
  player: PlayerName
  elo: number
  matchCount: number
}

export function PlayerCard({ player, elo, matchCount }: PlayerCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="grid grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">Player</div>
          <div className="text-2xl font-bold text-gray-100">{player}</div>
        </div>

        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">ELO</div>
          <div className="text-3xl font-bold text-blue-400">
            {Math.round(elo)}
          </div>
        </div>

        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">Matches</div>
          <div className="text-xl font-semibold text-gray-100">
            {matchCount}
          </div>
        </div>
      </div>
    </div>
  )
}
