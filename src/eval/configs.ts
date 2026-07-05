import { DEFAULT_ENGINE_CONFIG, type EngineConfig } from '../engine/main'
import type { NamedConfig } from './harness'

/**
 * The configs to evaluate. Edit this list to iterate the model:
 *   1. tweak a copy of the baseline (K factors, pairwiseFactor, seeds, …),
 *   2. run `npm run eval`,
 *   3. read the leaderboard — lowest held-out test log loss wins,
 *   4. promote the winner into DEFAULT_ENGINE_CONFIG in src/engine/main.ts.
 *
 * `baseline` is always the live production config, so every candidate is scored
 * against what the app currently ships.
 */

export const baseline: NamedConfig = {
  name: 'baseline (production)',
  config: DEFAULT_ENGINE_CONFIG,
}

const withOverrides = (name: string, overrides: Partial<EngineConfig>): NamedConfig => ({
  name,
  config: { ...DEFAULT_ENGINE_CONFIG, ...overrides },
})

export const candidates: NamedConfig[] = [
  baseline,
  // --- example sweeps; keep, edit, or delete freely ---
  withOverrides('normalK=8', { normalK: 8 }),
  withOverrides('normalK=12', { normalK: 12 }),
  withOverrides('pairwise=0.3', { pairwiseFactor: 0.3 }),
  withOverrides('pairwise=0', { pairwiseFactor: 0 }),
  withOverrides('highK=60', { highK: 60 }),
  withOverrides('highK=100', { highK: 100 }),
]
