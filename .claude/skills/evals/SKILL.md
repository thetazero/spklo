---
name: evals
description: Run and iterate the offline Elo model eval (train on first 80% of matches, evaluate on held-out last 20%). Use when the user wants to tune the rating algorithm, compare EngineConfig hyperparameters, check model calibration/log-loss, or run `npm run eval`. Covers reading the report, adding candidate configs, and promoting a winner.
---

# Elo model evals

The Elo model is tuned offline via `src/eval/` — no dev/preview server. It trains on
the first 80% of matches (chronological) and scores the held-out last 20%. All metrics
come from `src/eval/metrics.ts`, the same code the Stats page uses.

## Running

From the project root:

```bash
npm run eval            # 80/20 split, full train/test report + config leaderboard
npm run eval:refresh    # re-pull the live Google Sheet first, then eval
npm run eval:watch      # re-run automatically on save while iterating
```

Env overrides:

- `EVAL_DATASET=old|both` — `both` (default) = local matches.json + live sheet; `old` = local only (fully offline, reproducible).
- `EVAL_SPLIT=0.8` — move the train/test boundary.

If the user just wants to see current numbers, run `npm run eval` and summarize the
**TEST (held-out)** block and the leaderboard for them.

## Iterating the model (the tuning loop)

1. Edit `src/eval/configs.ts` — add a candidate to the `candidates` array:
   ```ts
   withOverrides('normalK=12', { normalK: 12 }),
   ```
   `baseline` is always the shipped production config, so every candidate is scored against it.
2. Run `npm run eval`.
3. Read the **CONFIG COMPARISON** table (sorted by held-out **test log loss**, lower = better).
   Watch the train-vs-test gap — a candidate that only improves train loss is overfitting.
4. To ship a winner, copy its values into `DEFAULT_ENGINE_CONFIG` in `src/engine/main.ts`.

## What's reported

Separately for **train** (first 80%), **test** (held-out last 20%), and overall:

- **avg log loss** (BCE / cross-entropy) — headline metric to minimize.
- **skill score** — `1 − avgLogLoss / ln(2)`; 0% = coin flip, 100% = perfect.
- **implied win probability**, **accuracy**, **Brier score**, **calibration error (ECE)**.
- **calibration table** — predicted vs. observed win rate per probability bucket.
- **per-player calibration** — expected vs. actual wins per player.

## Key files

- `src/eval/configs.ts` — candidate configs to compare (edit this to iterate).
- `src/eval/metrics.ts` — all metric math; shared with the Stats-page UI components.
- `src/eval/harness.ts` — runs the prequential 80/20 split.
- `src/eval/data.ts` — loads + caches match data (`.eval-cache.json`, gitignored).
- `src/eval/eval.test.ts` — the vitest entry that prints the report.
- `src/engine/main.ts` — `DEFAULT_ENGINE_CONFIG`, where a tuned winner gets promoted.

## Notes

- Runs on the already-installed **vitest** (no extra deps). It's a test file, so it also
  guards the metric math with a few assertions.
- The eval is **prequential**: each held-out prediction was made before that match updated
  the ratings, so the last-20% numbers are genuinely out-of-sample even though the online
  model keeps learning. This mirrors how the live app scores itself.
