import { TeamRankings } from '../components/TeamRankings'
import type { Engine } from '../engine/main'

interface TeamsPageProps {
  engine: Engine
}

export function TeamsPage({ engine }: TeamsPageProps) {
  return (
    <div>
      <TeamRankings engine={engine} />
    </div>
  )
}