# Local reproduction results — 27 October 2026

Pinned `somnia-chain/dreamdex-bot-kit` commit: `25798660bbe4674a6f83a960b202852896e2fed4`.
This was also the public `main` head when checked on 27 October 2026.

`npm ci --no-audit --no-fund` completed; its `postinstall` built core and backtest. Then:

```text
> npm exec -- vitest run strategies/perp-starter/tests/existing-side-bracket.probe.test.ts strategies/perp-starter/tests/existing-side-watched-exit.probe.test.ts --reporter=verbose

✓ watched exit: existing long, mark 99
✓ watched exit: existing short, mark 101
✓ watched exit: existing short, mark 102
✓ bracket: existing long, PERP_SIDE=long
✓ bracket: existing short, PERP_SIDE=long

Test Files  2 passed (2)
Tests       5 passed (5)

> npm run typecheck -w perp-starter
> tsc --noEmit
Exit code 0
```

The cases assert the current behavior, including the defect. Passing is not evidence of a fixed implementation. The exchange, addresses, positions, and marks are synthetic; no network request or trade was made.
