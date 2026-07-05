import { DEFAULT_ENGINE_CONFIG, type EngineConfig } from '../engine/main'
import type { NamedConfig } from './harness'

/**
 * Configs to evaluate.
 *   npm run eval                              (single 80/20 split, full report)
 *   npx vitest run src/eval/multisplit.test.ts  (robust mean over splits)
 * Both apply the experience filter by default (EVAL_MIN_GAMES=5) — they score
 * only matches where every player already had >=5 prior games, so tuning is not
 * dominated by unconverged-rating noise. Override with EVAL_MIN_GAMES=0 to score
 * everything. Then promote the winner into DEFAULT_ENGINE_CONFIG in
 * src/engine/main.ts.
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
  // meanReversion=0 recovers the previous production model (plain Elo).
  withOverrides('revert off (old prod)', { meanReversion: 0 }),
  withOverrides('revert 0.003', { meanReversion: 0.003 }),
  withOverrides('revert 0.0075', { meanReversion: 0.0075 }),
  withOverrides('revert 0.01', { meanReversion: 0.01 }),
]
