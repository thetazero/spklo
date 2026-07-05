import type { MatchAnalysis } from '../engine/main'
import type { PlayerName } from '../engine/types'

/**
 * Single source of truth for every metric shown on the Stats page and used by
 * the offline eval harness. The UI components and `src/eval` both import from
 * here, so "the eval contains everything in stats" is literally the same code.
 *
 * Every metric is derived from `MatchAnalysis.expectedWinProbability`, which the
 * engine records *before* it applies the Elo update for that match. That makes
 * these numbers a proper prequential (predict-then-update) measure: on a held-out
 * slice they reflect out-of-sample predictions, not fitted-on-the-answer ones.
 */

/** Log loss of a coin-flip predictor: -ln(0.5). Any model worth keeping beats this. */
export const BASELINE_LOG_LOSS = Math.log(2)

export interface SummaryStats {
  totalMatches: number
  /** Sum of -ln(p) over matches (a.k.a. total BCE / cross-entropy loss). */
  totalLogLoss: number
  /** Mean -ln(p) per match. The headline number to minimize. */
  avgLogLoss: number
  /** exp(-avgLogLoss): the geometric-mean probability the model gave the true winner. */
  impliedWinProbability: number
  /** Fraction of matches where the model favored the actual winner (ties count 0.5). */
  accuracy: number
  /** Mean Brier score: mean of (1 - p)^2. Lower is better. */
  brier: number
  /** Expected Calibration Error across probability buckets (0 = perfectly calibrated). */
  ece: number
  /** 1 - avgLogLoss / BASELINE_LOG_LOSS. 0 = no better than a coin flip, 1 = perfect. */
  skillScore: number
}

/**
 * Pick a calibration bucket count from the sample size. Each match contributes
 * two mirrored datapoints, and a bucket needs ~25 datapoints before its observed
 * win rate is worth reading; clamped to [2, 10] so tiny slices still get a table
 * and huge ones don't get absurdly thin ranges.
 */
export function defaultCalibrationBucketCount(matchCount: number): number {
  return Math.max(2, Math.min(10, Math.floor((matchCount * 2) / 25)))
}

export function computeSummaryStats(
  matches: MatchAnalysis[],
  eceBuckets?: number,
): SummaryStats {
  const totalMatches = matches.length
  if (totalMatches === 0) {
    return {
      totalMatches: 0,
      totalLogLoss: 0,
      avgLogLoss: 0,
      impliedWinProbability: 0,
      accuracy: 0,
      brier: 0,
      ece: 0,
      skillScore: 0,
    }
  }

  let totalLogLoss = 0
  let correct = 0
  let brierSum = 0

  for (const match of matches) {
    const p = match.expectedWinProbability
    totalLogLoss += -Math.log(p)
    brierSum += (1 - p) * (1 - p)
    if (p > 0.5) correct += 1
    else if (p === 0.5) correct += 0.5
  }

  const avgLogLoss = totalLogLoss / totalMatches

  return {
    totalMatches,
    totalLogLoss,
    avgLogLoss,
    impliedWinProbability: Math.exp(-avgLogLoss),
    accuracy: correct / totalMatches,
    brier: brierSum / totalMatches,
    ece: computeExpectedCalibrationError(matches, eceBuckets),
    skillScore: 1 - avgLogLoss / BASELINE_LOG_LOSS,
  }
}

export interface CalibrationBucket {
  minProb: number
  maxProb: number
  predictedWinRate: number
  observedWinRate: number
  count: number
}

/**
 * Reliability table over the 50-100% range. Each match contributes two symmetric
 * data points — the winner at p and the loser at (1 - p) — so both sides of every
 * prediction are scored. (Moved verbatim from CalibrationCard so UI and eval agree.)
 */
export function computeCalibrationBuckets(
  matches: MatchAnalysis[],
  numBuckets: number = defaultCalibrationBucketCount(matches.length),
): CalibrationBucket[] {
  const bucketSize = 0.5 / numBuckets // Only 50-100% range
  const buckets: CalibrationBucket[] = []

  const dataPoints: Array<{ probability: number; won: boolean }> = []
  for (const match of matches) {
    dataPoints.push({ probability: match.expectedWinProbability, won: true })
    dataPoints.push({ probability: 1 - match.expectedWinProbability, won: false })
  }

  for (let i = numBuckets - 1; i >= 0; i--) {
    const minProb = 0.5 + i * bucketSize
    const maxProb = 0.5 + (i + 1) * bucketSize

    const pointsInBucket = dataPoints.filter(
      p => p.probability >= minProb && p.probability < maxProb,
    )

    // For the last bucket (highest range), include the exact-1.0 predictions.
    if (i === numBuckets - 1) {
      pointsInBucket.push(...dataPoints.filter(p => p.probability === 1.0))
    }

    if (pointsInBucket.length > 0) {
      const totalPredicted = pointsInBucket.reduce((sum, p) => sum + p.probability, 0)
      const predictedWinRate = totalPredicted / pointsInBucket.length
      const wins = pointsInBucket.filter(p => p.won).length
      const observedWinRate = wins / pointsInBucket.length

      buckets.push({ minProb, maxProb, predictedWinRate, observedWinRate, count: pointsInBucket.length })
    }
  }

  return buckets
}

/**
 * Expected Calibration Error: count-weighted mean gap between predicted and
 * observed win rate across the calibration buckets.
 */
export function computeExpectedCalibrationError(
  matches: MatchAnalysis[],
  numBuckets: number = defaultCalibrationBucketCount(matches.length),
): number {
  const buckets = computeCalibrationBuckets(matches, numBuckets)
  const total = buckets.reduce((sum, b) => sum + b.count, 0)
  if (total === 0) return 0
  return buckets.reduce(
    (sum, b) => sum + (b.count / total) * Math.abs(b.predictedWinRate - b.observedWinRate),
    0,
  )
}

export interface PlayerStats {
  player: PlayerName
  expectedWins: number
  actualWins: number
  totalMatches: number
}

/**
 * Per-player expected-vs-actual wins. (Moved verbatim from PlayerCalibrationCard.)
 * Players with <= `minMatches` games are dropped as too noisy to read.
 */
export function computePlayerStats(
  matches: MatchAnalysis[],
  minMatches = 5,
): PlayerStats[] {
  const playerData = new Map<
    PlayerName,
    { expectedWins: number; actualWins: number; totalMatches: number }
  >()

  const ensure = (player: PlayerName) => {
    if (!playerData.has(player)) {
      playerData.set(player, { expectedWins: 0, actualWins: 0, totalMatches: 0 })
    }
    return playerData.get(player)!
  }

  for (const match of matches) {
    for (const player of match.winTeam) {
      const data = ensure(player)
      data.expectedWins += match.expectedWinProbability
      data.actualWins += 1
      data.totalMatches += 1
    }
    for (const player of match.loseTeam) {
      const data = ensure(player)
      data.expectedWins += 1 - match.expectedWinProbability
      data.actualWins += 0
      data.totalMatches += 1
    }
  }

  return Array.from(playerData.entries())
    .map(([player, data]) => ({ player, ...data }))
    .sort((a, b) => a.player.localeCompare(b.player))
    .filter(stats => stats.totalMatches > minMatches)
}

export function computeRelativeDifference(expected: number, actual: number): number {
  if (actual === 0) return expected === 0 ? 0 : NaN
  return ((expected - actual) / actual) * 100
}

export function formatRelativeDiff(diff: number): string {
  if (!Number.isFinite(diff)) return '—'
  return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`
}
