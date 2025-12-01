import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { loadMatches } from './data/load'
import { createEngine, type EngineAndMatches } from './engine/main'
import { TeamsPage } from './pages/Teams'
import { MatchesPage } from './pages/Matches'
import { PlayersPage } from './pages/Players'
import { StatsPage } from './pages/Stats'

function App() {
  const [engineData, setEngineData] = useState<EngineAndMatches | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const matches = await loadMatches('/matches.json')
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
    <HashRouter>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-100">Spike ELO Rankings</h1>

          <nav className="mb-8">
            <ul className="flex gap-4 justify-center">
              <li>
                <Link to="teams" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-100">
                  Teams
                </Link>
              </li>
              <li>
                <Link to="players" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-100">
                  Players
                </Link>
              </li>
              <li>
                <Link to="matches" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-100">
                  Matches
                </Link>
              </li>
              <li>
                <Link to="stats" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-100">
                  Stats
                </Link>
              </li>
            </ul>
          </nav>

          <Routes>
            <Route path="" element={<Navigate to="teams" replace />} />
            <Route path="players" element={<PlayersPage engine={engineData.engine} />} />
            <Route path="teams" element={<TeamsPage engine={engineData.engine} />} />
            <Route path="matches" element={<MatchesPage matches={engineData.analyzedMatches} />} />
            <Route path="stats" element={<StatsPage totalMatches={engineData.analyzedMatches.length} bceLoss={engineData.engine.bceLoss} />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  )
}

export default App
