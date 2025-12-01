import { MatchTable } from '../components/MatchTable'
import type { MatchAnalysis } from '../engine/main'

interface MatchesPageProps {
  matches: MatchAnalysis[]
}

export function MatchesPage({ matches }: MatchesPageProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-100">Match History</h2>
      <MatchTable matches={matches} />
    </div>
  )
}