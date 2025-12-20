import type { PlayerName } from "./types";

export interface PlayerStateConfig {
    seeds: { [key in PlayerName]: number };
    highK: number;
    normalK: number;
    highKMatchCount: number;
    elligibleForEloRedistributionThresholdMatches: number;
}

export interface EloAdjustmentEvent {
    players: Set<PlayerName>;
    adjustment: number;
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

    beforeMatchHook(players: Set<PlayerName>): EloAdjustmentEvent | null {
        let total_adjustment = 0;
        let adj_players: Set<PlayerName> = new Set();
        for (const player of players) {
            const seedKey = player.toLowerCase();
            if (!(player in this.elos)) {
                console.log(`New player detected: ${player}`);
            }
            if (!(player in this.elos) && (seedKey in this.config.seeds)) {
                const seedElo = this.config.seeds[seedKey];

                const playersForRedistribution = this.playersElligibleForEloRedistribution();

                const eloDelta = (initialElo - seedElo) / playersForRedistribution.length;

                for (const p of playersForRedistribution) {
                    this.elos[p] += eloDelta;
                }

                this.elos[player] = seedElo;
                console.log(`Applying seed for new player ${player}: ${seedElo}`, player in this.elos);
                console.log(`Redistributing ${-eloDelta.toFixed(2)} each of to ${playersForRedistribution.join(", ")}`);
                total_adjustment += eloDelta;
                for (const p of playersForRedistribution) {
                    adj_players.add(p);
                }
            }
        }
        if (total_adjustment !== 0) {
            return {
                players: adj_players,
                adjustment: total_adjustment,
            }
        }
        return null;
    }

    private playersElligibleForEloRedistribution(): PlayerName[] {
        return Object.keys(this.elos).filter(player => {
            const gamesPlayed = this.getMatchCount(player);
            return gamesPlayed >= this.config.elligibleForEloRedistributionThresholdMatches;
        })
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
