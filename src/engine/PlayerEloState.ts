import type { PlayerName } from "./types";

export interface PlayerStateConfig {
    highK: number;
    normalK: number;
    highKMatchCount: number;
}

const initialElo = 500;


export class PlayerEloState {
    elos: {
        [key in PlayerName]: number;
    };
    private matchCounts: {
        [key in PlayerName]: number;
    };
    config: PlayerStateConfig;

    constructor(config: PlayerStateConfig) {
        this.elos = {};
        this.matchCounts = {};
        this.config = config;
    }

    getElo(player: PlayerName): number {
        return this.elos[player] || initialElo;
    }

    setElo(player: PlayerName, elo: number): void {
        this.elos[player] = elo;
    }

    addElo(player: PlayerName, delta: number): void {
        this.elos[player] = this.getElo(player) + delta;
    }

    getMatchCount(player: PlayerName): number {
        return this.matchCounts[player] || 0;
    }

    incrementMatchCount(player: PlayerName): void {
        this.matchCounts[player] = this.getMatchCount(player) + 1;
    }

    getKFactor(player: PlayerName): number {
        const matchCount = this.getMatchCount(player);
        return matchCount < this.config.highKMatchCount ? this.config.highK : this.config.normalK;
    }
}
