import type { Match, PlayerName } from "./types.ts";

import { calculateChanges } from "./eloChanger.ts";
import { PlayerEloState, type EloAdjustmentEvent } from "./PlayerEloState.ts";

export interface EngineConfig {
    highK: number;
    normalK: number;
    highKMatchCount: number;
    pairwiseFactor: number;
    elligibleForEloRedistributionThresholdMatches: number;
    initialSeeds: { [key in PlayerName]: number };
}

export interface MatchAnalysis {
    eloChanges: Map<PlayerName, number>;
    expectedWinProbability: number;
    winTeam: Set<PlayerName>;
    loseTeam: Set<PlayerName>;
    beforeElos: { [key in PlayerName]: number };
    beforePairwise: Map<string, number>;
    winnerPairwiseDelta: number;
    loserPairwiseDelta: number;
    adjustmentEvent: EloAdjustmentEvent | null;
}

export class Engine {
    playerState: PlayerEloState;
    bceLoss: number;
    pairwiseAdjustments: Map<string, number>;
    pairMatchCounts: Map<string, number>;
    config: EngineConfig;

    constructor(config: EngineConfig) {
        this.config = config;
        this.playerState = new PlayerEloState({
            seeds: config.initialSeeds,
            highK: config.highK,
            normalK: config.normalK,
            highKMatchCount: config.highKMatchCount,
            elligibleForEloRedistributionThresholdMatches: config.elligibleForEloRedistributionThresholdMatches,
        });
        this.bceLoss = 0;
        this.pairwiseAdjustments = new Map();
        this.pairMatchCounts = new Map();
    }

    getElo(player: PlayerName): number {
        return this.playerState.getElo(player);
    }

    getMatchCount(player: PlayerName): number {
        return this.playerState.getMatchCount(player);
    }

    getKFactor(player: PlayerName): number {
        return this.playerState.getKFactor(player);
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

    getPairwiseK(player1: PlayerName, player2: PlayerName): number {
        return (this.getKFactor(player1) + this.getKFactor(player2))/2 * this.config.pairwiseFactor;
    }

    getCombinedElo(players: Set<PlayerName>): number {
        return Array.from(players).reduce((sum, player) => sum + this.getElo(player), 0);
    }

    getCombinedEloWithPairwise(team: Set<PlayerName>): number {
        let totalElo = this.getCombinedElo(team);

        // Add pairwise adjustment for the teammate pair (exactly 2 players)
        if (this.config.pairwiseFactor > 0) {
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
        // Apply player seed adjustments before the match
        // console.log(match.winner, match.loser, [...match.winner, ...match.loser], new Set([...match.winner, ...match.loser]));
        const adjustmentEvent = this.playerState.beforeMatchHook(new Set([...match.winner, ...match.loser]));

        // Get combined team ELOs with pairwise adjustments
        const winnerElo = this.getCombinedEloWithPairwise(match.winner);
        const loserElo = this.getCombinedEloWithPairwise(match.loser);

        const [winner1, winner2] = Array.from(match.winner);
        const [loser1, loser2] = Array.from(match.loser);

        // Calculate Elo changes using EloChanger
        const {
            playerChanges,
            expectedWinProbability,
            winnerPairwiseChange,
            loserPairwiseChange
        } = calculateChanges(
            match.winner,
            match.loser,
            winnerElo,
            loserElo,
            (player) => this.getKFactor(player),
            (players) => this.getPairwiseK(players[0], players[1])
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
        const winnerKey = this.getPairwiseKey(winner1, winner2);
        const loserKey = this.getPairwiseKey(loser1, loser2);
        beforePairwise.set(winnerKey, this.getPairwiseAdjustment(winner1, winner2));
        beforePairwise.set(loserKey, this.getPairwiseAdjustment(loser1, loser2));

        // Apply Elo changes and update match counts
        for (const [player, change] of playerChanges) {
            this.playerState.addElo(player, change);
            this.playerState.incrementMatchCount(player);
        }

        // Update pairwise adjustments and match counts for teammate pairs using calculated changes
        const winnerCurrentAdj = this.getPairwiseAdjustment(winner1, winner2);
        const winnerPairCount = this.getPairMatchCount(winner1, winner2);
        this.pairwiseAdjustments.set(winnerKey, winnerCurrentAdj + winnerPairwiseChange);
        this.pairMatchCounts.set(winnerKey, winnerPairCount + 1);

        const loserCurrentAdj = this.getPairwiseAdjustment(loser1, loser2);
        const loserPairCount = this.getPairMatchCount(loser1, loser2);
        this.pairwiseAdjustments.set(loserKey, loserCurrentAdj + loserPairwiseChange);
        this.pairMatchCounts.set(loserKey, loserPairCount + 1);

        return {
            eloChanges: playerChanges,
            expectedWinProbability,
            winTeam: match.winner,
            loseTeam: match.loser,
            beforeElos,
            beforePairwise,
            winnerPairwiseDelta: winnerPairwiseChange,
            loserPairwiseDelta: loserPairwiseChange,
            adjustmentEvent,
        }
    }
}

export interface EngineAndMatches {
    engine: Engine;
    analyzedMatches: MatchAnalysis[];
}

export function createEngine(
    matches: Match[],
    config: EngineConfig = {
        highK: 128,
        normalK: 4,
        highKMatchCount: 4,
        pairwiseFactor: 1.0,
        initialSeeds: {
            "katie": 160,
            "yonah": 480,
            "sophia": 440,
            "loshaleft": 240,
            "igor": 400,
            "tatiana": 420,
            "andrei": 450,
        },
        elligibleForEloRedistributionThresholdMatches: 20,
    },
): EngineAndMatches {
    const engine = new Engine(config);
    const analyzed_matches: MatchAnalysis[] = [];
    for (const match of matches) {
        const analysis = engine.analyzeMatch(match);
        analyzed_matches.push(analysis);
    }
    return { engine, analyzedMatches: analyzed_matches };
}
