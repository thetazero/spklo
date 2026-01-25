import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { DatasetManager, DatasetType } from './data/dataset_manager'
import { createEngine, type EngineAndMatches } from './engine/main'
import { TeamsPage } from './pages/Teams'
import { MatchesPage } from './pages/Matches'
import { PlayersPage } from './pages/Players'
import { StatsPage } from './pages/Stats'
import { DetailsPage } from './pages/Details'
import { BalancedTeamPage } from './pages/BalancedTeam'
import { DatasetSelector } from './components/DatasetSelector'

function App() {
  const [engineData, setEngineData] = useState<EngineAndMatches | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDataset, setCurrentDataset] = useState<DatasetType>(DatasetType.BOTH)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const datasetManager = new DatasetManager(currentDataset)
        const matches = await datasetManager.loadData()
        const data = createEngine(matches)
        setEngineData(data)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load matches')
        setLoading(false)
      }
    }
    loadData()
  }, [currentDataset])

  const handleDatasetChange = (dataset: DatasetType) => {
    setCurrentDataset(dataset)
  }

  if (loading) return <div className="min-h-screen bg-gray-900 text-gray-100 p-8">Loading matches...</div>
  if (error) return <div className="min-h-screen bg-gray-900 text-red-400 p-8">Error: {error}</div>
  if (!engineData) return <div className="min-h-screen bg-gray-900 text-gray-100 p-8">No data</div>

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <div className="container mx-auto px-4 py-8">
          <nav className="mb-8">
            <ul className="flex flex-wrap gap-2 sm:gap-4 justify-center">
              <li>
                <DatasetSelector
                  currentDataset={currentDataset}
                  onDatasetChange={handleDatasetChange}
                />
              </li>
              <li>
                <Link to="teams" className="inline-block px-3 py-2 sm:px-4 bg-gray-800 hover:bg-gray-700 rounded text-gray-100 text-sm sm:text-base">
                  Teams
                </Link>
              </li>
              <li>
                <Link to="players" className="inline-block px-3 py-2 sm:px-4 bg-gray-800 hover:bg-gray-700 rounded text-gray-100 text-sm sm:text-base">
                  Players
                </Link>
              </li>
              <li>
                <Link to="matches" className="inline-block px-3 py-2 sm:px-4 bg-gray-800 hover:bg-gray-700 rounded text-gray-100 text-sm sm:text-base">
                  Matches
                </Link>
              </li>
              <li>
                <Link to="details" className="inline-block px-3 py-2 sm:px-4 bg-gray-800 hover:bg-gray-700 rounded text-gray-100 text-sm sm:text-base">
                  Details
                </Link>
              </li>
              <li>
                <Link to="balanced" className="inline-block px-3 py-2 sm:px-4 bg-gray-800 hover:bg-gray-700 rounded text-gray-100 text-sm sm:text-base">
                  Balanced
                </Link>
              </li>
              <li>
                <Link to="stats" className="inline-block px-3 py-2 sm:px-4 bg-gray-800 hover:bg-gray-700 rounded text-gray-100 text-sm sm:text-base">
                  Stats
                </Link>
              </li>
            </ul>
          </nav>

          <Routes>
            <Route path="" element={<Navigate to="teams" replace />} />
            <Route path="details" element={<DetailsPage engine={engineData.engine} matches={engineData.analyzedMatches} />} />
            <Route path="players" element={<PlayersPage engine={engineData.engine} />} />
            <Route path="teams" element={<TeamsPage engine={engineData.engine} />} />
            <Route path="matches" element={<MatchesPage matches={engineData.analyzedMatches} />} />
            <Route path="balanced" element={<BalancedTeamPage engine={engineData.engine} />} />
            <Route path="stats" element={<StatsPage totalMatches={engineData.analyzedMatches.length} bceLoss={engineData.engine.bceLoss} matches={engineData.analyzedMatches} />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  )
}

export default App
