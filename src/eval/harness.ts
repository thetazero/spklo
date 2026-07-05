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
  /** Metrics over the first `splitRatio` of matches (the tuning/warm-up set). */
  train: SplitMetrics
  /** Metrics over the held-out last `1 - splitRatio` of matches. Optimize this. */
  test: SplitMetrics
  /** Metrics over the full dataset (what the live Stats page currently shows). */
  overall: SplitMetrics
}

function metricsFor(matches: MatchAnalysis[]): SplitMetrics {
  return {
    summary: computeSummaryStats(matches),
    calibration: computeCalibrationBuckets(matches, 5),
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
  const trainMatches = analyzed.slice(0, splitIndex)
  const testMatches = analyzed.slice(splitIndex)

  return {
    name,
    splitRatio,
    splitIndex,
    totalMatches: matches.length,
    train: metricsFor(trainMatches),
    test: metricsFor(testMatches),
    overall: metricsFor(analyzed),
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
): EvalReport[] {
  return configs
    .map(({ name, config }) => runSplitEval(matches, config, splitRatio, name))
    .sort((a, b) => a.test.summary.avgLogLoss - b.test.summary.avgLogLoss)
}
