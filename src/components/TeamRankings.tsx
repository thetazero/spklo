import type { Engine } from '../engine/main'
import { TeamEloDisplay } from './TeamEloDisplay'
import { Table } from './Table'

interface TeamRankingsProps {
  engine: Engine
}

export function TeamRankings({ engine }: TeamRankingsProps) {
  const columns = [
    { header: 'Team ELO', type: 'number' as const },
    { header: 'Games together', type: 'number' as const },
  ]

  const rows = Array.from(engine.pairMatchCounts.entries())
    .map(([key, matchCount]) => {
      const [player1, player2] = key.split(':')
      const player1Elo = engine.getElo(player1)
      const player2Elo = engine.getElo(player2)
      const combinedElo = player1Elo + player2Elo

      return [
        // Team ELO column
        {
          simple: combinedElo,
          rendered: (
            <TeamEloDisplay
              players={[
                { name: player1, elo: player1Elo },
                { name: player2, elo: player2Elo }
              ]}
              showTotal={true}
            />
          )
        },
        // Games together column
        {
          simple: matchCount,
          rendered: <span className="text-gray-400">{matchCount}</span>
        },
      ]
    })
    .sort((a, b) => (b[0].simple as number) - (a[0].simple as number))

  if (rows.length === 0) {
    return null
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <Table columns={columns} rows={rows} />
    </div>
  )
}
