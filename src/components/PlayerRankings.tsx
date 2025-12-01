import type { Engine } from '../engine/main'
import { Table } from './Table'

interface PlayerRankingsProps {
  engine: Engine
}

export function PlayerRankings({ engine }: PlayerRankingsProps) {
  const columns = [
    { header: 'Player', type: 'string' as const },
    { header: 'ELO', type: 'number' as const },
    { header: 'Matches', type: 'number' as const },
  ]

  const rows = Object.entries(engine.elos)
    .sort(([, a], [, b]) => b - a)
    .map(([player, elo]) => {
      const matchCount = engine.getMatchCount(player)
      return [
        // Player column
        { simple: player, rendered: <span className="font-medium text-gray-100">{player}</span> },
        // ELO column
        { simple: elo, rendered: <span className="font-semibold text-gray-100">{Math.round(elo)}</span> },
        // Matches column
        { simple: matchCount, rendered: <span className="text-gray-400">{matchCount}</span> },
      ]
    })

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-100">Player Rankings</h2>
      <Table columns={columns} rows={rows} />
    </div>
  )
}
