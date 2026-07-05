import { describe, it, beforeAll } from 'vitest'
import type { Match } from '../engine/types'
import { loadEvalMatches } from './data'
import { runSplitEval } from './harness'
import { candidates } from './configs'

/**
 * Robust objective: mean held-out log loss across several train/test splits.
 * A config that only wins at one split is overfit; one that wins the average is
 * a real improvement. Run: npx vitest run src/eval/multisplit.test.ts
 */
const SPLITS = [0.7, 0.75, 0.8, 0.85]
const minGames = process.env.EVAL_MIN_GAMES ? Number(process.env.EVAL_MIN_GAMES) : 5

let matches: Match[]
beforeAll(async () => {
  matches = (await loadEvalMatches('both', false)).matches
}, 30_000)

describe('multi-split robustness', () => {
  it('ranks configs by mean held-out log loss across splits', () => {
    const realLog = console.log
    console.log = () => {}
    let scoredTest = 0
    const rows = candidates.map(({ name, config }) => {
      const reps = SPLITS.map(s => runSplitEval(matches, config, s, name, minGames))
      const losses = reps.map(r => r.test.summary.avgLogLoss)
      const mean = losses.reduce((a, b) => a + b, 0) / losses.length
      const meanTrain = reps.reduce((a, b) => a + b.train.summary.avgLogLoss, 0) / reps.length
      scoredTest = Math.round(reps.reduce((a, b) => a + b.scoredTest, 0) / reps.length)
      return { name, mean, meanTrain, losses }
    })
    console.log = realLog

    rows.sort((a, b) => a.mean - b.mean)
    console.log(`\n=== mean held-out log loss across splits ${JSON.stringify(SPLITS)}` +
      (minGames > 0 ? ` · filter ≥${minGames} prior games (~${scoredTest} test matches/split)` : '') + ' ===')
    console.log('  rank  config          mean_test  mean_train   per-split test')
    rows.forEach((r, i) => {
      const per = r.losses.map(l => l.toFixed(4)).join(' ')
      console.log(
        `  ${String(i + 1).padStart(4)}  ${r.name.padEnd(14)}  ${r.mean.toFixed(4)}     ${r.meanTrain.toFixed(4)}      ${per}`,
      )
    })
    console.log('')
  })
})
