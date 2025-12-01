interface Player {
  name: string
  elo: number
  eloDelta?: number
}

interface TeamEloDisplayProps {
  players: Player[]
  pairwiseAdjustment: number
  pairwiseDelta?: number
  showTotal?: boolean
}

export function TeamEloDisplay({
  players,
  pairwiseAdjustment,
  pairwiseDelta,
  showTotal = true
}: TeamEloDisplayProps) {
  const totalElo = players.reduce((sum, p) => sum + p.elo, 0) + Math.round(pairwiseAdjustment)

  return (
    <div className="text-sm">
      {showTotal && (
        <>
          <span className="font-bold text-lg">{totalElo.toFixed(0)}</span>
          <span className="text-gray-600"> = </span>
        </>
      )}
      {players.map((player, index) => (
        <span key={player.name}>
          <span className="font-medium">{player.name}</span>
          <span className="text-gray-600"> ({Math.round(player.elo)}</span>
          {player.eloDelta !== undefined && (
            <span className={player.eloDelta >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {player.eloDelta >= 0 ? '+' : ''}{Math.round(player.eloDelta)}
            </span>
          )}
          <span className="text-gray-600">)</span>
          {index < players.length - 1 && <span className="text-gray-600"> + </span>}
        </span>
      ))}
      <span className="text-gray-600"> + (</span>
      <span className="text-gray-600 font-semibold">{pairwiseAdjustment.toFixed(1)}</span>
      {pairwiseDelta !== undefined && (
        <span className={pairwiseDelta >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
          {pairwiseDelta >= 0 ? '+' : ''}{pairwiseDelta.toFixed(1)}
        </span>
      )}
      <span className="text-gray-600">)</span>
    </div>
  )
}
