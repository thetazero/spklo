interface Player {
  name: string
  elo: number
  eloDelta?: number
}

interface TeamEloDisplayProps {
  players: Player[]
  showTotal?: boolean
}

export function TeamEloDisplay({
  players,
  showTotal = true
}: TeamEloDisplayProps) {
  const totalElo = players.reduce((sum, p) => sum + p.elo, 0)

  return (
    <div className="text-sm">
      {showTotal && (
        <>
          <span className="font-bold text-lg text-gray-100">{totalElo.toFixed(0)}</span>
          <span className="text-gray-400"> = </span>
        </>
      )}
      {players.map((player, index) => (
        <span key={player.name}>
          <span className="font-medium text-gray-100">{player.name}</span>
          <span className="text-gray-400"> ({Math.round(player.elo)}</span>
          {player.eloDelta !== undefined && (
            <span className={player.eloDelta >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
              {player.eloDelta >= 0 ? '+' : ''}{player.eloDelta.toFixed(1)}
            </span>
          )}
          <span className="text-gray-400">)</span>
          {index < players.length - 1 && <span className="text-gray-400"> + </span>}
        </span>
      ))}
    </div>
  )
}
