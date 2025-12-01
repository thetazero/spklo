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
        const winner1 = str_to_player(match_data.win[0]);
        const winner2 = str_to_player(match_data.win[1]);
        const loser1 = str_to_player(match_data.lose[0]);
        const loser2 = str_to_player(match_data.lose[1]);
        const match: Match = {
            winner: new Set<PlayerName>([winner1, winner2]),
            loser: new Set<PlayerName>([loser1, loser2])
        };
        matches.push(match);
    }
    return matches;
}
