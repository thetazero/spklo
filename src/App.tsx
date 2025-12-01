import { useState, useEffect } from 'react'
import { loadMatches } from './data/load'
import { createEngine, type EngineAndMatches } from './engine/main'
import { MatchTable } from './components/MatchTable'
import { StatisticsCard } from './components/StatisticsCard'
import { PlayerRankings } from './components/PlayerRankings'
import { PairRankings } from './components/PairRankings'

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

  if (loading) return <div className="p-8">Loading matches...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>
  if (!engineData) return <div className="p-8">No data</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Spike ELO Rankings</h1>

      <PlayerRankings engine={engineData.engine} />

      <PairRankings engine={engineData.engine} />

      <StatisticsCard
        totalMatches={engineData.analyzedMatches.length}
        bceLoss={engineData.engine.bceLoss}
      />

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Match History</h2>
        <MatchTable matches={engineData.analyzedMatches} />
      </div>
    </div>
  )
}

export default App
