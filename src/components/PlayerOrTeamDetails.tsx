import { useState } from 'react'
import type { Engine } from '../engine/main'
import type { PlayerName } from '../engine/types'
import { PlayerCard } from './PlayerCard'
import { TeamCard } from './TeamCard'

interface PlayerOrTeamDetailsProps {
  engine: Engine
}

export function PlayerOrTeamDetails({ engine }: PlayerOrTeamDetailsProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerName[]>([])

  // Get all available players sorted by name
  const availablePlayers = Object.keys(engine.elos).sort()

  const handlePlayerSelect = (player: PlayerName) => {
    if (selectedPlayers.includes(player)) {
      setSelectedPlayers(selectedPlayers.filter(p => p !== player))
    } else if (selectedPlayers.length < 2) {
      setSelectedPlayers([...selectedPlayers, player])
    }
  }

  const handleClear = () => {
    setSelectedPlayers([])
  }

  const getPlayerElo = (player: PlayerName): number => {
    return engine.getElo(player)
  }

  const getMatchCount = (player: PlayerName): number => {
    return engine.getMatchCount(player)
  }

  const getPairwiseAdjustment = (): number => {
    if (selectedPlayers.length === 2) {
      return engine.getPairwiseAdjustment(selectedPlayers[0], selectedPlayers[1])
    }
    return 0
  }

  const getPairMatchCount = (): number => {
    if (selectedPlayers.length === 2) {
      return engine.getPairMatchCount(selectedPlayers[0], selectedPlayers[1])
    }
    return 0
  }

  const getTotalElo = (): number => {
    if (selectedPlayers.length === 0) return 0
    if (selectedPlayers.length === 1) return getPlayerElo(selectedPlayers[0])
    return selectedPlayers.reduce((sum, p) => sum + getPlayerElo(p), 0) + getPairwiseAdjustment()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">
            Select Players ({selectedPlayers.length}/2)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
            {availablePlayers.map((player) => {
              const isSelected = selectedPlayers.includes(player)
              const isDisabled = !isSelected && selectedPlayers.length >= 2

              return (
                <button
                  key={player}
                  onClick={() => handlePlayerSelect(player)}
                  disabled={isDisabled}
                  className={`
                    px-3 py-2 rounded text-sm font-medium transition-colors
                    ${isSelected
                      ? 'bg-blue-600 text-white'
                      : isDisabled
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                    }
                  `}
                >
                  {player}
                </button>
              )
            })}
          </div>

          {selectedPlayers.length > 0 && (
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* ELO Display */}
        {selectedPlayers.length === 1 && (
          <PlayerCard
            player={selectedPlayers[0]}
            elo={getPlayerElo(selectedPlayers[0])}
            matchCount={getMatchCount(selectedPlayers[0])}
          />
        )}

        {selectedPlayers.length === 2 && (
          <TeamCard
            player1={{
              name: selectedPlayers[0],
              elo: getPlayerElo(selectedPlayers[0]),
              matchCount: getMatchCount(selectedPlayers[0])
            }}
            player2={{
              name: selectedPlayers[1],
              elo: getPlayerElo(selectedPlayers[1]),
              matchCount: getMatchCount(selectedPlayers[1])
            }}
            pairwiseAdjustment={getPairwiseAdjustment()}
            pairMatchCount={getPairMatchCount()}
            totalElo={getTotalElo()}
          />
        )}
      </div>
    </div>
  )
}
