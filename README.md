# dreamDEX Perps Builder Bounty — feedback

This repository contains one offline reproduction of a bot-kit behavior in the Feedback track. DreamDEX Security requested the Feedback route after reviewing a private email; they classified it as a product or documentation issue, not a security vulnerability.

| Item | Area | Status |
| --- | --- | --- |
| [Existing short receives long-side exits in `perp-starter`](feedback/perp-starter-existing-short-side.md) | app / bot-kit | Local reproduction; public overlap disclosed |

The public [PhiBao feedback item #006](https://github.com/PhiBao/dreamdex-perps-feedback/blob/main/feedback/006-perp-starter-existing-side.md) describes the same root cause and fix and predates this report. The tests here add a concrete bracket and watched-exit A/B, but this is **not a novel vulnerability claim**. Acceptance, duplicate treatment, and any reward are DreamDEX's decisions.

## Reproduce

Prerequisites: Git, Node.js 20+, npm. The commands below use PowerShell.

```powershell
git clone https://github.com/somnia-chain/dreamdex-bot-kit.git upstream
git -C upstream checkout 25798660bbe4674a6f83a960b202852896e2fed4
New-Item -ItemType Directory -Force -Path upstream/strategies/perp-starter/tests | Out-Null
Copy-Item -LiteralPath repro/existing-side-bracket.probe.test.ts -Destination upstream/strategies/perp-starter/tests/
Copy-Item -LiteralPath repro/existing-side-watched-exit.probe.test.ts -Destination upstream/strategies/perp-starter/tests/
Set-Location upstream
npm ci
npm exec -- vitest run strategies/perp-starter/tests/existing-side-bracket.probe.test.ts strategies/perp-starter/tests/existing-side-watched-exit.probe.test.ts --reporter=verbose
npm run typecheck -w perp-starter
```

The two probes assert the **current defect**, so 5/5 passing means it was reproduced on the pinned commit; the tests are not fix-validation tests. The local rerun on 27 October 2026 produced 5/5 passing cases and a passing strategy typecheck; [results](repro/TEST-RESULTS.md) are included. No wallet, RPC, live trade, or financial loss was involved. See the [report](feedback/perp-starter-existing-short-side.md) for expected and actual behavior.

The two original probe files and this write-up are shared under the MIT license. The upstream bot kit remains under its own MIT license and is fetched separately.
