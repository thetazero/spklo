import { PlayerRankings } from '../components/PlayerRankings'
import type { Engine } from '../engine/main'

interface PlayersPageProps {
  engine: Engine
}

export function PlayersPage({ engine }: PlayersPageProps) {
  return (
    <div>
      <PlayerRankings engine={engine} />
    </div>
  )
}