# Iteration 7D — automated production and accessibility acceptance

## Updated scope and baseline

Accepted `main`: `2bc38927843303de135ff187f42142163fbe7abe`. Existing draft PR [#16](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/pull/16), branch `feature/iteration-7d-manual-acceptance`, original head `d603ba3212c4267d4c1dd2be33a94d7f05edd7a4`. The owner superseded the original manual acceptance scope with **automated-only acceptance**. The original commit is preserved; no history is rewritten.

Production target: [decentralized-crowdfunding-dapp.vercel.app](https://decentralized-crowdfunding-dapp.vercel.app). Production implementation, CSS, Solidity/ABI/address, existing tests/workflows and Vercel/RPC configuration remain frozen. New scope covers dedicated tests/configuration/workflow, this report, scope qualifications in [the optional manual reference](manual-acceptance-7d.md), and one accessibility development dependency with its lockfile. No manual testing is requested from the owner.

**Completion decision: automated 7D remains incomplete: six hosted axe scans failed on production accessibility violations.** A discovered application violation remains a failing assertion and a follow-up finding; it is not fixed or excluded in this iteration. Significant failed/blocked automated checks prevent automated completion. Physical devices, actual spoken screen-reader output, real MetaMask behavior and formal security acceptance are outside the updated completion criteria and remain unverified, never Passed by inference.

## Test architecture and safety

- [Dedicated suite](../../web/acceptance/automated-7d.spec.ts), outside the existing `web/tests` discovery directory, preserves the accepted 127-scenario regression count.
- [Dedicated configuration](../../web/playwright.acceptance-7d.config.ts) has no local mock server or fallback target; it uses the real production origin, zero retries, stable app/data/font/layout checks, retained failure traces, screenshots and JSON evidence under ignored `web/test-results/acceptance-7d/`.
- [Dedicated workflow](../../.github/workflows/automated-acceptance-7d.yml) runs independent Windows/Google Chrome and Linux/Chromium jobs on PRs to main and manual dispatch; Node 22 and locked npm dependencies, read-only repository permissions, no secrets, failure exit codes preserved, artifacts retained 14 days. `if: always()` applies only to evidence upload. Existing Firefox/WebKit/Chromium workflows remain unchanged.
- `@axe-core/playwright` **4.14.0** is the only new direct dev dependency; its `axe-core` **4.14.0** dependency shares existing `playwright-core` **1.64.1**. No Playwright/package upgrades or extra test/state-management libraries. Type checking and discovery verify integration; actual scan runtime requires successful page access.

The suite discovers **26 project executions**: **6 Windows Chrome** (five routes plus keyboard) and **20 Linux Chromium** (six axe/default-invalid-form scans, ten reflow cases, two touch contexts, keyboard and reduced motion). Discovery is not a pass count. No redundant full original suite runs inside the new jobs. Existing workflows provide their own regression coverage.

A disconnected injected-provider sentinel records calls and rejects non-read interaction; it does not connect to an extension. Browser traffic is observed without replacing read responses. Forbidden account-permission, signing, network-switch and transaction methods are recorded, blocked before forwarding and asserted absent. The reference viem client uses only `getChainId`/`readContract` against the public Sepolia endpoint, without a signer, secret or write method. Invalid-form testing keeps required fields invalid; no valid creation is submitted.

## Coverage and verification boundaries

| Category | New automated checks | Boundary |
| --- | --- | --- |
| Production smoke | `/`, `/campaigns`, `/campaigns/1`, `/campaigns/2`, `/create`; document success, public read readiness, unique main/banner/footer/headline, navigation, first Tab, financial/progress readability, duplicate-free listing, scrolling, clipping and hit testing | Actual deployed site, no fake read response or assumed future campaign count/timestamp |
| Chain/status/financial reconciliation | Campaign #1/#2 title, creator, status, historical raised/goal and remaining compared with independent current contract reads; Sepolia chain ID checked; #2 withdrawal flag/status/message and absent Withdraw button | A reference RPC failure is evidence of failed/blocked verification, never a fabricated zero/success; no withdrawal/replay |
| Context | Full contract address / chain 11155111 banner on public browsing routes; `SEPOLIA CAMPAIGN` on create | Existing create form has the Sepolia label, not the full browsing banner; tests do not invent that banner |
| Reflow | Production listing, Campaign #2 and create at 320, 375, 390, 700, 768, 869, 981, 1100, 1280, 1440 CSS px, height 900 | New production-based subset rather than duplicating the 57 mocked cases. Narrow viewport equivalence only; **actual browser zoom not exercised** |
| Touch/mobile emulation | 390×844 portrait and 844×390 landscape, `isMobile` and `hasTouch`, navigation tap, details/address/form layout and scrolling | Emulated browser contexts, not Android/iOS hardware, on-screen keyboard or real mobile browser-interface movement |
| Axe scans | Full-page WCAG 2 A/AA, 2.1 A/AA and 2.2 AA tags on all five routes plus invalid-form recovery; no rule/element exclusions | Automatically detectable violations only; all violations fail. Incomplete checks are retained for review, not called passes |
| Keyboard/semantics | First Tab/skip link, Enter to main and next back link/form control, header/form forward/reverse order and outlines; named progress bounds/exact ETH text; live read status and absent error on successful loads; labels/descriptions/invalid fields/recovery | Actual browser keyboard automation, not a real-keyboard or spoken session. Accepted mocked tests separately cover alert/empty/recovery semantics not necessarily encountered on production |
| Reduced motion / contrast | Emulated reduced-motion preference; full axe color-contrast results, including measured data where axe can resolve colors | No complete WCAG conformance, all-state visual audit or spoken screen-reader compatibility claim |

Text-line bounds are checked against the viewport and clipping ancestors, with 1.5 CSS-pixel subpixel tolerance. Document overflow tolerance is 1 CSS pixel. Controls are scrolled into view before hit testing; below-the-fold content is allowed. Read failures and uncaught page errors remain failures with screenshots/trace/network diagnostics. No test clicks Connect Wallet or financial controls; layout inspection does not activate them.

## Execution environments and commands

Local environment: Debian 13, Node 24.19.0, npm 11.9.0, system Chromium 154.0.8037.57, Playwright 1.64.1. Production access via the managed proxy returned **HTTP 403** (`CONNECT tunnel failed`). A selected real-production Playwright axe-homepage execution reported **1 failed, 0 passed**, at navigation with `net::ERR_TUNNEL_CONNECTION_FAILED`; **no axe rules ran**. This is an infrastructure access blocker, not a measured application violation. No network policy/TLS restriction was bypassed, and no fake/local page replaced production.

Local commands (from `web/`):

```sh
npm ci --no-audit --no-fund
npm run typecheck
npm run build
npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium \
  PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/iteration7d-regression-chromium.json \
  npm run test:browser -- --browser chromium --reporter line,json
npx tsc --ignoreConfig --noEmit --target es2022 --module esnext \
  --moduleResolution bundler --skipLibCheck \
  acceptance/automated-7d.spec.ts playwright.acceptance-7d.config.ts
npx playwright test --config playwright.acceptance-7d.config.ts --list
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium \
  npx playwright test --config playwright.acceptance-7d.config.ts \
  --project linux-chromium --grep '@axe WCAG A/AA /$'
```

The first attempted standalone test typecheck requested missing `@types/node`; it was corrected to use the narrow environment declaration in the dedicated config without adding another dependency. The corrected typecheck passes. An initial dependency install ran at repository root; its generated files were removed before staging and the install rerun only in `web/`. Neither incident is an application finding.

Foundry tools were initially absent (`forge: command not found`). Foundry 1.5.0 and native solc 0.8.20 were installed under `/tmp/iteration7d-bin` and `/tmp/iteration7d-solc`, without changing dependency revisions/settings. Commands: `forge fmt --check`, `forge build`, `forge test -vvv` using `FOUNDRY_SOLC=/tmp/iteration7d-solc/solc-0.8.20`.

Hosted new-suite commands:

```sh
# windows-latest; installed real Google Chrome, channel: chrome
npx playwright install chrome
npx playwright test --config playwright.acceptance-7d.config.ts --project windows-chrome
# ubuntu-latest; Playwright Chromium, no Chrome executable override
npx playwright install --with-deps chromium
npx playwright test --config playwright.acceptance-7d.config.ts --project linux-chromium
```

Windows OS build and Chrome CDP `Browser.getVersion`, Linux OS/browser, Node/npm and Playwright versions are logged by the workflow. A hosted Windows Chrome run is automated Windows/browser evidence, not a session on the owner's physical computer. The first hosted execution used automation commit `03728af7d0704ff63ca119e19859d012bac34617` in [run 42173114375](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42173114375). Execution date: **6 November 2026, MYT (UTC+08:00)**. Linux tests ran approximately **14:14:16–14:15:04 MYT**; Windows tests completed at **14:15:45 MYT** (underlying job timestamps are UTC). Runtime environments:

- Windows Server 2025 Datacenter, **10.0.26100**, 64-bit; real Google Chrome channel, CDP product **Chrome/157.0.8103.39**; Node **22.23.4**, Playwright **1.64.1**, headless execution. This is hosted Windows evidence, not the owner's physical computer.
- Ubuntu **24.04.5 LTS**; Chromium **156.0.8078.4**; Node **22.23.4**, Playwright **1.64.1**, axe-core **4.14.0**. Axe scans used **1440×900**; reflow/touch viewports are listed above.

[Windows job/logs](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42173114375/job/127745308232) and [Linux job/logs](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42173114375/job/127745308630) were inspected. Both launched and reached the production pages: the Linux failures below are **application accessibility findings**, not browser-install or RPC failures.

## Results ledger

| Execution | Passed | Failed | Skipped | Classification |
| --- | --- | --- | --- | --- |
| Local selected production axe-homepage case | 0 | 1 | 0 | Infrastructure failure before page/scan; not an accessibility finding |
| Hosted Windows Google Chrome | **6** | **0** | **0** | Five actual production routes + keyboard passed |
| Hosted Linux Chromium | **14** | **6** | **0** | Six axe scans failed; reflow 10, touch 2, keyboard 1 and motion 1 passed |

Hosted total: **26 executed, 20 passed, 6 failed, 0 skipped**. Windows verified real public loading/navigation/scrolling/focus, current Campaign #1/#2 financial/status fields against independent Sepolia reads, and Campaign #2's Successful/withdrawn result and absent withdrawal button. Linux passed all ten production reflow cases and both touch orientations, plus keyboard and reduced motion. Invalid-field names/descriptions/recovery assertions completed before the invalid-form axe assertion failed. No complete axe scan passed, so accessibility acceptance is not closed.

Evidence: [Windows artifact](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42173114375/artifacts/13482260647) and [Linux artifact](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42173114375/artifacts/13481089302), uploaded successfully, expire **20 November 2026**. They contain JSON/full axe results, actual rendered screenshots and failure traces; no screenshot is committed. Example actual Linux failure file listed in logs: `artifacts/automated-7d--axe-WCAG-A-AA-campaigns-2-linux-chromium/test-failed-1.png`, alongside its trace. Complete job logs and artifact metadata were inspected; ZIP contents were not separately materialized locally. Latest documentation-head CI outcomes are recorded in PR #16, without attributing those later runs to this first evidence SHA. New-suite artifacts include per-test browser/viewport/URL and safety logs, document bounds, full axe/contrast results and actual screenshots; traces are retained on failure. Artifacts are time-limited runtime evidence, not tracked screenshots or permanent manual records.

## Existing regression results

Local locked installation, typecheck and build passed; **57 unit tests passed**, **127 Chromium scenarios passed (0 failed/skipped)**, and Foundry formatting/build plus **43 tests passed (0 failed/skipped)**. Initial hosted regression evidence on the same automation commit: [frontend run 42173114487](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42173114487) passed build, **57 unit tests** and **127 Chromium scenarios**; [Foundry run 42173114327](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42173114327) passed formatting/build and **43 tests**; [cross-browser run 42173114507](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42173114507) has **WebKit 57 passed** in inspected logs, Firefox installation was still pending at that initial evidence update. A subsequent unchanged-regression execution on documentation head `f375ef3282f5d07aee073c67f2ee992011681ba8`, [run 42173709829](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42173709829), completed independently: **Firefox 157.0 — 57 passed, 0 failed/skipped** ([job logs](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42173709829/job/127747214895)); **WebKit 27.2 — 57 passed, 0 failed/skipped** ([job logs](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42173709829/job/127747215380)). These are new hosted regression results, not inherited baseline counts. The earlier pending job is not retroactively declared passed. Accepted baseline counts (57 unit, 127 Chromium, 57 Firefox, 57 WebKit, 43 Foundry) are expectations, not substituted new execution results. Any locally blocked engines remain explicitly unexecuted; hosted runs provide separate results.

## Prior independent remote-browser reference

The owner supplied [the completed read-only production inspection](https://agent.tinyfish.ai/runs/17a1c33b-ade5-403e-a519-ba81b0b2933b), which observed successful public data loading, both campaign cards, navigation, scrolling and basic keyboard behavior. This is **independent remote-browser evidence supplied by the owner**, not a fresh replay by this agent, Windows Chrome physical-device acceptance or proof of an OS/browser version not supplied. No date, dimensions, screenshot path or unprovided measurement is invented. New production jobs must establish their own results; this reference does not turn blocked runs into passes.

## Findings, completion decision and remaining limits

### Confirmed finding: visible label / accessible name mismatch

Axe rule **`label-content-name-mismatch`**, impact **serious**, WCAG **2.5.3 (Label in Name)**, failed in all six scans (five default routes and invalid `/create` state). At **1440×900**, Linux Chromium **156.0.8078.4**, expected the accessible name to include the visible label; actual axe diagnostic: **“Text inside the element is not included in the accessible name.”** Shared header and footer brand links fail on every route. The homepage also fails for `.feature-cover-link`.

Actual selectors include `.header-inner > .brand[href="/"][aria-label="DeCen Crowdfund home"]`, its `.footer-inner` counterpart, and homepage `.feature-cover-link`. Reproduction: run the dedicated Linux project on production, wait for public data/fonts/layout, and execute the full tagged axe scan. The same shared-link violation appeared across all five routes and the invalid-form state; screenshots, node HTML/targets and traces are retained in the Linux artifact. This is reproducible automated evidence, not a speech-recognition or screen-reader session. Suggested follow-up: separately authorize a narrowly scoped review aligning these links' accessible names with their visible labels (including whether cover artwork is genuinely decorative), then rerun these unchanged assertions. No React/CSS/name correction or exclusion is made here.

### Measured contrast samples and unresolved axe checks

Axe returned no confirmed `color-contrast` violation, but its rule is partly **incomplete** on all scans; this is not an all-elements contrast pass. Reliable reported samples:

| Actual sample | Foreground / background | Reported ratio | Expected by axe | Interpretation |
| --- | --- | --- | --- | --- |
| Header white brand mark | `#ffffff` / `#2855c7` | **6.53:1** | 3:1 (23.3pt bold) | Sample meets reported threshold |
| Header brand text | `#17263c` / `#ffffff` | **15.22:1** | 3:1 (20.3pt bold) | Sample meets reported threshold |
| Small brand subtext / ordinary nav link | `#17263c` / `#ffffff` | **15.22:1** | 4.5:1 | Sample meets reported threshold |
| Active navigation link | `#2855c7` / `#ffffff` | **6.53:1** | 4.5:1 | Sample meets reported threshold |

Incomplete results include a short decorative brand character (`#f27660` / `#2855c7`, reported **2.34:1**, `shortTextContent`), symbol bullets (`nonBmp`) and footer short-text results without reliably resolved colors. These are retained for review, **not promoted to confirmed contrast defects or passes**. The listing scan also has an incomplete `aria-prohibited-attr` check; full node details remain in the axe artifact. No automatically detected violation is suppressed and no incomplete result is asserted to be a spoken/UI success.

The local production proxy blocker remains separate. Hosted production navigation/RPC/read checks succeeded; the failing acceptance gate is the confirmed label/name finding. Any violation must record engine/version, route/viewport, rule/selector, expected/actual, available contrast data and workflow screenshot/trace reference; repeatable code issues are proposed for a separate CSS/React follow-up, never fixed or suppressed here. Unresolved axe incomplete checks are identified separately from confirmed violations.

The optional manual checklist retains all 20 IDs and 25 device/route cells as **Not tested**. They no longer block automated-only 7D completion and are not requested from the owner. Actual physical Android/iOS/macOS sessions, spoken screen readers, real MetaMask recovery, genuine browser zoom (versus viewport equivalence), OS on-screen-keyboard behavior and formal security review remain unverified. Existing 6F live observations and 6A–7C history remain unchanged. Pending tracking remains page-session-only; receipt handling remains one confirmation without a comprehensive replacement/reorganization monitor.

**7D remains incomplete because six authorized accessibility scans failed.** If they all pass, automated acceptance can be reported complete subject to independent review, without closing the unverified categories above. PR #16 stays draft, open and unmerged, with no auto-merge or main modification.
