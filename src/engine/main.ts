import type { Match, PlayerName } from "./types.ts";

export interface MatchAnalysis {
    eloChanges: Map<PlayerName, number>;
    expectedWinProbability: number;
    winTeam: Set<PlayerName>;
    loseTeam: Set<PlayerName>;
    beforeElos: { [key in PlayerName]: number };
    beforePairwise: Map<string, number>;
    pairwiseDelta: number;
}

export class EloChanger {
    calculateChanges(
        winnerTeam: Set<PlayerName>,
        loserTeam: Set<PlayerName>,
        winnerElo: number,
        loserElo: number,
        getKFactor: (player: PlayerName) => number
    ): { playerChanges: Map<PlayerName, number>, expectedWinProbability: number, baseEloChange: number } {
        // Calculate total K for each team (sum of individual K factors)
        const winnerPlayers = Array.from(winnerTeam);
        const loserPlayers = Array.from(loserTeam);

        const winnerTotalK = winnerPlayers.reduce((sum, player) => sum + getKFactor(player), 0);
        const loserTotalK = loserPlayers.reduce((sum, player) => sum + getKFactor(player), 0);

        // Use average of team totals for the overall Elo change calculation
        const averageK = (winnerTotalK + loserTotalK) / 2;

        // Calculate expected win probability
        const expectedWinProbability = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));

        // Calculate base ELO change (actual - expected)
        const baseEloChange = averageK * (1 - expectedWinProbability);

        // Calculate weighted changes for each player
        const playerChanges = new Map<PlayerName, number>();

        // Distribute change to winners proportionally
        for (const player of winnerPlayers) {
            const playerK = getKFactor(player);
            const weightedChange = (playerK / winnerTotalK) * baseEloChange;
            playerChanges.set(player, weightedChange);
        }

        // Distribute change to losers proportionally
        for (const player of loserPlayers) {
            const playerK = getKFactor(player);
            const weightedChange = (playerK / loserTotalK) * baseEloChange;
            playerChanges.set(player, -weightedChange);
        }

        return { playerChanges, expectedWinProbability, baseEloChange };
    }
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
    eloChanger: EloChanger;

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
        this.eloChanger = new EloChanger();
    }

    getElo(player: PlayerName): number {
        return this.elos[player] || 500;
    }

    getMatchCount(player: PlayerName): number {
        return this.matchCounts[player] || 0;
    }

    getKFactor(player: PlayerName): number {
        if (this.getMatchCount(player) < this.highKMatchCount) {
            return this.highK;
        }
        return this.normalK;
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

    analyzeMatch(match: Match): MatchAnalysis {
        // Assert exactly 2 players per team
        if (match.winner.size !== 2 || match.loser.size !== 2) {
            throw new Error(`Expected exactly 2 players per team, got ${match.winner.size} winners and ${match.loser.size} losers`);
        }

        // Get combined team ELOs with pairwise adjustments
        const winnerElo = this.getCombinedEloWithPairwise(match.winner);
        const loserElo = this.getCombinedEloWithPairwise(match.loser);

        // Calculate Elo changes using EloChanger
        const { playerChanges, expectedWinProbability, baseEloChange } = this.eloChanger.calculateChanges(
            match.winner,
            match.loser,
            winnerElo,
            loserElo,
            (player) => this.getKFactor(player)
        );

        // Update BCE loss: -log(p) where p is the predicted probability of the actual outcome
        this.bceLoss += -Math.log(expectedWinProbability);

        // Capture state before updating
        const beforeElos: { [key in PlayerName]: number } = {};
        for (const player of match.winner) {
            beforeElos[player] = this.getElo(player);
        }
        for (const player of match.loser) {
            beforeElos[player] = this.getElo(player);
        }

        const beforePairwise = new Map<string, number>();
        const [winner1, winner2] = Array.from(match.winner);
        const [loser1, loser2] = Array.from(match.loser);

        const winnerKey = this.getPairwiseKey(winner1, winner2);
        const loserKey = this.getPairwiseKey(loser1, loser2);
        beforePairwise.set(winnerKey, this.getPairwiseAdjustment(winner1, winner2));
        beforePairwise.set(loserKey, this.getPairwiseAdjustment(loser1, loser2));

        // Apply Elo changes and update match counts
        for (const [player, change] of playerChanges) {
            this.elos[player] = this.getElo(player) + change;
            this.matchCounts[player] = this.getMatchCount(player) + 1;
        }

        // Update pairwise adjustments and match counts for teammate pairs
        const pairwiseDelta = baseEloChange * this.pairwiseFactor;

        const winnerCurrentAdj = this.getPairwiseAdjustment(winner1, winner2);
        const winnerPairCount = this.getPairMatchCount(winner1, winner2);
        this.pairwiseAdjustments.set(winnerKey, winnerCurrentAdj + pairwiseDelta);
        this.pairMatchCounts.set(winnerKey, winnerPairCount + 1);

        const loserCurrentAdj = this.getPairwiseAdjustment(loser1, loser2);
        const loserPairCount = this.getPairMatchCount(loser1, loser2);
        this.pairwiseAdjustments.set(loserKey, loserCurrentAdj - pairwiseDelta);
        this.pairMatchCounts.set(loserKey, loserPairCount + 1);

        return {
            eloChanges: playerChanges,
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
    highK: number = 128,
    normalK: number = 4,
    highKMatchCount: number = 4,
    pairwiseFactor: number = 0.5,
): EngineAndMatches {
    const engine = new Engine(highK, normalK, highKMatchCount, pairwiseFactor);
    const analyzed_matches: MatchAnalysis[] = [];
    for (const match of matches) {
        const analysis = engine.analyzeMatch(match);
        analyzed_matches.push(analysis);
    }
    return { engine, analyzedMatches: analyzed_matches };
}
