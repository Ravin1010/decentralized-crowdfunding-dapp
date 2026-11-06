# Iteration 7D — manual accessibility and physical-device acceptance

> **Updated owner-authorized scope: automated-only 7D.** The owner superseded the original manual-acceptance requirement. These 20 manual case IDs and 25 device/route cells are retained unchanged as optional future reference, with every unexecuted result still **Not tested**. Manual testing is no longer required to complete automated Iteration 7D. New execution results and the automation completion decision belong in [automated-acceptance-7d.md](automated-acceptance-7d.md). Automated passes never change these manual cases to Passed. The original checklist remains in Git history; this note qualifies its former completion requirements.

## 1. Scope and baseline

**Original manual preparation; optional manual acceptance remains open under the updated scope.** Accepted `main`: `2bc38927843303de135ff187f42142163fbe7abe`. Branch: `feature/iteration-7d-manual-acceptance`. Production target: [DeCen Crowdfund](https://decentralized-crowdfunding-dapp.vercel.app).

The original preparation authorized only this new document; the updated scope separately authorizes dedicated automation, its report and the minimal accessibility development dependency. The original preparation left application, visual design, architecture, contracts/ABI, wallet/transaction behavior, dependencies, configuration, tests, CI and previous evidence unchanged. Under the new scope, production implementation and existing tests/workflows remain frozen; dedicated automation and its minimal development dependency are documented separately. No screenshots or recordings are committed. Creating this checklist alone does not establish automated completion or close any manual gate; automated 7D may complete independently after its authorized checks pass and review remains pending.

All manual cases below remain **Not tested**. No qualifying manual production/device, real-keyboard, zoom, contrast-tool or screen-reader test was conducted during preparation. No new tester observations, execution dates, device/browser versions, measurements, screenshots or spoken announcements are asserted. A cloud/headless browser session or source inspection cannot supply missing physical-device or real-keyboard evidence.

## 2. Prior automated QA — inherited evidence only

| Source | Historical result and boundary |
| --- | --- |
| [7A responsive QA](qa-7a.md) | 57 responsive/accessibility cases; historical local full-suite focus failures remain recorded, not rewritten as passes |
| [7B focus investigation](focus-stability-7b.md) | Reproduced a render-readiness race in a diagnostic copy; minimal test synchronization; three post-correction full Chromium runs passed 127/127 |
| [7C cross-browser acceptance](cross-browser-acceptance-7c.md) | Hosted Firefox 157.0 and WebKit 27.2 each passed 57/57 on Ubuntu 24.04.5; Chromium 127/127, unit tests 57/57 and Foundry 43/43 also recorded |

7C's suite covers ten widths, five routes and seven accessibility smoke cases using mocked public RPC/injected wallets. Its existing coverage includes skip-link activation, selected Tab order, labels/errors, computed focus indicators, progress semantics, announcement roles and reduced motion. These are **automated results inherited from 7A–7C**, not new 7D executions or manual passes. Linux WebKit is not Safari on iOS/macOS, viewport emulation is not a physical phone, and ARIA assertions are not evidence of spoken screen-reader output. The original manual-document preparation did not rerun automated suites. New-scope automation and required regressions are reported separately. Any automatically triggered PR CI is reported separately as automation, not manual evidence.

## 3. Manual evidence methodology

| Status | Meaning |
| --- | --- |
| Passed | Performed; acceptance criterion verified with qualifying evidence |
| Failed | Performed; a reproducible problem observed and documented |
| Not tested | No qualifying test conducted; includes unavailable environments that have not been attempted |
| Blocked | An attempted execution was prevented by a required device, tool or environmental prerequisite; record the actual blocker |

Do not infer a pass from automation, a procedure, an unrelated historical session or one route on another device. Change a status only after recording the supporting execution. Preserve earlier observations and link any retest rather than replacing a failure with an unexplained pass. An aggregate case can pass only when all its applicable route/state subchecks have evidence; otherwise retain its open status and record partial results separately.

### Evidence entry — copy once per actual execution/context

Leave unexecuted fields unfilled; the following is a template, **not an executed test**:

| Required field | To record after execution |
| --- | --- |
| Test ID / subcheck | Matrix ID, route and relevant orientation/state; unique entry identifier for retests |
| Tester / evidence source | Actual observer, or explicitly attributed user attestation/independent report; identify provenance |
| Execution date, time and timezone | Exact local timestamp with UTC offset and named timezone; do not use commit/preparation time as execution time. For Malaysian sessions record MYT / Asia/Kuala_Lumpur, UTC+08:00 |
| OS and version | Actual OS version/build |
| Device and browser/version | Actual device model, browser version; screen-reader/tool version where relevant |
| Display and settings | Physical screen resolution, browser window and CSS viewport dimensions when available; zoom/text scale, orientation, device scaling and keyboard/navigation settings |
| Page / route | Full URL, route and observed loading/read state; distinguish public production from any separately identified test environment |
| Expected behavior | Applicable criterion below, including exact essential content/control |
| Actual behavior | What was actually seen/heard/measured; include values and read failures without substituting zeros |
| Result and evidence reference | One of the four statuses; an existing supplied reference or traceable attributed narrative. If no capture/permalink exists, state that limitation instead of inventing one |
| Failure reproduction | Starting state, exact inputs/actions, affected control, frequency/attempt count, expected versus actual, recovery and proposed severity with impact justification |

Record the observed production build identifier only if actually available; repository `main` alone does not prove the currently served build. Do not invent immutable deployment provenance. Capture only evidence needed for review; redact sensitive information. Do not commit screenshots/recordings without separate authorization. If only conversation evidence is available, identify its source and missing stable permalink honestly.

### Safe session setup

Use disconnected public browsing. A session with no previously authorized wallet connection avoids silent restoration without changing wallet permissions/configuration. Do not activate Connect Wallet, wallet network controls or financial actions. Stop if an unexpected wallet prompt appears; do not approve it. Do not connect/disconnect/switch a real wallet for these cases.

On `/create`, submit **only deliberately invalid local input**, such as blank required fields. Keep at least one required field invalid throughout validation/recovery checks. Never submit a valid campaign. Public navigation, scrolling, browser zoom, assistive navigation and read-only refresh are the permitted interactions. Do not change production RPC/Vercel settings or generate a real error by changing application configuration.

## 4. Physical-device test matrix

Route key:

| Route | Production target |
| --- | --- |
| R1 | [Homepage](https://decentralized-crowdfunding-dapp.vercel.app/) |
| R2 | [Campaign listing](https://decentralized-crowdfunding-dapp.vercel.app/campaigns) |
| R3 | [Campaign #1](https://decentralized-crowdfunding-dapp.vercel.app/campaigns/1) |
| R4 | [Campaign #2](https://decentralized-crowdfunding-dapp.vercel.app/campaigns/2) |
| R5 | [Create form](https://decentralized-crowdfunding-dapp.vercel.app/create) |

Each cell is an unexecuted route subcheck. Device/OS/browser versions and dimensions are deliberately unspecified until actual execution. Unavailable environments remain **Not tested**.

| ID | Actual environment required | R1 | R2 | R3 | R4 | R5 |
| --- | --- | --- | --- | --- | --- | --- |
| DEV-01 | Windows desktop — Chrome | Not tested | Not tested | Not tested | Not tested | Not tested |
| DEV-02 | Android phone — Chrome | Not tested | Not tested | Not tested | Not tested | Not tested |
| DEV-03 | iPhone/iPad — Safari; record which device/OS | Not tested | Not tested | Not tested | Not tested | Not tested |
| DEV-04 | Desktop — Firefox; record actual OS | Not tested | Not tested | Not tested | Not tested | Not tested |
| DEV-05 | macOS — Safari | Not tested | Not tested | Not tested | Not tested | Not tested |

For each applicable route, verify usable navigation; complete card title/status/progress; readable details, ETH values and creator addresses; visible form labels/hints/controls; ordinary vertical scrolling; no unintended horizontal scrolling that hides content; no overlap obstructing essential controls; and no unexplained rendering/navigation error. Wait for actual loading to settle and distinguish below-the-fold content from clipping. If reads fail, record the real error and do not mark content checks Passed.

On R4, verify the public **Successful** status and **Successfully withdrawn** message, with **Withdraw Funds** absent. This is a disconnected public UI check, not creator-connected eligibility verification, a new getter read or a duplicate-withdrawal attempt. Historical funding must not be interpreted as currently refundable or reset to zero after settlement.

For DEV-02/DEV-03, each applicable route also requires portrait and landscape observations, touch targets/activation, browser-interface expansion/collapse during scrolling, readable text/reflow and access to essential controls. On R5 additionally inspect scrolling/focus and field/button visibility with the on-screen keyboard open. Record actual dimensions before/after orientation and keyboard changes. A pass on one orientation or phone does not close the other, and iPhone results do not establish iPad coverage.

## 5. Keyboard acceptance matrix

Use a **real keyboard**, not Playwright key events. Record the device/browser pairing and any browser settings that affect link/control navigation. Log each applicable route separately using the evidence template.

| ID | Coverage | Procedure and expected behavior | Status |
| --- | --- | --- | --- |
| KEY-01 — Skip link | R1–R5 | Start at the top with no control pre-focused; press Tab. Skip to content receives visible focus. Enter meaningfully moves sequential keyboard navigation into main content; verify the next Tab destination. Do not programmatically focus the link to manufacture a pass | Not tested |
| KEY-02 — Navigation order | R1–R5 | Tab/Shift+Tab through header, main, links/forms and footer; logical order, visible unobscured focus and no trap. Focus wallet/financial controls only where reachable; never activate them | Not tested |
| KEY-03 — Form accessibility | R5 | Reach every field; understand labels/help; submit blank/invalid required input only; identify errors and focus. Correct one field while another remains invalid and verify the error state updates appropriately | Not tested |
| KEY-04 — Navigation recovery | R1–R5 | Use ordinary links and browser back/forward; check meaningful focus recovery and non-financial read-only recovery if an actual error is encountered. No wallet connection/switching; do not fabricate an error or claim a recovery path tested when none occurred | Not tested |

A route's first-Tab test begins from its actual initial keyboard state; record any reload/navigation used. A currently focused control or browser chrome can alter the starting state, so preserve diagnostics rather than diagnosing an application bug from one unexplained keypress.

## 6. Zoom and text-resizing matrix

| ID | Setting | Routes | Required observations | Status |
| --- | --- | --- | --- | --- |
| ZOOM-01 | Browser zoom **200%** | R1–R5 | Record actual window/CSS viewport and zoom; navigation, metadata, exact ETH, addresses, form labels/fields remain readable and operable | Not tested |
| ZOOM-02 | Browser zoom **400%** | R1–R5 | Record dimensions/effective viewport; essential content reflows, no obstructed controls or genuine clipping; ordinary vertical scrolling is allowed | Not tested |
| ZOOM-03 | Text resizing where supported | R1–R5 | Record browser/OS setting and actual percentage/size separately from page zoom; labels, values, addresses and controls retain readability and usable flow | Not tested |

For each execution, record the base display/window size, actual zoom/text size and resulting viewport; do not assume a 320 px viewport equals 400% zoom. Inspect all five routes and relevant control/error states without financial actions. If text-only resizing is unsupported in the actual environment, document that limitation for the attempted subcase; do not invent a result or change browser/application configuration beyond the acceptance setting.

## 7. Color-contrast and visual accessibility matrix

| ID | Samples / states | Measurement or acceptance criterion | Actual measurements | Status |
| --- | --- | --- | --- | --- |
| A11Y-01 — Text contrast | Body/muted text, labels, links, campaign status labels and validation errors across applicable R1–R5 content | Measure rendered foreground/background with an identified tool; WCAG 2.2 SC 1.4.3 reference targets: 4.5:1 normal text, 3:1 qualifying large text. Record font size/weight and any applicable exception | Not measured | Not tested |
| A11Y-02 — Interactive states | Focus, hover, disabled and error states on navigation/form/read-only controls | Record visibility, obstruction and state distinction; assess relevant focus/non-text contrast criteria, including SC 1.4.11's 3:1 where applicable. Disabled/inactive controls have exceptions; do not automatically misclassify them from a contrast threshold alone | Not measured | Not tested |
| A11Y-03 — Non-color indicators | Campaign states, progress context and invalid-field errors | Verify understandable text/icons/structure and error identification without color alone (SC 1.4.1 reference); record actual labels/state/error context | No observations | Not tested |

For every measured sample, record route, element/text, state, tool/version, actual composited foreground/background colors, font metrics, measured ratio, applicable criterion/exception and outcome. Do not report design-token calculations as measurements of rendered production content. A small sample is not a full contrast audit or WCAG conformance determination.

## 8. Screen-reader matrix

| ID | Required real environment | Status |
| --- | --- | --- |
| SR-01 | Windows — NVDA with Chrome | Not tested |
| SR-02 | Windows — NVDA with Firefox | Not tested |
| SR-03 | macOS — VoiceOver with Safari | Not tested |
| SR-04 | iOS/iPadOS — VoiceOver with Safari; record device | Not tested |
| SR-05 | Android — TalkBack with Chrome | Not tested |

For each available pairing, inspect R1–R5 with actual spoken output: page title/headings; main navigation/landmarks; campaign titles/links/status; funding progress; ETH amounts with meaningful context; form labels/help; invalid-field/error announcements; and loading/empty/read-only recovery messages when actually encountered. Record exact heard phrases, navigation commands, assistive-technology/browser versions, relevant verbosity settings and actual loading/error state. Keep empty/recovery subchecks untested if the live session never presents those states; do not create campaigns or change production configuration to produce them.

Source ARIA, an accessibility-tree inspection or Linux engine results are not spoken-announcement evidence. No screen reader was used in this preparation; unavailable pairings stay Not tested. Do not claim compatibility from another reader/platform or a passed DOM-role assertion.

## 9. Observed execution results

**No manual executions are recorded.** All five device rows (25 route cells), four keyboard cases, three zoom/text cases, three visual/contrast cases and five screen-reader pairings remain **Not tested**. No case is marked Passed, Failed or Blocked without qualifying evidence. Execution date/time, tester, OS/device/browser versions, measured dimensions/contrast ratios and evidence references remain unfilled because no test occurred.

This section is the future append-only execution ledger: add a complete evidence entry from section 3 per actual case/route/context and update only the supported matrix status. Partial coverage does not close an entire environment, state matrix or acceptance gate. Separately identify user-attested evidence and independently reproduced observations. No new screenshots, recordings or locally executed manual/automated passing counts were generated during the original manual-document preparation; new automated evidence is tracked separately. Automatically triggered PR CI, if any, is separate automation and cannot close these manual cases.

## 10. Confirmed defects and unresolved observations

**No new confirmed defect is recorded in 7D because no qualifying manual test was performed.** This is not evidence that the production application is defect-free.

7A's Campaign #2 clipping observation near 869 px and transient listing-card-content observation remain **Unconfirmed**, with original provenance in [7A](qa-7a.md). The source session did not reach 375/390 px. Passing mocked matrices in 7A–7C do not retrospectively establish the exact production observation's cause or turn it into a manual pass. No 7D reproduction is claimed. 7B's established test-readiness diagnosis remains separate historical evidence.

For a newly observed failure, record the section 3 environment and evidence plus: affected route/element; exact starting state and actions; expected/actual bounds or behavior; number of attempts and recurrence; whether loading/fonts/scroll position matter; and a proposed severity justified by impact. Suggested impact descriptions are essential task inaccessible (high), substantial obstruction with a workaround (medium), or limited readability/usability issue (low); do not assign a severity before evidence exists. A one-off report without reproducible support remains an **Unconfirmed observation**, separate from the four execution statuses, pending investigation.

Only after supporting evidence exists, propose a narrow, separately authorized follow-up identifying the affected constraint/control and focused verification. Do not implement a speculative CSS, application, wallet or test correction in 7D.

## 11. Outstanding manual acceptance requirements

All device/route combinations, mobile orientation/touch/keyboard cases, complete real-keyboard navigation/recovery, 200%/400% zoom, supported text resizing, measured contrast/states/non-color indicators and actual screen-reader pairings remain open. Collect missing environment metadata, observed results and traceable evidence, then obtain independent review before closing the corresponding gates. Additional device/version coverage must be named explicitly; a representative case does not establish comprehensive compatibility.

Documentation validation for this preparation checks the accepted baseline, matrix completeness, Markdown/relative links, absence of fabricated results, one-new-file scope, historical preservation, `git diff --check`, actual commit attribution and clean working tree. These repository checks are not manual acceptance tests. PR CI, if automatically triggered, remains separate inherited-infrastructure regression evidence; it cannot change any manual status here.

## 12. Future acceptance and security-review boundaries

The existing [6F MetaMask observations](../iteration-6/live-wallet-acceptance-6f.md) remain historical user-attested evidence, not replayed in 7D. Full real MetaMask account/network recovery remains a separately authorized future scope. Do not connect a real wallet, request permissions, initiate network switches, sign, create campaigns, contribute, refund, withdraw or submit blockchain transactions during this iteration. Do not generate sample transactions to fill evidence gaps.

No application change, deployment, RPC/Vercel configuration change, security audit or comprehensive production/accessibility acceptance occurs here. Engineering limitations remain page-session-only pending tracking, one-confirmation receipts and no comprehensive replacement/reorganization monitor. Formal security review and comprehensive production acceptance remain open; previous automated and live evidence is not a substitute.

Keep the PR **draft, open and unmerged**, without auto-merge. Manual evidence remains uncollected for these optional future gates. **Automated 7D completion is governed by the separate report and no longer depends on manual testing**; it remains subject to independent review and cannot imply physical-device, spoken screen-reader, real-wallet or comprehensive security acceptance.
