import { useState } from 'react'
import type { Engine } from '../engine/main'
import type { PlayerName } from '../engine/types'
import { PlayerCard } from './PlayerCard'
import { TeamCard } from './TeamCard'
import { PlayerSelector } from './PlayerSelector'

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
        <PlayerSelector
          availablePlayers={availablePlayers}
          selectedPlayers={selectedPlayers}
          onPlayerSelect={handlePlayerSelect}
          onClear={handleClear}
        />

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
