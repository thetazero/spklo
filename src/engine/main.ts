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
    constructor() {
        this.elos = {};
    }

    getElo(player: PlayerName): number {
        return this.elos[player] || 1000;
    }

    getCombinedElo(players: Set<PlayerName>): number {
        return Array.from(players).reduce((sum, player) => sum + this.getElo(player), 0);
    }

    analyzeMatch(match: Match): MatchAnalysis {
        const K = 32; // K-factor for ELO calculation

        // Get combined team ELOs
        const winnerElo = this.getCombinedElo(match.winner);
        const loserElo = this.getCombinedElo(match.loser);

        // Calculate expected scores
        const expectedWinProbability = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));

        // Calculate ELO change (actual - expected)
        const eloChange = K * (1 - expectedWinProbability);

        const beforeElos: { [key in PlayerName]: number } = {};
        for (const player of match.winner) {
            beforeElos[player] = this.getElo(player);
        }

        // Update each player's ELO
        for (const player of match.winner) {
            this.elos[player] = this.getElo(player) + eloChange;
        }

        for (const player of match.loser) {
            this.elos[player] = this.getElo(player) - eloChange;
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

export function createEngine(matches: Match[]): EngineAndMatches {
    const engine = new Engine();
    const analyzed_matches: MatchAnalysis[] = [];
    for (const match of matches) {
        const analysis = engine.analyzeMatch(match);
        analyzed_matches.push(analysis);
    }
    return { engine, analyzedMatches: analyzed_matches };
}
