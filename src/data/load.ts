import type { Match, PlayerName } from "../engine/types.js";


const names_map: { [key: string]: PlayerName } = {
  A: "Axel",
  L: "Lesha",
  I: "August",
  N: "Neel",
  S: "Simon",
  G: "Guarov"
}

const str_to_player: (player_str: string) => PlayerName = (player_str: string) => {
    player_str = player_str.trim().toLowerCase();
    if (player_str.length !== 1) {
        throw new Error(`Invalid player name: ${player_str}`);
    }

    const player_name = names_map[player_str.toUpperCase()];
    if (!player_name) {
        throw new Error(`Unknown player: ${player_str}`);
    }
    return player_name;
}

export async function loadMatches(path: string): Promise<Match[]> {
    const response = await fetch(path);
    const data = await response.json();
    const matches: Match[] = [];
    for (const match_data of data) {
        const win
    }
    return matches;
}
