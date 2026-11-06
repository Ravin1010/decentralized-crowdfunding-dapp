# Iteration 7E — accessible names for brand and featured links

## Baseline, scope and production boundary

Accepted `main`: `2bc38927843303de135ff187f42142163fbe7abe`. New branch: `feature/iteration-7e-accessible-link-names`, independent of draft [PR #16](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/pull/16). PR #16 remains draft/unmerged and its source/tests/history are not edited here. No merge, production deployment, Vercel/RPC change, wallet permission/signature, network switch or public-chain transaction is performed.

Only [components.tsx](../../web/src/components.tsx), [App.tsx](../../web/src/App.tsx), [one new focused test](../../web/tests/accessible-link-names.spec.ts), this report and **one genuinely outdated exact-name locator** in [the existing responsive test](../../web/tests/responsive-acceptance.spec.ts) change. CSS/tokens, contracts/ABI, financial logic, dependencies/lockfile, workflows and historical reports remain unchanged.

**Candidate evidence is not production resolution.** The original six production axe failures remain failures. Production remediation requires separate review, authorized integration/deployment verification and new production evidence; none is inferred from local scans.

## Exact inherited 7D failure evidence

[Completed production run 42173114375](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42173114375), source `03728af7d0704ff63ca119e19859d012bac34617`:

- Windows Chrome **157.0.8103.39**, Windows Server 2025: **6 passed**.
- Linux Chromium **156.0.8078.4**, Ubuntu 24.04.5, axe-core **4.14.0**, 1440×900: **14 passed, 6 failed, 0 skipped**.
- All six scans failed on **`label-content-name-mismatch`**, serious impact, WCAG 2.5.3 Label in Name. Routes: `/`, `/campaigns`, `/campaigns/1`, `/campaigns/2`, `/create`, plus invalid `/create` state.
- Actual targets: `.header-inner > .brand[href="/"][aria-label="DeCen Crowdfund home"]`, its footer counterpart, and homepage `.feature-cover-link`. Diagnostic: **“Text inside the element is not included in the accessible name.”**

The [Linux evidence artifact](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42173114375/artifacts/13481089302) contains original screenshots/full results/traces, with finite retention to 20 November 2026. This is recorded historical evidence, not a new production scan by 7E. No historical failure is converted into a pass.

## Investigation before editing

The accepted React markup, CSS and axe 4.14 implementation were inspected. A temporary isolated Playwright investigation rendered **unmodified baseline source** in both demo and mocked-live modes, captured browser ARIA snapshots/DOM/visible text and ran the same full WCAG-tagged axe scan used in 7D. Both homepages reproduced the same three affected targets. Only after this reproduction, a temporary DOM-only semantic experiment tested the proposed approach; each experiment returned zero axe violations. Production was not used as a candidate server.

### Brand

Baseline link: `<a className="brand" href="/" aria-label="DeCen Crowdfund home">`. The `aria-label` overrides its text-derived name. Browser-computed name: **DeCen Crowdfund home**. The visible monogram contains `d` and nested `c`, already `aria-hidden="true"`; the wordmark contains `DeCen` immediately followed by the `CROWDFUND` span. Raw baseline `textContent`: **`dcDeCenCROWDFUND`**. Actual `innerText` has visual line breaks between those pieces. `.brand-sub { display: block }` creates a visual second line, not a literal text-node word separator.

Axe's visible-label check uses on-screen text, independently of screen-reader hiding, and recursively joins text nodes. Thus decorative visible characters and unseparated wordmark text can disagree with the explicit overriding name. Simply capitalizing/changing the aria-label is not a sufficient diagnosis. Making the decorative monogram spoken, duplicating the brand or drawing a replacement logo is unnecessary.

### Featured cover

Baseline accessible name comes from `aria-label={\`Discover ${c.title}\`}`. `Cover()` sets `aria-hidden="true"` on the entire cover. Its **visible** text is the cover note, cover title and `A COMMUNITY IDEA`; the illustration `<i>` elements have no text and the arrow SVG is already hidden. The visible cover title is not necessarily the campaign's actual title. For example, the demo uses **Room for every story.** while its campaign title is **A little library. A bigger world.** Mocked-live artwork uses **Campaign #1** while the campaign title is **Verified community project 1**.

The overriding name mentions a different string and hides all cover text from the accessible tree, although that text is the visible label of this particular focusable link. Removing its aria-label alone would leave an empty accessible name; hiding additional content or merely renaming it Discover would not solve this correctly.

## Selected minimal corrections

- **Brand:** remove the overriding aria-label and add an explicit space between `DeCen` and the block `CROWDFUND` span. The link takes its name from meaningful visible text: **DeCen CROWDFUND**. The monogram remains hidden/decorative, destination remains `/`, and no focusable element or repeated spoken brand is added. This is standard name-from-content semantics, not an axe exclusion; exact names and visible-wordmark inclusion are independently asserted.
- **Featured cover:** remove the overriding aria-label and expose the existing visible cover text **only at the homepage link**. `Cover` gains `decorative?: boolean`, default **true**; only Home passes `decorative={false}`. Other cards/detail covers retain their original hidden behavior. Empty CSS artwork and the hidden arrow retain their decorative semantics. The link name now comes from its own visible content in order.
- The existing title link, circular View link, three-link count, destinations, title/status/progress and artwork remain unchanged. No second focusable link or copied hidden label is introduced.
- The existing responsive suite has one exact-name lookup for **DeCen Crowdfund home**. Only that string changes to **DeCen CROWDFUND**; Tab actions, order and focus assertions are preserved. Other existing main-branch tests need no changes. The new spoken name is a deliberate consequence of correct content semantics, not an alias retained through redundant announcements.

### Observed before/after names

| Link / context | Browser-computed baseline name | Corrected candidate name |
| --- | --- | --- |
| Header/footer brand | DeCen Crowdfund home | **DeCen CROWDFUND** |
| Demo featured cover | Discover A little library. A bigger world. | **THE LITTLE LIBRARY PROJECT Room for every story. A COMMUNITY IDEA** |
| Mocked-live featured cover | Discover Verified community project 1 | **ORIGINAL ARTWORK · NO CAMPAIGN IMAGE Campaign #1 A COMMUNITY IDEA** |

These values are actual ARIA snapshots, not inferred labels. The separate campaign-title and circular links retain their previous names; natural cover labels are not claimed to be the campaign's distinct title.

## Focused regression and layout evidence

Four new Playwright cases cover **demo/mocked-live × 1440/375 px**. Each checks both header/footer brands across home, campaign detail and create, semantic role/destination, exact visible-wordmark name, decorative monogram, clipping/obstruction, and keyboard reachability. Homepage checks cover visible-text-derived name, the campaign destination, original title/circle links, exactly three featured links and no nested/further focusable control. Public mocks/read-only RPC assertions and permission/signing/switch/write-method checks remain in place; no wallet action is activated.

The first focused run passed **4/4**. The new test file increases full Chromium discovery from **127 to 131**, without changing the 57-case responsive suite count.

Temporary before/after visual capture compared header-brand and featured-cover crops in both modes at both widths: **8 cropped renders were pixel-identical**, and all eight corresponding geometry samples were identical. These are real local browser captures in `/tmp/iteration7e-validation/visual/`, not tracked screenshots, whole-page pixel-equivalence claims or production/device evidence. Footer clipping/hit testing is covered by the focused cases; footer crops are not included in that pixel comparison. No CSS or design token changed.

## Isolated candidate axe validation

Axe 4.14.0 from draft PR #16's already installed dependency was copied into a **temporary `/tmp/iteration7e-validation` environment**, alongside existing Playwright 1.64.1 resolution. It is not added to this branch's package files and is not imported by the committed focused tests. The accepted Playwright server configuration supplies local demo and mocked-live candidate pages; no production URL or deployment is substituted.

Seven full scans executed: demo homepage; mocked-live home/list/detail #1/detail #2/create; and invalid create recovery with required fields still invalid. Detail #2 uses the existing Successful/full/withdrawn fixture. These are deterministic fixture profiles, not an exact production payload replay. The original 7D rule selection is unchanged:

```ts
new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
  .analyze();
```

**7 passed, 0 failed, 0 skipped; zero detected violations in every candidate scan.** No disabled rules, excluded targets, retries, skipped scans or changed axe configuration. Full results include incomplete color-contrast checks requiring review; zero detected violations does not mean every possible contrast condition was resolved. The same code/rules reproduced baseline failures before the semantic experiment. A successful candidate scan does not erase the six production failures or prove screen-reader speech/full WCAG conformance.

Local environment: Debian 13, Node 24.19.0, npm 11.9.0, system Chromium 154.0.8037.57, Playwright 1.64.1. Baseline/experiment, visual comparison and candidate scan logs are `/tmp/iteration7e-before.log`, `/tmp/iteration7e-before-visual.log`, `/tmp/iteration7e-after-visual.log`, `/tmp/iteration7e-candidate-axe.log` and JSON `/tmp/iteration7e-candidate-axe.json`; temporary outputs are not permanent hosted evidence URLs.

## Regression execution record

Local checks passed:

| Check | Executed result |
| --- | --- |
| Locked install, TypeScript typecheck, production build | Passed |
| Unit tests | **57 passed, 0 failed** |
| Full Chromium browser regression | **131 passed, 0 failed, 0 skipped** (127 accepted + 4 new) |
| Separate responsive/accessibility smoke suite | **57 passed, 0 failed, 0 skipped** |
| Final separate focused link-name run | **4 passed, 0 failed, 0 skipped** |
| Isolated full candidate axe scans | **7 passed, 0 failed, 0 skipped** |
| Foundry formatting/build/tests | Passed; **43 passed, 0 failed, 0 skipped** |

Hosted PR CI outcomes, including actual Firefox/WebKit execution, will be added from completed job logs. No local Firefox/WebKit result is inferred from Chromium. Commands:

```sh
cd web
npm ci --no-audit --no-fund
npm run typecheck
npm run build
npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser -- --browser chromium
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser -- responsive-acceptance.spec.ts --browser chromium
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser -- accessible-link-names.spec.ts --browser chromium
```

Foundry: `forge fmt --check`, `forge build`, `forge test -vvv` using existing local Foundry 1.5.0 and native solc 0.8.20 (`/tmp/iteration7d-bin`, `FOUNDRY_SOLC=/tmp/iteration7d-solc/solc-0.8.20`). No dependency revision or configuration change. New browser counts are reported as 131, not the old 127; exact executed outcomes and separate hosted Firefox/WebKit results are recorded only after completion. Historical screenshots regenerated by accepted tests are restored before committing, not added as changes.

## Review and future production verification

No production remediation is claimed. After separate review/authorization, accepted integration, a verified corresponding deployment and new unchanged-rule production scans are required to close the original six failures; retain their historical source/counts. No integration, deployment or production workflow dispatch is executed here.

PR #16's separate keyboard test still refers to the old exact brand name. It is **not modified in 7E**; future 7D integration review must account for that genuinely outdated locator under appropriate authorization while preserving assertions. The production workflow and axe rules must not be weakened. A candidate axe pass alone does not guarantee that the entire old 7D suite, including its legacy locator, will pass unchanged.

Physical-device, actual spoken-screen-reader, real-wallet and comprehensive security acceptance remain unverified. Scope/Markdown/relative-link/whitespace and commit-identity checks accompany this PR; every new author/committer must be `Ravin1010 <75482385+Ravin1010@users.noreply.github.com>` without co-author trailers. Both PRs remain open/unmerged; PR #16 remains draft.
