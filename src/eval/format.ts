import { BASELINE_LOG_LOSS, type SummaryStats, type CalibrationBucket, type PlayerStats } from './metrics'
import { formatRelativeDiff, computeRelativeDifference, defaultCalibrationBucketCount } from './metrics'
import type { EvalReport, SplitMetrics } from './harness'

const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`

function summaryLines(s: SummaryStats): string[] {
  return [
    `  matches ............. ${s.totalMatches}`,
    `  avg log loss ........ ${s.avgLogLoss.toFixed(4)}   (baseline ${BASELINE_LOG_LOSS.toFixed(4)})`,
    `  total log loss ...... ${s.totalLogLoss.toFixed(2)}`,
    `  skill score ......... ${pct(s.skillScore)}   (0% = coin flip, 100% = perfect)`,
    `  implied win prob .... ${pct(s.impliedWinProbability, 2)}`,
    `  accuracy ............ ${pct(s.accuracy)}`,
    `  brier ............... ${s.brier.toFixed(4)}`,
    `  calibration err ..... ${pct(s.ece, 2)}   (${defaultCalibrationBucketCount(s.totalMatches)} buckets)`,
  ]
}

function calibrationTable(buckets: CalibrationBucket[]): string[] {
  const lines = ['  range      predicted  observed   diff     n']
  for (const b of buckets) {
    const range = `${(b.minProb * 100).toFixed(0)}-${(b.maxProb * 100).toFixed(0)}%`.padEnd(9)
    const diff = computeRelativeDifference(b.predictedWinRate, b.observedWinRate)
    lines.push(
      `  ${range}  ${pct(b.predictedWinRate).padStart(8)}  ${pct(b.observedWinRate).padStart(8)}  ${formatRelativeDiff(diff).padStart(7)}  ${String(b.count).padStart(4)}`,
    )
  }
  return lines
}

function playerTable(players: PlayerStats[]): string[] {
  const lines = ['  player        exp wins  act wins   diff     n']
  for (const p of players) {
    const diff = computeRelativeDifference(p.expectedWins, p.actualWins)
    lines.push(
      `  ${p.player.padEnd(12)}  ${p.expectedWins.toFixed(1).padStart(8)}  ${String(p.actualWins).padStart(8)}  ${formatRelativeDiff(diff).padStart(7)}  ${String(p.totalMatches).padStart(4)}`,
    )
  }
  return lines
}

function splitBlock(title: string, split: SplitMetrics, verbose: boolean): string[] {
  const lines = [`${title}:`, ...summaryLines(split.summary)]
  if (verbose) {
    lines.push('', '  — calibration —', ...calibrationTable(split.calibration))
    lines.push('', '  — per-player calibration —', ...playerTable(split.players))
  }
  return lines
}

/** Full human-readable report for a single config, train vs. held-out test. */
export function formatReport(report: EvalReport, verbose = true): string {
  const heldOut = report.totalMatches - report.splitIndex
  const header = [
    '='.repeat(64),
    `  ${report.name}`,
    `  split ${pct(report.splitRatio, 0)} → train ${report.splitIndex} / test ${heldOut} of ${report.totalMatches} matches`,
    '='.repeat(64),
  ]
  return [
    ...header,
    '',
    ...splitBlock('TRAIN (first ' + pct(report.splitRatio, 0) + ')', report.train, verbose),
    '',
    ...splitBlock('TEST (held-out last ' + pct(1 - report.splitRatio, 0) + ')  ← optimize this', report.test, verbose),
    '',
  ].join('\n')
}

/** One-line-per-config leaderboard, assumed already sorted best-first. */
export function formatComparison(reports: EvalReport[]): string {
  const lines = [
    '='.repeat(90),
    '  CONFIG COMPARISON (sorted by held-out test log loss, best first)',
    '='.repeat(90),
    '  rank  config                    test loss  test brier  test acc  test skill  train loss',
    '  ' + '-'.repeat(86),
  ]
  reports.forEach((r, i) => {
    const t = r.test.summary
    lines.push(
      `  ${String(i + 1).padStart(4)}  ${r.name.padEnd(24)}  ${t.avgLogLoss.toFixed(4).padStart(9)}  ${t.brier.toFixed(4).padStart(10)}  ${(t.accuracy * 100).toFixed(1).padStart(7)}%  ${(t.skillScore * 100).toFixed(1).padStart(9)}%  ${r.train.summary.avgLogLoss.toFixed(4).padStart(10)}`,
    )
  })
  lines.push('='.repeat(90))
  return lines.join('\n')
}
