import { useState, useEffect } from 'react'
import './App.css'
import { loadMatches } from './data/load'
import { createEngine, type EngineAndMatches } from './engine/main'

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

  if (loading) return <div>Loading matches...</div>
  if (error) return <div>Error: {error}</div>
  if (!engineData) return <div>No data</div>

  const sortedPlayers = Object.entries(engineData.engine.elos)
    .sort(([, a], [, b]) => b - a)

  return (
    <>
      <h1>Spike ELO Rankings</h1>

      <div className="card">
        <h2>Player Rankings</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>ELO</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map(([player, elo], index) => (
              <tr key={player}>
                <td>{index + 1}</td>
                <td>{player}</td>
                <td>{Math.round(elo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Match History</h2>
        <p>Total matches analyzed: {engineData.analyzedMatches.length}</p>
      </div>
    </>
  )
}

export default App
