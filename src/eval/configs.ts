import { DEFAULT_ENGINE_CONFIG, type EngineConfig } from '../engine/main'
import type { NamedConfig } from './harness'

/**
 * Configs to evaluate. Tune with the experience filter, which strips out
 * unconverged-rating noise (matches hinging on a player with few prior games):
 *   EVAL_MIN_GAMES=6 npm run eval
 *   EVAL_MIN_GAMES=6 npx vitest run src/eval/multisplit.test.ts   (robust mean)
 * Then promote the winner into DEFAULT_ENGINE_CONFIG in src/engine/main.ts.
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
  withOverrides('normalK=16', { normalK: 16 }),
  withOverrides('normalK=24', { normalK: 24 }),
  withOverrides('highK=60', { highK: 60 }),
  withOverrides('highK=100', { highK: 100 }),
  withOverrides('highKMatchCount=6', { highKMatchCount: 6 }),
  withOverrides('highKMatchCount=13', { highKMatchCount: 13 }),
]
