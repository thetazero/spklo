import type { PlayerName } from "./types";

export function calculateChanges(
        winnerTeam: Set<PlayerName>,
        loserTeam: Set<PlayerName>,
        winnerElo: number,
        loserElo: number,
        getKFactor: (player: PlayerName) => number,
    ): {
        playerChanges: Map<PlayerName, number>,
        expectedWinProbability: number,
    } {
        const winnerPlayers = Array.from(winnerTeam);
        const loserPlayers = Array.from(loserTeam);

        // Total K for each team (sum of individual K factors)
        const winnerTotalK = winnerPlayers.reduce((sum, player) => sum + getKFactor(player), 0);
        const loserTotalK = loserPlayers.reduce((sum, player) => sum + getKFactor(player), 0);

        // Use average of team totals for the overall Elo change calculation
        const averageK = (winnerTotalK + loserTotalK) / 2;

        // Calculate expected win probability
        const expectedWinProbability = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));

        // Calculate base ELO change (actual - expected)
        const baseEloChange = averageK * (1 - expectedWinProbability);

        // Distribute the change to each player proportionally to their K contribution
        const playerChanges = new Map<PlayerName, number>();

        for (const player of winnerPlayers) {
            const playerK = getKFactor(player);
            playerChanges.set(player, (playerK / winnerTotalK) * baseEloChange);
        }

        for (const player of loserPlayers) {
            const playerK = getKFactor(player);
            playerChanges.set(player, -(playerK / loserTotalK) * baseEloChange);
        }

        return {
            playerChanges,
            expectedWinProbability,
        };
    }
