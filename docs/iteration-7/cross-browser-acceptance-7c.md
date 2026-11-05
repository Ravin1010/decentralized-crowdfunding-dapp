# Iteration 7C — cross-browser QA and accessibility acceptance

## Baseline and scope

Accepted `main`: `8e3675f3df7708a1cc75d291f816c29f00d336d7`. Branch: `feature/iteration-7c-cross-browser-acceptance`.

Only this report and [the new cross-browser workflow](../../.github/workflows/cross-browser-qa.yml) change. Application behavior/design, Solidity, ABI, dependencies, existing tests, Playwright configuration, Chromium CI and historical [7A](qa-7a.md)/[7B](focus-stability-7b.md) reports remain unchanged. No real wallet is connected, no permissions/signatures or public-chain transactions are requested, and no deployment or production configuration changes occur.

This is automated QA and an acceptance plan, **not comprehensive accessibility, security or production acceptance**. Mocked browser assertions, real-device tests, screen-reader tests and user-attested MetaMask observations have different evidence boundaries.

## Execution environment and local feasibility

Local execution: Debian GNU/Linux **13 (trixie)**, Node **24.19.0**, npm **11.9.0**, locked Playwright **1.64.1**. System Chromium **154.0.8037.57** is available. Foundry **1.5.0**, Solidity **0.8.20**. `npm ci --no-audit --no-fund` completed without changing dependencies or the lockfile.

The current managed environment's HTTP policy is restricted and enforced. Both browser downloads were attempted again using the inherited proxy/CA configuration, with the Chromium executable override removed:

```sh
cd web
env -u PLAYWRIGHT_CHROMIUM_EXECUTABLE \
  PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright npx playwright install firefox
env -u PLAYWRIGHT_CHROMIUM_EXECUTABLE \
  PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright npx playwright install webkit
```

Both commands exited **1** with `Download failed: server returned code 403 body 'Domain forbidden'`. Firefox targeted **157.0 / revision 1555**, WebKit **27.2 / revision 2370**, using the Debian 13 archives. These are **download target versions, not locally executed browser versions**. Requests to `cdn.playwright.dev` and the fallback `playwright.download.prss.microsoft.com` were denied. Logs end with `Failed to install browsers` / `Download failure, code=1`.

Local Firefox/WebKit application verification is **Blocked / Not tested**: **0 application tests executed**, no pass/fail/skip counts inferred from missing binaries. No restriction was bypassed, no network policy was changed, and no browser was replaced with Chromium. Local installation failures do not establish an application defect. Runtime logs are `/tmp/iteration7c-install-firefox.log` and `/tmp/iteration7c-install-webkit.log`; these are temporary local artifacts, not permanent evidence URLs.

## Separate GitHub-hosted execution

The new workflow triggers on PRs targeting `main` and supports `workflow_dispatch`. Independent `firefox` and `webkit` matrix jobs use `ubuntu-latest`, Node 22 and the existing npm lockfile. `fail-fast: false` allows both engines to finish even if one fails; failures still fail their jobs. There are no retries, conditional test skips, suppressed exit codes or `continue-on-error`.

Each job executes:

```sh
npm ci --no-audit --no-fund
npx playwright install --with-deps "$QA_BROWSER"
# Also records /etc/os-release, Node/npm/Playwright versions and browser.version().
env -u PLAYWRIGHT_CHROMIUM_EXECUTABLE npx playwright test \
  responsive-acceptance.spec.ts --browser "$QA_BROWSER" \
  --reporter line,json --trace retain-on-failure
```

`QA_BROWSER` is the literal matrix value. Both version recording and tests explicitly remove `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. No accepted configuration is modified. Browser launch/version failures remain real job failures. `permissions: contents: read`, checkout without persisted credentials, no repository secrets or production RPC/wallet credentials. Existing fixture RPC is intercepted at localhost; the synthetic contract address is supplied by the accepted Playwright web-server configuration.

Each job retains `web/test-results/` as a browser-named artifact for **14 days**, including JSON results/attached measurements and traces on failure. `if: always()` applies only to evidence upload, never to skipping tests or masking a failing exit. GitHub logs provide the environment and pass/fail counts; artifacts are runtime evidence with finite retention, not permanent screenshot hosting.

### Browser-specific outcome record

**Both browser jobs passed independently.** [Cross-browser QA run 42022958552](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42022958552) executed the initial workflow commit `aa3573cad9810c8d64570e11ce112ea98d9361ce` on November 5, 2026 UTC. Job logs show successful browser/system-dependency installation, actual `browser.version()` output, `Running 57 tests using 1 worker`, and `57 passed` for each engine. No skipped or failed cases, retries or suppressed exit codes. No Firefox/WebKit success is inferred from Chromium.

Both jobs recorded **Ubuntu 24.04.5 LTS**, **Node 22.23.4**, **npm 10.9.9**, **Playwright 1.64.1**. Browser versions below are the launched runtime versions, not just download labels.

| Execution | OS / browser version | Executed | Passed | Failed | Skipped | Classification |
| --- | --- | --- | --- | --- | --- | --- |
| Local Firefox | Debian 13 / unavailable | 0 | — | — | — | Blocked download; application Not tested |
| Local WebKit | Debian 13 / unavailable | 0 | — | — | — | Blocked download; application Not tested |
| GitHub Firefox | Ubuntu 24.04.5 / **Firefox 157.0** | **57** | **57** | **0** | **0** | Passed independently |
| GitHub WebKit | Ubuntu 24.04.5 / **WebKit 27.2** | **57** | **57** | **0** | **0** | Passed independently |

Evidence references:

- [Firefox job/logs](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42022958552/job/127230015391): **57 passed (1.9 minutes)**; [cross-browser-firefox-1 artifact](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42022958552/artifacts/13412806991).
- [WebKit job/logs](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42022958552/job/127230015925): **57 passed (1.5 minutes)**; [cross-browser-webkit-1 artifact](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42022958552/artifacts/13411694577).

Artifacts were uploaded successfully and are scheduled to expire **November 19, 2026**. Counts/environment were verified from the completed job logs; retained artifact ZIP contents were not independently inspected locally. No failing trace is claimed because these runs had no test failures. The evidence commit is explicit so later documentation updates do not invent execution on an untested SHA; latest-head CI status is recorded separately in PR #15.

### Viewport and fixture coverage

Per engine, the unchanged [responsive acceptance suite](../../web/tests/responsive-acceptance.spec.ts) contains **57 cases**: **50** combinations of widths **320, 375, 390, 700, 768, 869, 981, 1100, 1280, 1440 CSS px** and routes **`/`, `/campaigns`, `/campaigns/1`, `/campaigns/2`, `/create`**, plus **7** accessibility smoke cases. Viewport height is **900 CSS px**. These are headless Linux browser viewports, **not physical devices or production-session payload replay**.

The suite uses accepted mocked public RPC and an available, disconnected injected-wallet fixture. It waits for app/read readiness, fonts and stable layout. Assertions check document overflow, essential text bounds/clipping/opacity, hit testing and control overlaps, cards/status/progress, detail financial/creator/withdrawn fields, and form controls. Below-the-fold content is allowed. Refresh is read-only; per-case provider-method assertions prohibit unsolicited permissions, network switching, signing and transaction submission. Invalid-form checks do not submit a valid campaign transaction. No real MetaMask session is exercised by these tests.

## Existing automated accessibility coverage

| Accepted check | Existing assertion boundary |
| --- | --- |
| Skip-link focus and activation | At 375/869/1440 px: first Tab focuses the visible skip link; Enter targets unique `main#main`; next Tab enters main content |
| Logical keyboard navigation | Ordered essential header links/Connect button; Explore activation; create form field/submit order; not exhaustive navigation on every route |
| Labels and validation errors | Native label/input association, accessible names, required attributes, hints/errors via `aria-describedby`, four invalid fields, first-error focus and partial error recovery |
| Visible focus | Computed outline style/width and unobscured essential controls; not a complete visual focus/contrast audit |
| Funding progress | Named progressbars, min/max, bounded current value, exact ETH `aria-valuetext` |
| Status/alert announcements | DOM `role=status`, `role=alert`, polite live read status, RPC-error/read-only retry recovery; not actual spoken output |
| Reduced motion | Emulated preference removes transitions and card hover displacement; not every possible animation/system setting |

The [legacy responsive test](../../web/tests/reads.spec.ts) also preserves first-Tab and reduced-motion assertions; 7B's render-readiness correction remains unchanged. Other accepted read/transaction tests cover wallet safeguards and receipt/refetch behavior under mocks. Passing DOM assertions does **not** establish full WCAG compliance, practical screen-reader compatibility, real MetaMask recovery or a formal accessibility audit.

## Manual accessibility acceptance plan

Status definitions: **Passed** = executed with evidence meeting the criterion; **Failed** = executed and a violation observed; **Not tested** = not performed; **Blocked** = attempted but an infrastructure prerequisite prevented execution. No manual case below is promoted to Passed from automation. Record tester/date, OS/browser/assistive-technology versions, route, viewport/zoom, expected/actual result and evidence when executing a future acceptance session.

| Manual check | Status in 7C | Acceptance method / expected evidence |
| --- | --- | --- |
| Complete keyboard-only navigation on all five routes | Not tested | Reach/activate every relevant control, skip repeated navigation, return/back correctly; no traps; do not authorize financial actions |
| Focus visibility and order | Not tested | Visible indicator during Tab/Shift+Tab; meaningful order, no obscured/lost focus across navigation, validation and recovery |
| 200% browser zoom | Not tested | All routes readable and operable, labels/addresses/controls fit, scrolling remains usable |
| 400% zoom/reflow | Not tested | At representative desktop size, essential content reflows without unintended two-dimensional scrolling/clipping; record actual effective viewport |
| Text resizing and readability | Not tested | Increase text independently where supported; no truncated essential information or unusable controls |
| Color contrast | Not tested | Measure text/control/focus/error/progress combinations with a suitable contrast tool; include normal, hover, focus and disabled states |
| Screen-reader navigation | Not tested | NVDA with Windows Firefox/Chrome, VoiceOver with macOS/iOS Safari and TalkBack with Android Chrome as available; assess headings, landmarks, names and reading order |
| Spoken status/error announcements | Not tested | Verify actual announcements for empty/loading/RPC error/recovery, invalid form and mocked transaction states; DOM roles alone are insufficient |
| Validation and error recovery | Not tested | Understand errors without color alone, locate affected fields, correct/resubmit safely, preserve useful input and appropriate focus |

No real screen reader or manual zoom/contrast audit was run. These remain open acceptance requirements, not confirmed defects.

## Physical-device and desktop acceptance matrix

No physical devices or interactive desktop acceptance sessions are available for this automated checkpoint. Every row below is **Not tested** for the complete acceptance scope. CI Firefox/WebKit are Linux engines, not proof of installed desktop Firefox or Safari/macOS/iOS behavior.

| Representative environment | Full manual acceptance status | Required checks |
| --- | --- | --- |
| Chrome / Android phone | Not tested | All routes, navigation, cards/detail/form readability, portrait/landscape, scrolling, touch hit areas, text/zoom and wallet controls |
| Safari / iPhone or iPad (iOS/iPadOS) | Not tested | Same route/touch/reflow checks, dynamic browser chrome, on-screen keyboard, form scrolling and wallet controls |
| Desktop Chrome / Windows | Not tested | Full keyboard/zoom/reflow and route matrix; historical 6F's narrow Chrome/Windows wallet observation is not this complete matrix |
| Desktop Firefox / Windows or Linux | Not tested | Full interactive keyboard/zoom/form/scrolling matrix; record installed browser and OS versions |
| Desktop Safari / macOS | Not tested | Same desktop matrix, Safari keyboard settings and VoiceOver as available; Linux WebKit does not close this row |

Device emulation cannot close physical-device rows. Use future read-only sessions or deterministic mocks for QA interactions; any new real-wallet permissions/signatures or financial transactions require separately authorized scope.

## MetaMask recovery acceptance — separate from mocks

[6F's live evidence](../iteration-6/live-wallet-acceptance-6f.md) remains unchanged: **Passed, user-attested** creator-connected Campaign #2 withdrawn message/button absence; **Passed, screenshot-supported user attestation** for controlled dApp-assigned wrong-network detection, rendering Switch to Sepolia and no automatic return during that observation. These were Chrome/Windows user observations, not independently replayed here. The intermediate rejection/unavailable message was a separate observed error state, not a proven full recovery sequence.

No new real-wallet interaction is requested or performed in 7C. The following full recovery cases remain **Not tested in 7C / open for manual acceptance**, even where historical observations or mocked assertions cover a narrower part:

| Live manual recovery case | Status | Existing mocked coverage / remaining criterion |
| --- | --- | --- |
| Successful explicit Switch to Sepolia | Not tested | `reads.spec.ts` explicit-switch test; live button success, assigned dApp chain and current-wallet reads still need a complete recorded session |
| Reject a network switch | Not tested | Mock rejection is recoverable; 6F recorded an error message but not every rejection path |
| Switch back after rejection | Not tested | Full live rejection → explicit retry → Sepolia recovery is not established |
| Account changes while connected | Not tested | Identity isolation/late-response tests and 6C transaction lock cases; full live A/B and eligibility matrix remains open (6D's narrow user observation is preserved) |
| Disconnect/reconnect | Not tested | Mock disconnect/reconnect and authorization continuity tests; historical 6B user checks do not replace a complete current-device recovery matrix |
| Reload after network changes | Not tested | Accepted authorization/navigation tests exercise mocks; live wrong-chain reload/silent restoration/recovery remains open |
| Correct wallet-specific contribution visibility | Not tested | Account/chain/contract/campaign query isolation tested with mocks; independently record current-wallet reads and absence of previous-wallet values across the live matrix |

[Read tests](../../web/tests/reads.spec.ts), [transaction tests](../../web/tests/transactions.spec.ts) and [wallet mocks](../../web/tests/mocks.ts) cover `chainChanged`, account switching, explicit switching/rejection, disconnect, silent restoration, stale-response isolation and no automatic transaction resumption. Those safeguards are automated evidence, not claims that all corresponding real MetaMask outcomes passed. Independent creator-wallet replay beyond user attestation remains open if final review requires it.

## Regression and validation record

Local results (separate from GitHub):

| Check | Result |
| --- | --- |
| Locked dependency installation, TypeScript typecheck, production build | Passed |
| Unit tests | **57 passed, 0 failed** |
| Full Chromium regression (system Chromium 154) | **127 passed, 0 failed, 0 skipped**, including all 57 responsive/accessibility cases |
| Foundry formatting/build/tests | Passed; **43 passed, 0 failed, 0 skipped**, including 256 fuzz runs |
| Firefox / WebKit | Installation blocked; **0 application cases executed locally** |

Commands: `npm run typecheck`, `npm run build`, `npm test`; `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/iteration7c-chromium.json npm run test:browser -- --browser chromium --reporter line,json`. From `contracts/`: `forge fmt --check`, `forge build`, `forge test -vvv`, with existing `/tmp/iteration7a-bin` tools and `FOUNDRY_SOLC=/tmp/iteration7a-solc/solc-0.8.20`. Logs are `/tmp/iteration7c-*`, not permanent hosted evidence. Existing optional ox/Tempo `worker_threads` externalization and bundle-size notices remain; no warnings are suppressed.

Independent GitHub results on the same initial workflow commit:

- [Existing frontend CI](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42022958766): locked installation/build succeeded, **57 unit tests and 127 Chromium scenarios passed**. Existing Chromium workflow unchanged.
- [Foundry CI](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42022958530): formatting/build succeeded, **43 passed, 0 failed/skipped**.
- New Firefox/WebKit jobs: **57 passed per engine**, as detailed above. The cross-browser workflow is green.

Historical screenshot outputs regenerated by existing tests are restored, not committed. No accepted source/test/configuration file changes are needed to obtain these results.

YAML syntax was checked using existing PyYAML **6.0.3**, with structural assertions for triggers/matrix/read-only permissions; every shell step passed `bash -n`. Markdown relative links/fences, exact two-file scope, historical preservation and `git diff --check` passed. New commits use verified author and committer `Ravin1010 <75482385+Ravin1010@users.noreply.github.com>`, no co-author trailers or history rewriting; exact head metadata/latest CI are reported in the PR. No repository dependencies are added for validation.

## Findings and remaining gates

Local browser downloads are a **confirmed infrastructure blocker**, not a product defect. Original 7A production clipping observations remain **Unconfirmed**; neither a Chromium pass nor a browser-install failure establishes or resolves those observations. **No reproducible compatibility or accessibility assertion failure was detected in either independently executed 57-case Firefox/WebKit matrix.** No pixel-identical rendering, complete production payload coverage or manual visual/accessibility equivalence is claimed. No application/test correction is justified by these passing runs. If a later failure is reproduced, a separate authorized follow-up should capture the engine/version, route/viewport, affected DOM bounds/computed styles and loading state before proposing a narrow fix.

Keep open: full manual accessibility/contrast/zoom/screen-reader checks, representative physical devices and mobile browsers, complete real MetaMask recovery matrix, independent formal security audit and comprehensive production/security acceptance. Engineering limitations remain page-session-only pending tracking, one-confirmation receipts and no comprehensive replacement/reorganization monitor; no additional live duplicate refund/withdrawal attempts occur. Browser failures, if any, must be diagnosed and documented for a separately authorized follow-up without changing accepted application/test files in 7C.
