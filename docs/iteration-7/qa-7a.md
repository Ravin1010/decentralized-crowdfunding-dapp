# Iteration 7A — responsive and accessibility QA

**QA/test evidence only; no application fix.** Accepted `main`: `8f81f7146bed61d97449e4cd2850b4271b1ac44c`. Branch: `feature/iteration-7a-responsive-qa`. Only this report and `web/tests/responsive-acceptance.spec.ts` are added. Architecture, visual design, contract, wallet behavior, configuration, dependencies and historical Iteration 6 evidence remain unchanged.

## Findings and provenance

**No confirmed post-loading layout/clipping defect was found in the executed mocked Chromium matrix.** This does not establish comprehensive production acceptance or cross-browser compatibility.

The prior production observations are **Unconfirmed**:

- A: Campaign #2 appeared partially cut off at approximately 869 px.
- B: one listing card temporarily appeared to lack visible content at an unspecified intermediate width.

Source: [prior read-only inspection reference](https://agent.tinyfish.ai/runs/41e6837d-a23a-4b13-9f99-666d3bc6fa40). This reference was inaccessible through the available web reader; its exact screenshot, browser engine, loading moment and production payload were not independently recovered. **That session did not reach 375/390 px; no mobile testing is attributed to it.** The new small-width results below are separate local viewport emulation, not physical-device or production-session evidence.

## Environment and fixtures

Executed locally on Debian GNU/Linux 13, Node **24.19.0**, npm **11.9.0**, Playwright **1.64.1**, system **Chromium 154.0.8037.57**, Foundry **1.5.0**, native Solidity **0.8.20**. Existing locked packages were installed with `npm ci`; no dependency/configuration changes.

The new suite uses existing `mockRpc` / `mockWallet` helpers and the live-mode Vite server at **127.0.0.1:5174**. RPC requests are intercepted at **127.0.0.1:18545**. These are deterministic synthetic campaign fields, not live Sepolia data: two stable campaign IDs/titles, goal **2 ETH**, Active partial funding **1.000000000000000001 ETH**, full 42-character creator address; Campaign #2 uses the helper's forced Successful/full/withdrawn response. The existing helper supplies a relative display deadline; these fixtures are UI response presets, not execution of the real contract or exact production payload replay.

The available mocked wallet remains **disconnected**. No Connect Wallet click occurs. After every case, recorded provider methods must contain no account-permission request, signing, network switching or transaction submission. Public RPC method assertions allow reads only. Required-form testing submits invalid inputs only. **No blockchain transaction was submitted, no real wallet was connected, and no production/RPC/Vercel settings were changed.** Foundry regression uses the local test EVM, not a public chain. No Anvil deployment/lifecycle was run.

## Executed matrix

Viewport height: **900 CSS px** throughout. Every width tests `/`, `/campaigns`, `/campaigns/1`, `/campaigns/2`, `/create` (**50 cases**). Seven further accessibility smoke cases make **57 new tests**.

| Width (CSS px) | Five routes, system Chromium | Maximum measured root horizontal overflow |
| --- | --- | --- |
| 320 | Pass, 5/5 | 0 px |
| 375 | Pass, 5/5 | 0 px |
| 390 | Pass, 5/5 | 0 px |
| 700 | Pass, 5/5 | 0 px |
| 768 | Pass, 5/5 | 0 px |
| 869 | Pass, 5/5 | 0 px |
| 981 | Pass, 5/5 | 0 px |
| 1100 | Pass, 5/5 | 0 px |
| 1280 | Pass, 5/5 | 0 px |
| 1440 | Pass, 5/5 | 0 px |

Assertions wait for application data (or form render), `document.fonts.ready`, two animation frames and consecutive stable layout samples. They check element visibility, opacity, root width, text line rectangles, clipping ancestors/computed overflow, center-point hit testing of essential controls and pairwise control intersections. Financial controls intentionally disabled while disconnected are not treated as defects. Numerical tolerances: **1 px** root-bound check; **1.5 px** text/element subpixel tolerance; intersections over **2 px** on both axes flag control overlap. Actual measured root overflow was zero in all 50 cases.

Card title/status/exact funding text and progress must remain present, with two cards before/after read-only refresh and no duplicates. Detail fields include creator, status, goal, raised, settlement/outcome and wrapped long financial/address text. Form labels/inputs/hints/buttons must fit and remain unobscured. **Below-the-fold content is allowed:** no assertion requires all vertically scrollable content to fit in the initial viewport.

## Browser-specific results and blockers

| Engine | New QA result | Execution classification |
| --- | --- | --- |
| System Chromium 154 | **57 passed, 0 failed, 0 skipped** on the final new-suite run | Tested; 50 matrix + 7 accessibility cases |
| Playwright bundled Chromium 156 / revision 1248 | Installation blocked; system Chromium used instead | Bundled binary Not tested |
| Firefox 157 / revision 1555 | No application assertions executed | **Not tested**, infrastructure blocker |
| WebKit 27.2 / revision 2370 | No application assertions executed | **Not tested**, infrastructure blocker |

Each requested browser installation was attempted. Downloads from `cdn.playwright.dev` and Firefox/WebKit fallback `playwright.download.prss.microsoft.com` returned **HTTP 403, “Domain forbidden”** under the environment's network policy. No network-policy bypass was attempted. Firefox/WebKit runtime system dependencies could not be evaluated without binaries.

Explicit Firefox/WebKit suite commands were attempted with the Chromium executable override removed. Each stopped at the first launch: missing `firefox-1555/firefox/firefox` or `webkit-2370/pw_run.sh`. Per engine, Playwright reported **1 launch failure and 56 did not run** under `--max-failures 1`. All **57 application cases are Not tested** in that engine; these are not product failures or intentional test skips. No `test.skip`, `test.fail`, retries or weakened assertions were used to conceal results.

## Observation A — Campaign #2 at 869 px

**Reproduction result: Not reproduced after stabilization in mocked Chromium. Original production observation: Unconfirmed.**

Minimal local reproduction: configure/run the existing Playwright live fixture, use `mockRpc(page, { status: 1, withdrawn: true, full: true })`, navigate to `/campaigns/2`, set **869 × 900**, wait for public data/fonts/layout, then inspect the full scrollable page. The new test `public responsive /campaigns/2 at 869px` performs this without a connected wallet.

Actual final new-suite measurements, CSS px (positions are document-relative vertically):

| Element | Measured bounds | Expected constraint / result |
| --- | --- | --- |
| Document | clientWidth **869**, scrollWidth **869** | No document-wide horizontal overflow |
| `aside.funding-panel` | x **482.719**, right **844.984**, width **362.266**; y **594.266**, height **941.641** | Horizontally within 0–869 and the ~24 px page margin; clientWidth/scrollWidth both **360** |
| `.creator strong` | x **88**, right **458.719**, width **370.719**, height **34** | Long address wraps; `overflow-wrap: anywhere`, normal white-space, no clipped text lines |

The funding panel's bottom is approximately **1535.906 px**, beyond the **900 px** fold. Scrolling/full-page capture reveals the remaining content, including **Successfully withdrawn**. That vertical extent is **not clipping**. The tests verify status/goal/raised/creator/withdrawal information and text-line containment independently of screenshot cropping.

Relevant accepted CSS: [detail grid](../../web/src/styles.css#L804), [1100 px breakpoint](../../web/src/styles.css#L1156) (`1.2fr 1fr`, 24 px gap), [700 px single-column detail layout](../../web/src/styles.css#L1427), [long text wrapping](../../web/src/styles.css#L1537). No failing rule/constraint was established. These measured bounds cannot prove the cause of the inaccessible original production screenshot.

## Observation B — listing card content

**Reproduction result: Not reproduced after stabilization/refetch in mocked Chromium. Original production observation: Unconfirmed.**

Minimal reproduction: existing two-campaign `mockRpc` fixture, `/campaigns`, width **981 × 900** (also exercised at all ten widths), wait for data/fonts/stable layout, inspect both cards and refresh read-only. Both titles, badges, exact funding and progress remain rendered and unclipped.

At 981 px:

| Element | Measured bounds | Result |
| --- | --- | --- |
| Document | clientWidth/scrollWidth **981/981** | Zero horizontal overflow |
| First `.campaign-card` | x **24**, right **478.5**, width **454.5** | Within viewport |
| Second `.campaign-card` | x **502.5**, right **957**, width **454.5** | Within viewport; 24 px gap |
| Both cards | y **734.719**, height **582.906**; clientWidth/scrollWidth **453/453** | Full content retained; no detected ancestor/text clipping |

At this scroll position much of each card's text lies below the initial fold; actual full-page images show both complete cards. Existing `.campaign-card { overflow: hidden }` was specifically tested for clipped descendant text rather than assumed safe or assumed defective. Relevant CSS: [three-column grid/card](../../web/src/styles.css#L596), [two columns at 1100 px](../../web/src/styles.css#L1149), [one column at 700 px](../../web/src/styles.css#L1330). This provides an ordinary scrolling explanation in the fixture, **not a proven diagnosis of the original transient production observation**. Transient pre-data/font-loading behavior and the original exact intermediate viewport remain unconfirmed.

## Accessibility smoke coverage

**7 new accessibility cases passed:**

- Three keyboard cases at **375, 869, 1440 px**: first Tab focuses the visible skip link; Enter targets the unique `main#main`; next Tab enters main content rather than header navigation. A fresh navigation checks ordered header essentials and keyboard activation of Explore campaigns. No wallet permission action is activated.
- Form case: native label/input associations, accessible names, required attributes, hint/error `aria-describedby`, four invalid fields, first-error focus, visible outline and Tab order through description/goal/duration/submit. Correcting only the title and resubmitting clears its `aria-invalid` while three errors remain; no valid transaction submission occurs.
- Announcement case: public empty state uses `role=status`, read container `aria-live=polite`, RPC error uses `role=alert`; read-only retry recovers correctly.
- Funding case: named `role=progressbar`, min/max 0/100, bounded value and exact ETH `aria-valuetext`.
- Reduced-motion case: emulated preference disables transitions and card hover displacement.

Visible keyboard focus is checked through computed outline style/width (at least 2 px), not just `activeElement`. These are targeted DOM/keyboard/CSS smoke checks. **No formal WCAG compliance, contrast audit or screen-reader compatibility is claimed.** No real screen reader was tested.

## Regression execution record

| Check | Result |
| --- | --- |
| npm ci / typecheck / production build | Passed; no lockfile/config changes |
| Vitest | **57 passed, 0 failed** |
| Final new Chromium QA suite | **57 passed, 0 failed, 0 skipped** |
| Full Chromium browser regression (70 accepted + 57 new), two runs | Each **126 passed, 1 failed**, 0 skipped; same unchanged legacy focus assertion |
| Foundry formatting / build / test | Passed; **43 passed, 0 failed, 0 skipped**, including 256 fuzz runs |
| Isolated unchanged legacy responsive test, two repetitions with trace | **2 passed, 0 failed** |
| Firefox / WebKit application QA | **Not tested**; installation/launch blockers above |

The first full 127-test Chromium run had **126 passed, 1 failed**: the unchanged `reads.spec.ts:383` expected the skip link to be focused immediately after `page.goto` and one Tab. The new readiness-aware keyboard cases passed. A repeat full regression again produced **126 passed, 1 failed, 0 skipped** at the same assertion. Both runs passed all 57 new cases. An isolated legacy-test probe with `--repeat-each 2 --trace on` subsequently **passed 2/2**. This demonstrates an execution-context/timing-sensitive regression signal, not a resolved root cause. The failure is a legacy focus/readiness investigation, **not evidence confirming either suspected layout issue**, and no existing test/application file was changed. The precise focus-timing cause is not established. Initial new-test authoring also caught an ambiguous branding locator (header/footer); it was corrected in the new spec by scoping to the banner, not by changing the app.

Existing nonfatal build notices remain: optional ox/Tempo `node:worker_threads` browser externalization and ~638 kB entry bundle. They were not suppressed.

## Reproduction commands and runtime evidence

From `web/`, with existing dependencies installed:

```sh
npm ci
npm run typecheck
npm run build
npm test
npx playwright install chromium firefox webkit
# When Playwright's Chromium binary is available:
npx playwright test responsive-acceptance.spec.ts --browser chromium
npx playwright test responsive-acceptance.spec.ts --browser firefox
npx playwright test responsive-acceptance.spec.ts --browser webkit
# Cloud fallback used for Chromium, with a JSON reporter for measurements/images:
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium \
PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/iteration7a-qa-final.json \
npm run test:browser -- responsive-acceptance.spec.ts --browser chromium --reporter line,json
# Full regression:
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser -- --browser chromium
```

Firefox/WebKit probes used `PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright`, removed `PLAYWRIGHT_CHROMIUM_EXECUTABLE` with `env -u`, and passed `--max-failures 1`. Never pass the system Chromium executable to Firefox/WebKit. Browser selection used explicit CLI commands; the accepted Playwright configuration was unchanged.

Foundry: `forge fmt --check`, `forge build`, `forge test -vvv` from `contracts/`, with pinned Foundry 1.5.0 and compiler 0.8.20. Tools were installed under `/tmp/iteration7a-bin` and `/tmp/iteration7a-solc`; `FOUNDRY_SOLC` selected the compiler without changing repository settings.

Each matrix case attaches `layout-measurements` JSON. Actual **mocked** full-page PNGs are attached for detail/869, listing/981 and create/375. The local JSON reports contain these attachments; inspected copies were extracted to `/tmp/iteration7a-evidence/detail-869-chromium.png`, `listing-981-chromium.png`, `create-375-chromium.png`. These are actual local Chromium renderings, **not production or physical-device screenshots**. They are runtime outputs, not extra tracked files or permanent hosted evidence URLs. Reproduce with the JSON reporter to retain attachments; the unchanged default CI workflow is not claimed to upload them as artifacts. Historical screenshot files regenerated by existing tests are restored before commit.

## 7B handoff and outstanding work

No confirmed layout defect currently justifies a CSS/application correction. **Do not apply a speculative 7B fix** from the original cropped/transient observations. Further production reproduction needs the exact browser/viewport/payload/loading state and a scroll-aware capture; the existing reference could not be retrieved here. The unresolved legacy focus assertion should be investigated independently (render readiness versus focus restoration). A narrowly scoped **candidate 7B test correction**, only after authorization and cause confirmation, is to wait for the rendered application/skip link before the existing first-Tab assertion, preserving the assertion itself. No keyboard behavior, CSS or existing test is changed in 7A.

Firefox/WebKit execution remains blocked; no cross-engine pass is claimed. Physical phones/tablets, touch/rotation/browser zoom, real mobile browsers, connected-wallet layout variants, full keyboard coverage, actual screen readers and comprehensive accessibility/security acceptance remain outstanding. No source/configuration/dependency/CI changes, deployment/redeployment, wallet permission/signature or public blockchain transaction occurred in 7A. Leave the PR open and unmerged for independent review.
