# Existing short receives long-side exits in `perp-starter`

Severity: normal (proposed; organizer decides)
Area: app / bot-kit example

## Steps to reproduce

1. Check out `somnia-chain/dreamdex-bot-kit` at commit `25798660bbe4674a6f83a960b202852896e2fed4` and install with `npm ci`.
2. Copy `repro/existing-side-bracket.probe.test.ts` and `repro/existing-side-watched-exit.probe.test.ts` from this repository into `strategies/perp-starter/tests/` in the bot-kit checkout.
3. Run `npm exec -- vitest run strategies/perp-starter/tests/existing-side-bracket.probe.test.ts strategies/perp-starter/tests/existing-side-watched-exit.probe.test.ts --reporter=verbose` and `npm run typecheck -w perp-starter`.

The probes import the actual strategy entry point and use a synthetic exchange. They set `PERP_SIDE=long` and compare an existing long control with an existing short. No wallet, network request, or transaction is used.

## Expected

When an existing short is adopted, its own side should determine closing direction and take-profit/stop-loss levels. At mark 100, a 2% TP and 1% SL should arm BUY reduce-only exits at 98 and 101. In watched-exit mode, a rise to 101 should trigger the 1% adverse-move close attempt.

## Actual

The strategy uses configured `PERP_SIDE=long` after recognizing the existing short. It arms SELL exits at 102 and 99. In watched-exit mode it makes no close attempt at 101 and attempts a close labeled `take-profit` only at 102. The existing-long control behaves as configured.

## Evidence

- 5/5 local probe cases passed on 24 October and again on 27 October 2026; the strategy typecheck also passed on 27 October. [Rerun summary](../repro/TEST-RESULTS.md). These tests assert the observed defect, so passing indicates reproduction, not a fix.
- `strategies/perp-starter/src/index.ts`: existing position detected around lines 121–124; exit levels use `SIDE` at lines 176–177; bracket receives `position: SIDE` at line 187; watched exits compare using `SIDE` at lines 224–225 in the pinned commit.
- The probes show strategy behavior only. No live/testnet stop trigger, fill, realized P&L, or financial loss was measured.

## Environment

- Repository: https://github.com/somnia-chain/dreamdex-bot-kit
- Commit: `25798660bbe4674a6f83a960b202852896e2fed4`
- Local Node 24 / Vitest 2.1.9, synthetic exchange; no external calls.

## Suggested correction

Derive `managedSide = existing?.side ?? SIDE` and use it for stop levels, `armBracket`, and watched-exit comparisons. Add an existing-short regression case with default `PERP_SIDE=long`.

## Prior public overlap

The public Feedback item [`PhiBao/dreamdex-perps-feedback` #006](https://github.com/PhiBao/dreamdex-perps-feedback/blob/main/feedback/006-perp-starter-existing-side.md), committed on 20 October 2026, describes the same root cause and correction. This reproduction adds local assertions but should not be presented as a novel finding. DreamDEX has not confirmed Feedback acceptance or a reward for this item.
