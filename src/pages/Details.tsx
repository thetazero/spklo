import { PlayerOrTeamDetails } from '../components/PlayerOrTeamDetails'
import type { Engine } from '../engine/main'

interface DetailsPageProps {
  engine: Engine
}

export function DetailsPage({ engine }: DetailsPageProps) {
  return (
    <div>
      <PlayerOrTeamDetails engine={engine} />
    </div>
  )
}