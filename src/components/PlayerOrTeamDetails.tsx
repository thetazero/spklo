import { useState, useMemo } from 'react'
import type { Engine, MatchAnalysis } from '../engine/main'
import type { PlayerName } from '../engine/types'
import { PlayerCard } from './PlayerCard'
import { TeamCard } from './TeamCard'
import { PlayerSelector } from './PlayerSelector'
import { MatchTable } from './MatchTable'

interface PlayerOrTeamDetailsProps {
  engine: Engine
  matches: MatchAnalysis[]
}

export function PlayerOrTeamDetails({ engine, matches }: PlayerOrTeamDetailsProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerName[]>([])

  // Get all available players sorted by name
  const availablePlayers = Object.keys(engine.elos).sort()

  // Filter matches based on selected players
  const filteredMatches = useMemo(() => {
    if (selectedPlayers.length === 0) return []

    if (selectedPlayers.length === 1) {
      // Single player: show all matches where this player participated
      const player = selectedPlayers[0]
      return matches.filter(match =>
        match.winTeam.has(player) || match.loseTeam.has(player)
      )
    }

    // Two players: show matches where they played together as a team
    const [player1, player2] = selectedPlayers
    return matches.filter(match =>
      (match.winTeam.has(player1) && match.winTeam.has(player2)) ||
      (match.loseTeam.has(player1) && match.loseTeam.has(player2))
    )
  }, [selectedPlayers, matches])

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

      {/* Match History */}
      {selectedPlayers.length > 0 && filteredMatches.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-100 mb-4">
            Match History ({filteredMatches.length} matches)
          </h2>
          <MatchTable matches={filteredMatches} selectedPlayers={selectedPlayers} />
        </div>
      )}
    </div>
  )
}
