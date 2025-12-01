import type { Match, PlayerName } from "./types.ts";

export interface MatchAnalysis {
    eloChange: number;
    expectedWinProbability: number;
    winTeam: Set<PlayerName>;
    loseTeam: Set<PlayerName>;
    beforeElos: { [key in PlayerName]: number };
}

export class Engine {
    elos: { [key in PlayerName]: number };
    bceLoss: number;
    matchCounts: { [key in PlayerName]: number };
    highK: number;
    normalK: number;
    highKMatchCount: number;

    constructor(highK: number = 64, normalK: number = 32, highKMatchCount: number = 10) {
        this.elos = {};
        this.bceLoss = 0;
        this.matchCounts = {};
        this.highK = highK;
        this.normalK = normalK;
        this.highKMatchCount = highKMatchCount;
    }

    getElo(player: PlayerName): number {
        return this.elos[player] || 1000;
    }

    getMatchCount(player: PlayerName): number {
        return this.matchCounts[player] || 0;
    }

    getKFactor(player: PlayerName): number {
        return this.getMatchCount(player) < this.highKMatchCount ? this.highK : this.normalK;
    }

    getCombinedElo(players: Set<PlayerName>): number {
        return Array.from(players).reduce((sum, player) => sum + this.getElo(player), 0);
    }

    analyzeMatch(match: Match): MatchAnalysis {
        // Calculate average K factor across all players
        const allPlayers = [...match.winner, ...match.loser];
        const averageK = allPlayers.reduce((sum, player) => sum + this.getKFactor(player), 0) / allPlayers.length;

        // Get combined team ELOs
        const winnerElo = this.getCombinedElo(match.winner);
        const loserElo = this.getCombinedElo(match.loser);

        // Calculate expected scores
        const expectedWinProbability = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));

        // Calculate ELO change (actual - expected)
        const eloChange = averageK * (1 - expectedWinProbability);

        // Update BCE loss: -log(p) where p is the predicted probability of the actual outcome
        this.bceLoss += -Math.log(expectedWinProbability);

        const beforeElos: { [key in PlayerName]: number } = {};
        for (const player of match.winner) {
            beforeElos[player] = this.getElo(player);
        }
        for (const player of match.loser) {
            beforeElos[player] = this.getElo(player);
        }

        // Update each player's ELO and match count
        for (const player of match.winner) {
            this.elos[player] = this.getElo(player) + eloChange;
            this.matchCounts[player] = this.getMatchCount(player) + 1;
        }

        for (const player of match.loser) {
            this.elos[player] = this.getElo(player) - eloChange;
            this.matchCounts[player] = this.getMatchCount(player) + 1;
        }
        return {
            eloChange,
            expectedWinProbability,
            winTeam: match.winner,
            loseTeam: match.loser,
            beforeElos,
        }
    }
}

export interface EngineAndMatches {
    engine: Engine;
    analyzedMatches: MatchAnalysis[];
}

export function createEngine(
    matches: Match[],
    highK: number = 64,
    normalK: number = 32,
    highKMatchCount: number = 10
): EngineAndMatches {
    const engine = new Engine(highK, normalK, highKMatchCount);
    const analyzed_matches: MatchAnalysis[] = [];
    for (const match of matches) {
        const analysis = engine.analyzeMatch(match);
        analyzed_matches.push(analysis);
    }
    return { engine, analyzedMatches: analyzed_matches };
}
