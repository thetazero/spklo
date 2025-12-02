import type { PlayerName } from '../engine/types'

interface PlayerSelectorProps {
  availablePlayers: PlayerName[]
  selectedPlayers: PlayerName[]
  onPlayerSelect: (player: PlayerName) => void
  onClear: () => void
  maxPlayers?: number
}

export function PlayerSelector({
  availablePlayers,
  selectedPlayers,
  onPlayerSelect,
  onClear,
  maxPlayers = 2
}: PlayerSelectorProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-100 mb-3">
        Select Players ({selectedPlayers.length}/{maxPlayers})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
        {availablePlayers.map((player) => {
          const isSelected = selectedPlayers.includes(player)
          const isDisabled = !isSelected && selectedPlayers.length >= maxPlayers

          return (
            <button
              key={player}
              onClick={() => onPlayerSelect(player)}
              disabled={isDisabled}
              className={`
                px-3 py-2 rounded text-sm font-medium transition-colors
                ${isSelected
                  ? 'bg-blue-600 text-white'
                  : isDisabled
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                }
              `}
            >
              {player}
            </button>
          )
        })}
      </div>

      {selectedPlayers.length > 0 && (
        <button
          onClick={onClear}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Clear Selection
        </button>
      )}
    </div>
  )
}