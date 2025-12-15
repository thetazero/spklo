import type { PlayerName } from "./types";

export function calculateChanges(
        winnerTeam: Set<PlayerName>,
        loserTeam: Set<PlayerName>,
        winnerElo: number,
        loserElo: number,
        getKFactor: (player: PlayerName) => number,
        getPairwiseK: (players: PlayerName[]) => number
    ): {
        playerChanges: Map<PlayerName, number>,
        expectedWinProbability: number,
        winnerPairwiseChange: number,
        loserPairwiseChange: number
    } {
        // Calculate total K for each team (sum of individual K factors + pairwise K)
        const winnerPlayers = Array.from(winnerTeam);
        const loserPlayers = Array.from(loserTeam);

        const winnerPlayerK = winnerPlayers.reduce((sum, player) => sum + getKFactor(player), 0);
        const loserPlayerK = loserPlayers.reduce((sum, player) => sum + getKFactor(player), 0);

        const winnerPairK = getPairwiseK(winnerPlayers);
        const loserPairK = getPairwiseK(loserPlayers);

        const winnerTotalK = winnerPlayerK + winnerPairK;
        const loserTotalK = loserPlayerK + loserPairK;

        // Use average of team totals for the overall Elo change calculation
        const averageK = (winnerTotalK + loserTotalK) / 2;

        // Calculate expected win probability
        const expectedWinProbability = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));

        // Calculate base ELO change (actual - expected)
        const baseEloChange = averageK * (1 - expectedWinProbability);

        // Calculate weighted changes for each player
        const playerChanges = new Map<PlayerName, number>();

        // Distribute change to winners proportionally based on their K contribution
        for (const player of winnerPlayers) {
            const playerK = getKFactor(player);
            const weightedChange = (playerK / winnerTotalK) * baseEloChange;
            playerChanges.set(player, weightedChange);
        }

        // Distribute change to losers proportionally based on their K contribution
        for (const player of loserPlayers) {
            const playerK = getKFactor(player);
            const weightedChange = (playerK / loserTotalK) * baseEloChange;
            playerChanges.set(player, -weightedChange);
        }

        // Calculate pairwise changes proportionally based on pairwise K contribution
        const winnerPairwiseChange = (winnerPairK / winnerTotalK) * baseEloChange;
        const loserPairwiseChange = -(loserPairK / loserTotalK) * baseEloChange;

        return {
            playerChanges,
            expectedWinProbability,
            winnerPairwiseChange,
            loserPairwiseChange
        };
    }
