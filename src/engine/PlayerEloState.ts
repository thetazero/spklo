import type { PlayerName } from "./types";

export interface PlayerStateConfig {
    seeds: { [key in PlayerName]: number };
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

    beforeMatchHook(players: Set<PlayerName>): void {
        for (const player of players) {
            const seedKey = player.toLowerCase();
            if (!(player in this.elos) && (seedKey in this.config.seeds)) {
                const seedElo = this.config.seeds[seedKey];
                const eloDelta = (initialElo - seedElo) / Object.keys(this.elos).length;
                this.applyDeltaToAll(eloDelta);
                this.elos[player] = seedElo;
                console.log(`Applying seed for new player ${player}: ${seedElo}`, player in this.elos);
            }
        }
    }

    private applyDeltaToAll(delta: number): void {
        for (const player in this.elos) {
            this.elos[player] += delta;
        }
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
        if (player.toLocaleLowerCase() in this.config.seeds) {
            return this.config.normalK;
        }
        return this.getMatchCount(player) < this.config.highKMatchCount ? this.config.highK : this.config.normalK;
    }
}
