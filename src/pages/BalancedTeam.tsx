import { useState, useMemo } from 'react'
import type { Engine } from '../engine/main'
import type { PlayerName } from '../engine/types'
import { PlayerSelector } from '../components/PlayerSelector'
import { TeamCard } from '../components/TeamCard'

interface BalancedTeamPageProps {
  engine: Engine
}

interface MatchupResult {
  team1: [PlayerName, PlayerName]
  team2: [PlayerName, PlayerName]
  team1Elo: number
  team2Elo: number
  eloDifference: number
  team1WinProbability: number
}

function calculateWinProbability(teamElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - teamElo) / 400))
}

function findAllMatchups(players: PlayerName[], engine: Engine): MatchupResult[] {
  const matchups: MatchupResult[] = []

  // Generate all possible pairs
  const pairs: [PlayerName, PlayerName][] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      pairs.push([players[i], players[j]])
    }
  }

  // Generate all matchups (each pair of non-overlapping pairs)
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const team1 = pairs[i]
      const team2 = pairs[j]
      // Skip if teams share a player
      if (team1.some(p => team2.includes(p))) continue

      const team1Elo = engine.getCombinedEloWithPairwise(new Set(team1))
      const team2Elo = engine.getCombinedEloWithPairwise(new Set(team2))
      matchups.push({
        team1,
        team2,
        team1Elo,
        team2Elo,
        eloDifference: Math.abs(team1Elo - team2Elo),
        team1WinProbability: calculateWinProbability(team1Elo, team2Elo)
      })
    }
  }

  return matchups.sort((a, b) => a.eloDifference - b.eloDifference)
}

function buildTeamCardProps(team: [PlayerName, PlayerName], engine: Engine) {
  const [p1, p2] = team
  return {
    player1: { name: p1, elo: engine.getElo(p1), matchCount: engine.getMatchCount(p1) },
    player2: { name: p2, elo: engine.getElo(p2), matchCount: engine.getMatchCount(p2) },
    pairwiseAdjustment: engine.getPairwiseAdjustment(p1, p2),
    pairMatchCount: engine.getPairMatchCount(p1, p2),
    totalElo: engine.getCombinedEloWithPairwise(new Set(team))
  }
}

export function BalancedTeamPage({ engine }: BalancedTeamPageProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerName[]>([])

  const availablePlayers = Object.keys(engine.playerState.elos).sort()

  const matchups = useMemo(() => {
    if (selectedPlayers.length < 4) return []
    return findAllMatchups(selectedPlayers, engine)
  }, [selectedPlayers, engine])

  const handlePlayerSelect = (player: PlayerName, shiftKey: boolean) => {
    if (shiftKey) {
      setSelectedPlayers([player])
    } else {
      if (selectedPlayers.includes(player)) {
        setSelectedPlayers(selectedPlayers.filter(p => p !== player))
      } else {
        setSelectedPlayers([...selectedPlayers, player])
      }
    }
  }

  const handleClear = () => {
    setSelectedPlayers([])
  }

  const mostBalanced = matchups[0]
  const topMatchups = matchups.slice(0, 10)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <PlayerSelector
          availablePlayers={availablePlayers}
          selectedPlayers={selectedPlayers}
          onPlayerSelect={handlePlayerSelect}
          onClear={handleClear}
          maxPlayers={20}
        />

        {selectedPlayers.length > 0 && selectedPlayers.length < 4 && (
          <div className="text-yellow-400 text-center py-4">
            Select at least 4 players to find balanced matchups ({4 - selectedPlayers.length} more needed)
          </div>
        )}
      </div>

      {mostBalanced && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">Most Balanced Matchup</h2>
          <div className="bg-gray-800 rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Team 1</h3>
                <TeamCard {...buildTeamCardProps(mostBalanced.team1, engine)} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Team 2</h3>
                <TeamCard {...buildTeamCardProps(mostBalanced.team2, engine)} />
              </div>
            </div>
            <div className="text-center mt-4 space-x-6">
              <span>
                <span className="text-gray-400">ELO Difference: </span>
                <span className="text-green-400 font-bold">{mostBalanced.eloDifference.toFixed(1)}</span>
              </span>
              <span>
                <span className="text-gray-400">Win Probability: </span>
                <span className="text-blue-400 font-bold">
                  {(Math.max(mostBalanced.team1WinProbability, 1 - mostBalanced.team1WinProbability) * 100).toFixed(1)}%
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {topMatchups.length > 1 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-100 mb-4">
            Top 10 Most Balanced Matchups
          </h2>
          <div className="space-y-4">
            {topMatchups.map((matchup, index) => (
              <div key={index} className="bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">#{index + 1}</span>
                  <div className="text-gray-400 text-sm space-x-4">
                    <span>
                      ELO Diff: <span className={index === 0 ? 'text-green-400' : 'text-gray-300'}>
                        {matchup.eloDifference.toFixed(1)}
                      </span>
                    </span>
                    <span>
                      Win: <span className="text-blue-300">
                        {(Math.max(matchup.team1WinProbability, 1 - matchup.team1WinProbability) * 100).toFixed(0)}%
                      </span>
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-gray-300">
                      {matchup.team1[0]} + {matchup.team1[1]}
                    </div>
                    <div className="text-blue-400 font-semibold">
                      {Math.round(matchup.team1Elo)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-300">
                      {matchup.team2[0]} + {matchup.team2[1]}
                    </div>
                    <div className="text-blue-400 font-semibold">
                      {Math.round(matchup.team2Elo)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
