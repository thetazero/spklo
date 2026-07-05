import type { Match } from '../engine/types'
import { Engine, type EngineConfig, type MatchAnalysis } from '../engine/main'
import {
  computeSummaryStats,
  computeCalibrationBuckets,
  computePlayerStats,
  type SummaryStats,
  type CalibrationBucket,
  type PlayerStats,
} from './metrics'

export interface SplitMetrics {
  summary: SummaryStats
  calibration: CalibrationBucket[]
  players: PlayerStats[]
}

export interface EvalReport {
  name: string
  splitRatio: number
  splitIndex: number
  totalMatches: number
  /** Experience filter: a match is only *scored* if every player had at least
   * this many games before it. 0 = score everything. The model still trains on
   * every match regardless — this only changes which matches count toward metrics. */
  minGames: number
  /** How many matches actually got scored after the experience filter. */
  scoredTrain: number
  scoredTest: number
  /** Metrics over the first `splitRatio` of matches (the tuning/warm-up set). */
  train: SplitMetrics
  /** Metrics over the held-out last `1 - splitRatio` of matches. Optimize this. */
  test: SplitMetrics
  /** Metrics over the full dataset (what the live Stats page currently shows). */
  overall: SplitMetrics
}

/**
 * For each match, the fewest prior games any of its four players had going in
 * (prequential). A match with a debutant scores 0. Config-independent, so it is
 * computed once from the raw match order.
 */
export function computeMinPriorGames(matches: Match[]): number[] {
  const seen = new Map<string, number>()
  return matches.map(m => {
    const players = [...m.winner, ...m.loser]
    const minPrior = Math.min(...players.map(p => seen.get(p) ?? 0))
    for (const p of players) seen.set(p, (seen.get(p) ?? 0) + 1)
    return minPrior
  })
}

function metricsFor(matches: MatchAnalysis[]): SplitMetrics {
  return {
    summary: computeSummaryStats(matches),
    calibration: computeCalibrationBuckets(matches),
    players: computePlayerStats(matches),
  }
}

/**
 * Run the engine over all matches in chronological order, then score the tuning
 * split (first `splitRatio`) and the held-out split (the rest) separately.
 *
 * The model still updates on every match — the test slice is *prequential*: each
 * test prediction was made before its own outcome was seen, so it is genuinely
 * out-of-sample even though the ratings keep learning. This mirrors exactly how
 * the live app scores itself, just partitioned into train vs. held-out.
 */
export function runSplitEval(
  matches: Match[],
  config: EngineConfig,
  splitRatio = 0.8,
  name = 'model',
  minGames = 0,
): EvalReport {
  const engine = new Engine(config)
  // The engine emits per-seed debug lines via console.log; silence them for the
  // batch run (we score many configs) and restore afterwards so the report prints.
  const realLog = console.log
  console.log = () => {}
  let analyzed: MatchAnalysis[]
  try {
    analyzed = matches.map(m => engine.analyzeMatch(m))
  } finally {
    console.log = realLog
  }

  const splitIndex = Math.floor(matches.length * splitRatio)
  // Score only matches where every player already had >= minGames prior games.
  // The model still learned from all of them; we just don't grade the ones whose
  // ratings hadn't converged (debuts, near-debuts) — that's rating noise, not skill.
  const minPrior = computeMinPriorGames(matches)
  const scored = (i: number) => minPrior[i] >= minGames

  const trainMatches = analyzed.filter((_, i) => i < splitIndex && scored(i))
  const testMatches = analyzed.filter((_, i) => i >= splitIndex && scored(i))
  const overallMatches = minGames > 0 ? analyzed.filter((_, i) => scored(i)) : analyzed

  return {
    name,
    splitRatio,
    splitIndex,
    totalMatches: matches.length,
    minGames,
    scoredTrain: trainMatches.length,
    scoredTest: testMatches.length,
    train: metricsFor(trainMatches),
    test: metricsFor(testMatches),
    overall: metricsFor(overallMatches),
  }
}

export interface NamedConfig {
  name: string
  config: EngineConfig
}

/** Run several configs over the same split and sort by held-out log loss (best first). */
export function compareConfigs(
  matches: Match[],
  configs: NamedConfig[],
  splitRatio = 0.8,
  minGames = 0,
): EvalReport[] {
  return configs
    .map(({ name, config }) => runSplitEval(matches, config, splitRatio, name, minGames))
    .sort((a, b) => a.test.summary.avgLogLoss - b.test.summary.avgLogLoss)
}
