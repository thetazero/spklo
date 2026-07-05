import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { Match } from '../engine/types'
import { parseMatchesJson, parseMatchesCsv, new_matches_url } from '../data/load'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = join(here, '..', 'data')
const OLD_JSON = join(dataDir, 'matches.json')
// Reproducible snapshot of old + live-sheet matches, so tuning is deterministic
// across runs. Gitignored; refresh with `npm run eval:refresh`.
const CACHE = join(dataDir, '.eval-cache.json')

export type EvalDataset = 'old' | 'both'

interface CachedMatch { win: [string, string]; lose: [string, string] }

function toCacheRecords(matches: Match[]): CachedMatch[] {
  return matches.map(m => ({
    win: Array.from(m.winner) as [string, string],
    lose: Array.from(m.loser) as [string, string],
  }))
}

function fromCacheRecords(records: CachedMatch[]): Match[] {
  return records.map(r => ({
    winner: new Set(r.win),
    loser: new Set(r.lose),
  }))
}

function loadOld(): Match[] {
  return parseMatchesJson(JSON.parse(readFileSync(OLD_JSON, 'utf8')))
}

async function fetchNew(): Promise<Match[]> {
  const res = await fetch(new_matches_url)
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`)
  return parseMatchesCsv(await res.text())
}

/**
 * Load matches for the eval, mirroring the app's `DatasetType.BOTH` (old JSON +
 * live Google Sheet), but deterministically:
 *
 *   - `old`  → local matches.json only (always offline, fully reproducible).
 *   - `both` → old + live sheet. Cached to `.eval-cache.json` on first fetch so
 *              repeated tuning runs see identical data. Pass `refresh` to re-pull.
 *
 * If a `both` refresh has no network, it falls back to any existing cache, then
 * to old-only, so the harness never hard-fails offline.
 */
export async function loadEvalMatches(
  dataset: EvalDataset = 'both',
  refresh = false,
): Promise<{ matches: Match[]; source: string }> {
  const old = loadOld()
  if (dataset === 'old') return { matches: old, source: 'old (local)' }

  if (!refresh && existsSync(CACHE)) {
    const cached = fromCacheRecords(JSON.parse(readFileSync(CACHE, 'utf8')))
    return { matches: cached, source: `cache (${CACHE})` }
  }

  try {
    const fresh = old.concat(await fetchNew())
    writeFileSync(CACHE, JSON.stringify(toCacheRecords(fresh)))
    return { matches: fresh, source: 'old + live sheet (fetched, cached)' }
  } catch (err) {
    if (existsSync(CACHE)) {
      const cached = fromCacheRecords(JSON.parse(readFileSync(CACHE, 'utf8')))
      return { matches: cached, source: `cache — refresh failed (${(err as Error).message})` }
    }
    return { matches: old, source: `old only — sheet unavailable (${(err as Error).message})` }
  }
}
