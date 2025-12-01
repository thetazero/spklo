import type { Engine } from '../engine/main'

interface PairRankingsProps {
  engine: Engine
}

export function PairRankings({ engine }: PairRankingsProps) {
  // Convert pairwise adjustments to array and sort by combined ELO
  const pairRankings = Array.from(engine.pairwiseAdjustments.entries())
    .map(([key, value]) => {
      const [player1, player2] = key.split(':')
      const matchCount = engine.getPairMatchCount(player1, player2)
      const player1Elo = Math.round(engine.getElo(player1))
      const player2Elo = Math.round(engine.getElo(player2))
      const combinedElo = player1Elo + player2Elo + Math.round(value)
      return {
        player1,
        player2,
        adjustment: value,
        matchCount,
        player1Elo,
        player2Elo,
        combinedElo
      }
    })
    .sort((a, b) => b.combinedElo - a.combinedElo)

  if (pairRankings.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-4">Pair Rankings</h2>
      <p className="text-sm text-gray-600 mb-4">
        Team chemistry ratings - how well player pairs perform together
      </p>
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="p-2 text-left">Rank</th>
            <th className="p-2 text-left">Team ELO</th>
            <th className="p-2 text-left">Chemistry</th>
            <th className="p-2 text-left">Matches</th>
          </tr>
        </thead>
        <tbody>
          {pairRankings.map((pair, index) => (
            <tr key={`${pair.player1}:${pair.player2}`} className="border-b border-gray-200">
              <td className="p-2">{index + 1}</td>
              <td className="p-2">
                <div className="text-sm">
                  <span className="font-bold text-lg">{pair.combinedElo}</span>
                  <span className="text-gray-600"> = </span>
                  <span className="font-medium">{pair.player1}</span>
                  <span className="text-gray-600"> ({pair.player1Elo}) + </span>
                  <span className="font-medium">{pair.player2}</span>
                  <span className="text-gray-600"> ({pair.player2Elo}) + </span>
                  <span className={`font-semibold ${
                    pair.adjustment > 0 ? 'text-green-600' :
                    pair.adjustment < 0 ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {Math.round(pair.adjustment)}
                  </span>
                </div>
              </td>
              <td className="p-2">
                <span className={`font-semibold ${
                  pair.adjustment > 0 ? 'text-green-600' :
                  pair.adjustment < 0 ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {pair.adjustment > 0 ? '+' : ''}{pair.adjustment.toFixed(1)}
                </span>
              </td>
              <td className="p-2 text-gray-600">{pair.matchCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}