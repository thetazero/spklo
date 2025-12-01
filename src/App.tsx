import { useState, useEffect } from 'react'
import { loadMatches } from './data/load'
import { createEngine, type EngineAndMatches } from './engine/main'
import { MatchTable } from './components/MatchTable'
import { StatisticsCard } from './components/StatisticsCard'
import { PlayerRankings } from './components/PlayerRankings'
import { TeamRankings } from './components/TeamRankings'

function App() {
  const [engineData, setEngineData] = useState<EngineAndMatches | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const matches = await loadMatches('/src/data/matches.json')
        const data = createEngine(matches)
        setEngineData(data)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load matches')
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <div className="min-h-screen bg-gray-900 text-gray-100 p-8">Loading matches...</div>
  if (error) return <div className="min-h-screen bg-gray-900 text-red-400 p-8">Error: {error}</div>
  if (!engineData) return <div className="min-h-screen bg-gray-900 text-gray-100 p-8">No data</div>

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-100">Spike ELO Rankings</h1>

      <PlayerRankings engine={engineData.engine} />

      <TeamRankings engine={engineData.engine} />

      <StatisticsCard
        totalMatches={engineData.analyzedMatches.length}
        bceLoss={engineData.engine.bceLoss}
      />

        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-100">Match History</h2>
          <MatchTable matches={engineData.analyzedMatches} />
        </div>
      </div>
    </div>
  )
}

export default App
