import type { Match, PlayerName } from "./types.ts";

import { calculateChanges } from "./eloChanger.ts";
import { PlayerEloState } from "./PlayerEloState.ts";

export interface EngineConfig {
    highK: number;
    normalK: number;
    highKMatchCount: number;
}

export interface MatchAnalysis {
    eloChanges: Map<PlayerName, number>;
    expectedWinProbability: number;
    winTeam: Set<PlayerName>;
    loseTeam: Set<PlayerName>;
    beforeElos: { [key in PlayerName]: number };
}

export class Engine {
    playerState: PlayerEloState;
    bceLoss: number;
    // How many matches each teammate pair has played together. Not a rating
    // input — just co-occurrence, used by the Teams UI.
    pairMatchCounts: Map<string, number>;
    config: EngineConfig;

    constructor(config: EngineConfig) {
        this.config = config;
        this.playerState = new PlayerEloState({
            normalK: config.normalK,
            highK: config.highK,
            highKMatchCount: config.highKMatchCount,
        });
        this.bceLoss = 0;
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

    getPairKey(player1: PlayerName, player2: PlayerName): string {
        return player1 < player2 ? `${player1}:${player2}` : `${player2}:${player1}`;
    }

    getPairMatchCount(player1: PlayerName, player2: PlayerName): number {
        return this.pairMatchCounts.get(this.getPairKey(player1, player2)) || 0;
    }

    getCombinedElo(players: Set<PlayerName>): number {
        return Array.from(players).reduce((sum, player) => sum + this.getElo(player), 0);
    }

    analyzeMatch(match: Match): MatchAnalysis {
        // Assert exactly 2 players per team
        if (match.winner.size !== 2 || match.loser.size !== 2) {
            throw new Error(`Expected exactly 2 players per team, got ${match.winner.size} winners and ${match.loser.size} losers`);
        }
        // Combined team ELOs = sum of the two players' ratings.
        const winnerElo = this.getCombinedElo(match.winner);
        const loserElo = this.getCombinedElo(match.loser);

        const [winner1, winner2] = Array.from(match.winner);
        const [loser1, loser2] = Array.from(match.loser);

        // Calculate Elo changes using EloChanger
        const { playerChanges, expectedWinProbability } = calculateChanges(
            match.winner,
            match.loser,
            winnerElo,
            loserElo,
            (player) => this.getKFactor(player),
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

        // Apply Elo changes and update match counts
        for (const [player, change] of playerChanges) {
            this.playerState.addElo(player, change);
            this.playerState.incrementMatchCount(player);
        }

        // Track how often each teammate pair has played together (Teams UI stat).
        const winnerKey = this.getPairKey(winner1, winner2);
        const loserKey = this.getPairKey(loser1, loser2);
        this.pairMatchCounts.set(winnerKey, (this.pairMatchCounts.get(winnerKey) || 0) + 1);
        this.pairMatchCounts.set(loserKey, (this.pairMatchCounts.get(loserKey) || 0) + 1);

        return {
            eloChanges: playerChanges,
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

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
    // Team rating is just the sum of the two players' Elos. A per-pair "chemistry"
    // adjustment was evaluated (src/eval, experience-filtered objective) and
    // removed: it OVERFIT — lower train loss but higher held-out loss on matches
    // between rated players — so turning it off improved every eval objective.
    normalK: 20.0,
    highK: 80,
    highKMatchCount: 10,
};

export function createEngine(
    matches: Match[],
    config: EngineConfig = DEFAULT_ENGINE_CONFIG,
): EngineAndMatches {
    const engine = new Engine(config);
    const analyzed_matches: MatchAnalysis[] = [];
    for (const match of matches) {
        const analysis = engine.analyzeMatch(match);
        analyzed_matches.push(analysis);
    }
    return { engine, analyzedMatches: analyzed_matches };
}
