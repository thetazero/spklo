import { MatchTable } from '../components/MatchTable'
import type { MatchAnalysis } from '../engine/main'

interface MatchesPageProps {
  matches: MatchAnalysis[]
}

export function MatchesPage({ matches }: MatchesPageProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6">
      <MatchTable matches={matches} />
    </div>
  )
}
