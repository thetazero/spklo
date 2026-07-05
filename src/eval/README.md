# Offline model eval

Tune the Elo model on the first 80% of matches and score it on the held-out last
20% — entirely in Node, no dev/preview server. Everything the Stats page shows is
computed here from the same code (`metrics.ts`), plus extra metrics.

## Run it

```bash
npm run eval            # both datasets (cached), 80/20 split, full report + leaderboard
npm run eval:refresh    # re-pull the live Google Sheet, then eval
npm run eval:watch      # re-run on save while iterating

EVAL_DATASET=old npm run eval    # local matches.json only (fully offline/reproducible)
EVAL_SPLIT=0.7 npm run eval      # change the train/test boundary
```

## How to iterate the model

1. Open `configs.ts` and add a candidate: `withOverrides('my-idea', { normalK: 12, pairwiseFactor: 0.4 })`.
2. `npm run eval` — read the **CONFIG COMPARISON** leaderboard, sorted by held-out
   **test log loss** (lower is better). `baseline` is always the shipped config.
3. When a candidate beats baseline on test loss *without* overfitting (watch the
   train-vs-test gap), promote it into `DEFAULT_ENGINE_CONFIG` in `src/engine/main.ts`.

## What's measured

Reported separately for **train** (first 80%), **test** (held-out last 20%), and overall:

- **avg log loss** (a.k.a. BCE / cross-entropy) — the headline number to minimize.
- **skill score** — `1 − avgLogLoss / ln(2)`; 0% = coin flip, 100% = perfect.
- **implied win probability**, **accuracy**, **Brier score**, **calibration error (ECE)**.
- **calibration table** — predicted vs. observed win rate per probability bucket.
- **per-player calibration** — expected vs. actual wins per player.

## Why this is a fair held-out test

The model is online: it keeps learning on every match. The eval is **prequential** —
each test prediction was recorded *before* that match's own outcome updated the
ratings (`MatchAnalysis.expectedWinProbability`), so the last-20% numbers are genuinely
out-of-sample even though the ratings keep moving. This mirrors exactly how the live
app scores itself, just partitioned into a warm-up set and a held-out set.

## Data

`data.ts` mirrors the app's `DatasetType.BOTH` (local `matches.json` + the live sheet)
but caches the combined set to `src/data/.eval-cache.json` (gitignored) so repeated
tuning runs see identical data. `npm run eval:refresh` re-pulls the sheet.
