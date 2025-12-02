import { PlayerOrTeamDetails } from '../components/PlayerOrTeamDetails'
import type { Engine, MatchAnalysis } from '../engine/main'

interface DetailsPageProps {
  engine: Engine
  matches: MatchAnalysis[]
}

export function DetailsPage({ engine, matches }: DetailsPageProps) {
  return (
    <div>
      <PlayerOrTeamDetails engine={engine} matches={matches} />
    </div>
  )
}