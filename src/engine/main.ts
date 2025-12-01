import { studentTCdf } from "./student_t_cdf.ts";
import type { Match, PlayerName } from "./types.ts";

export interface MatchAnalysis {
    eloChange: number;
    expectedWinProbability: number;
    winTeam: Set<PlayerName>;
    loseTeam: Set<PlayerName>;
    beforeElos: { [key in PlayerName]: number };
    beforePairwise: Map<string, number>;
    pairwiseDelta: number;
}

export class Engine {
    elos: { [key in PlayerName]: number };
    bceLoss: number;
    matchCounts: { [key in PlayerName]: number };
    pairwiseAdjustments: Map<string, number>;
    pairMatchCounts: Map<string, number>;
    highK: number;
    normalK: number;
    highKMatchCount: number;
    pairwiseFactor: number;

    constructor(
        highK: number = 64,
        normalK: number = 32,
        highKMatchCount: number = 10,
        pairwiseFactor: number = 0
    ) {
        this.elos = {};
        this.bceLoss = 0;
        this.matchCounts = {};
        this.pairwiseAdjustments = new Map();
        this.pairMatchCounts = new Map();
        this.highK = highK;
        this.normalK = normalK;
        this.highKMatchCount = highKMatchCount;
        this.pairwiseFactor = pairwiseFactor;
    }

    getElo(player: PlayerName): number {
        return this.elos[player] || 500;
    }

    getMatchCount(player: PlayerName): number {
        return this.matchCounts[player] || 0;
    }

    getKFactor(player: PlayerName): number {
        return this.getMatchCount(player) < this.highKMatchCount ? this.highK : this.normalK;
    }

    getPairwiseKey(player1: PlayerName, player2: PlayerName): string {
        return player1 < player2 ? `${player1}:${player2}` : `${player2}:${player1}`;
    }

    getPairwiseAdjustment(player1: PlayerName, player2: PlayerName): number {
        return this.pairwiseAdjustments.get(this.getPairwiseKey(player1, player2)) || 0;
    }

    getPairMatchCount(player1: PlayerName, player2: PlayerName): number {
        return this.pairMatchCounts.get(this.getPairwiseKey(player1, player2)) || 0;
    }

    getCombinedElo(players: Set<PlayerName>): number {
        return Array.from(players).reduce((sum, player) => sum + this.getElo(player), 0);
    }

    getCombinedEloWithPairwise(team: Set<PlayerName>): number {
        let totalElo = this.getCombinedElo(team);

        // Add pairwise adjustment for the teammate pair (exactly 2 players)
        if (this.pairwiseFactor > 0) {
            const [player1, player2] = Array.from(team);
            totalElo += this.getPairwiseAdjustment(player1, player2);
        }

        return totalElo;
    }

    computeWinProbability(winnerElo: number, loserElo: number): number {
        // return 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
        const delta = winnerElo - loserElo;
        const scale = 100; // analogous to 400 in standard Elo, but matched to t-dist
        return studentTCdf(delta / scale, 3);
    }

    computeEloChange(expectedWinProbability: number, kFactor: number): number {
        return kFactor * (1 - expectedWinProbability);
    }

    analyzeMatch(match: Match): MatchAnalysis {
        // Assert exactly 2 players per team
        if (match.winner.size !== 2 || match.loser.size !== 2) {
            throw new Error(`Expected exactly 2 players per team, got ${match.winner.size} winners and ${match.loser.size} losers`);
        }

        // Calculate average K factor across all players
        const allPlayers = [...match.winner, ...match.loser];
        const averageK = allPlayers.reduce((sum, player) => sum + this.getKFactor(player), 0) / allPlayers.length;

        // Get combined team ELOs with pairwise adjustments
        const winnerElo = this.getCombinedEloWithPairwise(match.winner);
        const loserElo = this.getCombinedEloWithPairwise(match.loser);

        // Calculate expected scores
        const expectedWinProbability = this.computeWinProbability(winnerElo, loserElo);

        // Calculate ELO change (actual - expected)
        const eloChange = this.computeEloChange(expectedWinProbability, averageK);

        // Update BCE loss: -log(p) where p is the predicted probability of the actual outcome
        this.bceLoss += -Math.log(expectedWinProbability);

        const beforeElos: { [key in PlayerName]: number } = {};
        for (const player of match.winner) {
            beforeElos[player] = this.getElo(player);
        }
        for (const player of match.loser) {
            beforeElos[player] = this.getElo(player);
        }

        // Capture pairwise adjustments before the match (for teammate pairs)
        // Since we have exactly 2 players per team, there's only one pair per team
        const beforePairwise = new Map<string, number>();
        const [winner1, winner2] = Array.from(match.winner);
        const [loser1, loser2] = Array.from(match.loser);

        const winnerKey = this.getPairwiseKey(winner1, winner2);
        const loserKey = this.getPairwiseKey(loser1, loser2);
        beforePairwise.set(winnerKey, this.getPairwiseAdjustment(winner1, winner2));
        beforePairwise.set(loserKey, this.getPairwiseAdjustment(loser1, loser2));

        // Update each player's ELO and match count
        for (const player of match.winner) {
            this.elos[player] = this.getElo(player) + eloChange;
            this.matchCounts[player] = this.getMatchCount(player) + 1;
        }

        for (const player of match.loser) {
            this.elos[player] = this.getElo(player) - eloChange;
            this.matchCounts[player] = this.getMatchCount(player) + 1;
        }

        // Update pairwise adjustments and match counts for teammate pairs
        // Since we have exactly 2 players per team, there's only one pair per team
        const pairwiseDelta = eloChange * this.pairwiseFactor;

        // Update winning team pair
        const winnerCurrentAdj = this.getPairwiseAdjustment(winner1, winner2);
        const winnerPairCount = this.getPairMatchCount(winner1, winner2);
        this.pairwiseAdjustments.set(winnerKey, winnerCurrentAdj + pairwiseDelta);
        this.pairMatchCounts.set(winnerKey, winnerPairCount + 1);

        // Update losing team pair
        const loserCurrentAdj = this.getPairwiseAdjustment(loser1, loser2);
        const loserPairCount = this.getPairMatchCount(loser1, loser2);
        this.pairwiseAdjustments.set(loserKey, loserCurrentAdj - pairwiseDelta);
        this.pairMatchCounts.set(loserKey, loserPairCount + 1);

        return {
            eloChange,
            expectedWinProbability,
            winTeam: match.winner,
            loseTeam: match.loser,
            beforeElos,
            beforePairwise,
            pairwiseDelta,
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
    normalK: number = 5,
    highKMatchCount: number = 4,
    pairwiseFactor: number = 0.2,
): EngineAndMatches {
    const engine = new Engine(highK, normalK, highKMatchCount, pairwiseFactor);
    const analyzed_matches: MatchAnalysis[] = [];
    for (const match of matches) {
        const analysis = engine.analyzeMatch(match);
        analyzed_matches.push(analysis);
    }
    return { engine, analyzedMatches: analyzed_matches };
}
