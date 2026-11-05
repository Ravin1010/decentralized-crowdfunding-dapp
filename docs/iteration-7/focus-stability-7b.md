# Iteration 7B — keyboard-focus test stability

## Scope and conclusion

Accepted `main`: `dd40bc78f0848c4e6fb95531b94104ae44646f85`. Branch: `feature/iteration-7b-focus-stability`.

Affected case: `responsive demo and live pages preserve layout, keyboard access, and screenshots` (original focus assertion at `reads.spec.ts:383`).

**A navigation/React-render readiness race was reproduced in an instrumented copy of the unchanged legacy test.** The browser's `load` event could precede React mounting the skip link. Sending Tab during that interval navigated an empty document; the later focus assertion could not recover the missed key action. The correction waits for the skip link and its main-content target to be attached before sending the original Tab.

Only [the affected test](../../web/tests/reads.spec.ts) and this report change. No application, CSS, contract, ABI, configuration, dependencies, CI or other tests change. The original Tab, skip-link `toBeFocused()` assertion, reduced-motion assertions and wallet/responsive steps remain intact. No programmatic focus, arbitrary sleep, timeout increase, retry, skipped test or weakened expectation was added.

## Historical evidence

[Iteration 7A's report](qa-7a.md) remains unchanged. It records two local full Chromium runs with **126 passed / 1 failed** at the same first-Tab focus assertion, and an isolated traced repeat with **2 passed**. The 7B request additionally records the subsequent [7A GitHub Actions full regression](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42009464806) with **127 passed**. The exact cause was unresolved at that checkpoint. Those failures remain failures.

The fresh, unmodified 7B full runs both passed. The later diagnostic reproduction below establishes a cause for a reproduced instance of the same failure; it does not claim to have recovered the missing pre-Tab state from either historical 7A failure.

## Environment and method

Executed November 5, 2026 UTC, Debian GNU/Linux **13 (trixie)**; Node **24.19.0**, npm **11.9.0**, Playwright **1.64.1**, system Chromium **154.0.8037.57** at `/usr/bin/chromium`. Existing locked dependencies were used without changes. Foundry **1.5.0**, native Solidity **0.8.20**. These match the relevant local 7A versions.

The accepted Playwright configuration was untouched: one worker, no retries, headless browser, existing demo/live/invalid-configuration Vite servers on ports 5173/5174/5176. Browser commands selected Chromium explicitly. Existing mocked JSON-RPC and EIP-1193 fixtures were used throughout. The legacy test ends at **375 × 812**, navigating from the live detail workflow to the demo homepage before its first Tab.

Before any tracked test edit, the full suite was executed with and without tracing, the legacy case alone, five traced repetitions, all surrounding `reads.spec.ts` cases, and the separate 57-case 7A suite. All these original-test runs passed. Thus an isolated pass and even clean full runs were insufficient to diagnose the historical inconsistency.

For diagnostics, a temporary copy of `reads.spec.ts` under `/tmp/iteration7b-diagnostics/` retained the original sequence and assertion. An init script added read-only `load`, mutation, capture-phase Tab `keydown`, and Tab `keyup` listeners. It recorded URL, `performance.now()`, ready state, `document.hasFocus()`, active element, React root child count, main presence, and skip-link tabindex, href, bounds and computed display/visibility. No additional await, focus call or readiness gate was inserted before Tab. A temporary config imported the accepted configuration, changing only diagnostic test/output locations and explicitly retaining the web-server working directory; no repository configuration was edited.

Five untraced diagnostic repetitions produced **4 passed / 1 failed**, with the fourth repetition failing the original `toBeFocused()` assertion. Diagnostics can affect scheduling; the report distinguishes these runs from the unmodified tracked-test runs.

## Captured failure and diagnosis

All rows below concern the **same final demo-home navigation** in failed diagnostic repetition 4. Times are milliseconds relative to that document's navigation, rounded to one decimal.

| Observation | Time | Ready state | Document focused | Active element | Root children / main / skip |
| --- | --- | --- | --- | --- | --- |
| `load` | 147.6 | complete | true | BODY | 0 / absent / absent |
| Tab keydown, before default navigation | 150.0 | complete | true | BODY | 0 / absent / absent |
| Tab keyup, after default navigation | 151.2 | complete | false | BODY | 0 / absent / absent |
| Skip link first mounted | 164.5 | complete | false | BODY | 4 / present / present |

The skip link mounted **14.5 ms after keydown**. The unchanged assertion subsequently resolved the link 14 times but received `inactive` until its existing 5-second assertion timeout. Merely extending that timeout would not replay the lost Tab.

In the four passing diagnostic repetitions, the link and main were already mounted at keydown, document focus was true, and the active element changed from BODY to `A.skip-link` on keyup. The link had `tabIndex=0`, `href="#main"`, `display:block`, and `visibility:visible`. At 375 px its bounds changed from **x=20, y=-100, width≈142.8, height=52** before focus to **y=12** afterward. The initial negative y is the intentional skip-link CSS, not an inaccessible/non-focusable element.

[React startup](../../web/src/main.tsx) calls `createRoot(...).render(...)`; document load alone is not a React-commit barrier. [The app](../../web/src/App.tsx) renders the skip link before the header and `main#main`. [The CSS](../../web/src/styles.css) exposes the link on focus. The captured failure had document focus before Tab, so an initially unfocused document is not the explanation for this reproduced instance. No restored header focus, competing element, navigation after the final goto, or wallet-triggered focus change was observed. The same mock setup and navigation sequence also passed repeatedly; a preceding test is not necessary to reproduce the failure.

The existing [7A keyboard cases](../../web/tests/responsive-acceptance.spec.ts) wait for the app/form and layout before Tab, and passed unchanged at 375, 869 and 1440 px. This is consistent with the observed readiness race. No application accessibility defect was established by this investigation.

Chromium/runtime differences are **not established as a cause**: both failure and success occurred in Chromium 154 in this session. No controlled comparison against another browser version was performed. The historical CI/browser differences do not prove a version defect.

## Minimal correction

Immediately after the final demo-home `goto`, add only:

```ts
// Navigation can finish before React commits the skip link and its target.
await expect(page.locator(".skip-link")).toBeAttached();
await expect(page.locator("main#main")).toBeAttached();
```

The next action remains `page.keyboard.press("Tab")`, followed by the unchanged skip-link focus assertion. These checks synchronize with the missing application render rather than moving focus, waiting an arbitrary duration or changing application behavior.

After adding the same gate to the temporary diagnostic copy, all five repetitions passed: every keydown had four root children, `main` and the skip link present, document focus true and BODY active; every keyup had `A.skip-link` active and document focus true. This checks the proposed synchronization against the captured failure mechanism.

## Execution results

**Three consecutive post-correction full Chromium runs passed, each 127/127, untraced, without retries or skips.** This demonstrates clean repeated full-suite execution here, not universal future stability.

| After correction | Passed | Failed | Skipped |
| --- | --- | --- | --- |
| Isolated legacy case | 1 | 0 | 0 |
| Isolated legacy case, ten traced repetitions | 10 | 0 | 0 |
| Temporary diagnostic copy, five untraced repetitions | 5 | 0 | 0 |
| Full Chromium run 1 | 127 | 0 | 0 |
| Full Chromium run 2 | 127 | 0 | 0 |
| Full Chromium run 3 | 127 | 0 | 0 |
| Separate 7A responsive/accessibility suite | 57 | 0 | 0 |
| Vitest (2 files) | 57 | 0 | 0 |
| Foundry (1 suite, including 256 fuzz runs) | 43 | 0 | 0 |

Typecheck, production build, Foundry formatting and Foundry build passed before and after the correction. Unit tests passed 57/57 and Foundry tests 43/43 both times. All requested local checks executed; there are no unresolved failures in the post-correction runs. The diagnostic pre-correction failure remains recorded below. No test cases were added or removed: the accepted browser suite still has 127 distinct scenarios.

| Before correction | Passed | Failed | Skipped |
| --- | --- | --- | --- |
| Full Chromium, tracing on | 127 | 0 | 0 |
| Full Chromium, untraced | 127 | 0 | 0 |
| Isolated legacy case, untraced | 1 | 0 | 0 |
| Isolated legacy case, five traced repetitions | 5 | 0 | 0 |
| Surrounding `reads.spec.ts` | 26 | 0 | 0 |
| Separate 7A responsive/accessibility suite | 57 | 0 | 0 |
| Temporary diagnostic copy, five untraced repetitions | 4 | **1** | 0 |

## Commands and runtime artifacts

From `web/`, with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium` exported:

```sh
npm run test:browser -- --browser chromium --trace on --reporter line,json
npm run test:browser -- --browser chromium --reporter line,json
npm run test:browser -- reads.spec.ts --grep 'responsive demo and live pages preserve' --browser chromium --reporter line,json
npm run test:browser -- reads.spec.ts --grep 'responsive demo and live pages preserve' --browser chromium --repeat-each 5 --trace on --reporter line,json
npm run test:browser -- reads.spec.ts --browser chromium --reporter line,json
npm run test:browser -- responsive-acceptance.spec.ts --browser chromium --reporter line,json
# After correction: isolated case, ten traced repetitions, then three full untraced runs.
npm run test:browser -- reads.spec.ts --grep 'responsive demo and live pages preserve' --browser chromium --repeat-each 10 --trace on --reporter line,json
npm run typecheck
npm run build
npm test
```

Diagnostic command, before and after correction, used `npx playwright test --config /tmp/iteration7b-diagnostics/playwright.config.ts --grep 'responsive demo and live pages preserve' --browser chromium --repeat-each 5 --reporter line,json`. The temporary copy's only subsequent change was the same render gate added to the tracked test. Each run used a distinct `PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/iteration7b-*.json`; no retry flag was used. `--repeat-each` represents independent executions, including the preserved diagnostic failure, not retries of failures.

From `contracts/`: `forge fmt --check`, `forge build`, `forge test -vvv`. Local tool paths `/tmp/iteration7a-bin` and `FOUNDRY_SOLC=/tmp/iteration7a-solc/solc-0.8.20` selected existing tools without changing Foundry configuration.

JSON reports/logs are under `/tmp/iteration7b-*`. Failure diagnostics and context are preserved under `/tmp/iteration7b-evidence/`; the initial passing full-run trace is `/tmp/iteration7b-diagnostics/baseline-trace.zip`. These are temporary local artifacts, not permanent hosted evidence. Failure capture used event logs/error context, not a claimed failing trace. Passing traced repetitions retain browser snapshots where available. Existing tests regenerate historical screenshot outputs; those generated changes are restored before committing, preserving historical documents/images.

## Validation

Validated the accepted baseline, two-file diff, unchanged historical 7A report and responsive suite, relative links, fenced Markdown structure and `git diff --check`. Generated historical screenshots are restored rather than committed. Both author and committer must be `Ravin1010 <75482385+Ravin1010@users.noreply.github.com>` with no co-author trailer; actual commit metadata and clean working-tree verification are reported in the PR. Actual PR CI results are reported there after its commit exists.

## Remaining limitations

A reproduced readiness failure supports this narrow test synchronization correction. Repeated clean execution is evidence within the tested environment, not a guarantee against every future focus/timing failure. The diagnostic instrumentation itself can influence timing. No claim is made that every historical failure has identical causation.

Existing nonfatal production-build notices remain: optional ox/Tempo `node:worker_threads` browser externalization and the entry bundle exceeding 500 kB. They were not suppressed.

No alternate-engine/version, physical-device, real MetaMask or screen-reader session was performed in 7B. Broader browser/device, keyboard/screen-reader accessibility and independent security acceptance remain outstanding. No formal WCAG compliance or comprehensive production acceptance is asserted. Browser wallet operations used existing mocks only; no public-chain transaction, deployment, real-wallet permission request or signature occurred.
