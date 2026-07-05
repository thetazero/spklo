import { describe, it, expect, beforeAll } from 'vitest'
import type { Match } from '../engine/types'
import { loadEvalMatches, type EvalDataset } from './data'
import { runSplitEval, compareConfigs } from './harness'
import { formatReport, formatComparison } from './format'
import { baseline, candidates } from './configs'
import {
  computeSummaryStats,
  defaultCalibrationBucketCount,
  computeRelativeDifference,
  formatRelativeDiff,
  BASELINE_LOG_LOSS,
} from './metrics'
import type { MatchAnalysis } from '../engine/main'

/**
 * The offline eval. Run it with:
 *
 *   npm run eval            # both datasets (cached), 80/20 split, full report
 *   npm run eval:refresh    # re-pull the live sheet, then eval
 *   EVAL_DATASET=old npm run eval
 *   EVAL_SPLIT=0.7 npm run eval
 *
 * No preview/dev server required — everything runs in Node via vitest.
 */

const dataset = (process.env.EVAL_DATASET as EvalDataset) || 'both'
const splitRatio = process.env.EVAL_SPLIT ? Number(process.env.EVAL_SPLIT) : 0.8
const minGames = process.env.EVAL_MIN_GAMES ? Number(process.env.EVAL_MIN_GAMES) : 0
const refresh = process.env.EVAL_REFRESH === '1'

let matches: Match[]

beforeAll(async () => {
  const loaded = await loadEvalMatches(dataset, refresh)
  matches = loaded.matches
  console.log(`\nloaded ${matches.length} matches — source: ${loaded.source}\n`)
}, 30_000)

describe('eval report', () => {
  it('prints the baseline train/test report and the config leaderboard', () => {
    const report = runSplitEval(matches, baseline.config, splitRatio, baseline.name, minGames)
    console.log('\n' + formatReport(report, true))

    const leaderboard = compareConfigs(matches, candidates, splitRatio, minGames)
    console.log('\n' + formatComparison(leaderboard) + '\n')

    // Sanity: the held-out slice is non-empty and metrics are finite.
    expect(report.test.summary.totalMatches).toBeGreaterThan(0)
    expect(Number.isFinite(report.test.summary.avgLogLoss)).toBe(true)
  })

  it('beats a coin-flip baseline on the training split', () => {
    const report = runSplitEval(matches, baseline.config, splitRatio, baseline.name)
    // If the model can't even fit the data it was tuned on, something is wrong.
    expect(report.train.summary.avgLogLoss).toBeLessThan(BASELINE_LOG_LOSS)
    expect(report.train.summary.skillScore).toBeGreaterThan(0)
  })
})

describe('metric math', () => {
  const mk = (p: number): MatchAnalysis =>
    ({ expectedWinProbability: p, winTeam: new Set(['A']), loseTeam: new Set(['B']) }) as unknown as MatchAnalysis

  it('computes log loss, accuracy and brier from known inputs', () => {
    const s = computeSummaryStats([mk(0.5), mk(0.5)])
    expect(s.avgLogLoss).toBeCloseTo(BASELINE_LOG_LOSS, 10)
    expect(s.accuracy).toBe(0.5) // p === 0.5 counts as half
    expect(s.brier).toBeCloseTo(0.25, 10)
    expect(s.skillScore).toBeCloseTo(0, 10)
  })

  it('rewards confident correct predictions', () => {
    const s = computeSummaryStats([mk(0.9), mk(0.8)])
    expect(s.accuracy).toBe(1)
    expect(s.avgLogLoss).toBeLessThan(BASELINE_LOG_LOSS)
    expect(s.impliedWinProbability).toBeGreaterThan(0.8)
  })

  it('reports an empty slice as all-zero rather than NaN', () => {
    const s = computeSummaryStats([])
    expect(s.totalMatches).toBe(0)
    expect(Number.isNaN(s.avgLogLoss)).toBe(false)
  })

  it('scales calibration buckets with sample size (~25 datapoints per bucket)', () => {
    expect(defaultCalibrationBucketCount(0)).toBe(2) // floor
    expect(defaultCalibrationBucketCount(30)).toBe(2) // 60 datapoints
    expect(defaultCalibrationBucketCount(60)).toBe(4) // 120 datapoints
    expect(defaultCalibrationBucketCount(240)).toBe(10) // ceiling
  })

  it('reports relative difference against zero actual as n/a, not Infinity', () => {
    expect(computeRelativeDifference(0, 0)).toBe(0)
    expect(Number.isNaN(computeRelativeDifference(3, 0))).toBe(true)
    expect(formatRelativeDiff(computeRelativeDifference(3, 0))).toBe('—')
    expect(formatRelativeDiff(computeRelativeDifference(6, 4))).toBe('+50.0%')
  })
})
