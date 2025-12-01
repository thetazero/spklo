import type { Engine } from '../engine/main'

interface PlayerRankingsProps {
  engine: Engine
}

export function PlayerRankings({ engine }: PlayerRankingsProps) {
  const sortedPlayers = Object.entries(engine.elos)
    .sort(([, a], [, b]) => b - a)

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-4">Player Rankings</h2>
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="p-2 text-left">Rank</th>
            <th className="p-2 text-left">Player</th>
            <th className="p-2 text-left">ELO</th>
            <th className="p-2 text-left">Matches</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map(([player, elo], index) => (
            <tr key={player} className="border-b border-gray-200">
              <td className="p-2">{index + 1}</td>
              <td className="p-2 font-medium">{player}</td>
              <td className="p-2 font-semibold">{Math.round(elo)}</td>
              <td className="p-2 text-gray-600">{engine.getMatchCount(player)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}