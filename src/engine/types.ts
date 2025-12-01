export type PlayerName = string;

export interface Match {
    winner: Set<PlayerName>;
    loser: Set<PlayerName>; 
}
