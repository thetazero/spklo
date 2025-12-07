import type { Match, PlayerName } from "../engine/types.js";


const old_names_map: { [key: string]: PlayerName } = {
  a: "Axel",
  l: "Losha",
  i: "August",
  n: "Neel",
  s: "Simon",
  g: "Guarov",
  e: "UnknownE",
}

const new_names_map: { [key: string]: PlayerName } = {
  axel: "Axel",
  losha: "Losha",
  august: "August",
  neel: "Neel",
  simon: "Simon",
  guarov: "Guarov",
}

const str_to_player: (player_str: string) => PlayerName = (player_str: string) => {
    player_str = player_str.trim().toLowerCase();
    if (player_str in new_names_map) {
        return new_names_map[player_str];
    }
    if (player_str.length !== 1) {
        throw new Error(`Invalid player name: ${player_str}`);
    }

    const player_name = old_names_map[player_str];
    if (!player_name) {
        console.log(player_str)
        console.log(old_names_map[player_str])
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

export async function loadMatchesCSV(path: string): Promise<Match[]> {
    const response = await fetch(path);
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const matches: Match[] = [];
    for (const line of lines.slice(1)) {
        const [win1, win2, lose1, lose2] = line.split(',').map(s => s.trim());
        const winner1 = str_to_player(win1);
        const winner2 = str_to_player(win2);
        const loser1 = str_to_player(lose1);
        const loser2 = str_to_player(lose2);
        const match: Match = {
            winner: new Set<PlayerName>([winner1, winner2]),
            loser: new Set<PlayerName>([loser1, loser2])
        };
        matches.push(match);
    }
    return matches;
}

export const new_matches_url: string = "https://docs.google.com/spreadsheets/d/12Q0joMcjaMmQGTLQqQvgViH1341V9WDD1Yr7JmdI8oU/export?gid=0&format=csv"
