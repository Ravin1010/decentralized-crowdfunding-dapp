# Iteration 8B — Security verification and release review

## 1. Scope, baseline and attribution

Verification-only review of `Ravin1010/decentralized-crowdfunding-dapp`, begun **2026-11-06 11:34:29 UTC**. Reviewed source and initial branch SHA: **`149d7fcb5b7e309d0417c4c1e6a69ab997f95da1`**. Fresh `origin/main` matched exactly; the tree was clean and the proposed branch/PR name had no existing work. Branch: `feature/iteration-8b-security-release-review`. Evidence commits add only this report and the [execution ledger](security-verification-8b.md); their exact head SHAs are recorded by Git/PR metadata, rather than a self-referential commit identifier in their own contents.

The GitHub API independently confirmed [PR #16](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/pull/16) is closed and merged at the reviewed baseline. Its head was `d8467b818d648f715aca6bd4d0bbd6efc41a6825`.

Fresh read-only Vercel API inspection resolved `decentralized-crowdfunding-dapp.vercel.app` to production deployment **`dpl_CW5Pw7F9UA1kxjHqe54JfAnhy8PX`**, project `prj_sVG75ZF0tWyEsMXDKcd7RTxGnJU7`, status `READY`, recorded Git source `main` at the exact baseline. Deployment hostname: `decentralized-crowdfunding-dapp-gghy9dypw.vercel.app`. This establishes API deployment-to-source provenance, not a cryptographic verification of browser assets. Project metadata reports Vite and Node `26.x`; local execution used Node 24 and accepted CI specifies Node 22. This is environment drift to review, not proof of the deployed build's actual Node executable.

The Sepolia contract `0x8627ffb5768CF5E47965E55F6855f8910b474A25` and its deployment/runtime match remain **historical evidence**, not a fresh chain-state assertion in 8B. See [6B deployment evidence](../iteration-6/deployment-evidence-6b.md), [6D lifecycle evidence](../iteration-6/live-lifecycle-evidence-6d.md), [6E follow-up](../iteration-6/acceptance-followup-6e.md), and [limited 6F wallet observations](../iteration-6/live-wallet-acceptance-6f.md).

Local environment: Debian 13, Node 24.19.0, npm 11.9.0, Python 3.12.14, Playwright 1.64.1, system Chromium 154.0.8037.57, Foundry 1.5.0 (`1c57854462289b2e71ee7654cd6666217ed86ffd`), Solidity `0.8.20+commit.a1b79de6`, optimizer enabled/200 runs, OpenZeppelin 5.0.2. Slither 0.11.6 used crytic-compile 0.4.2 and the same compiler. Exact commands, exit codes, scanner triage and temporary property-check source are in the ledger.

This is an agent-executed security review, **not an independent formal audit, proof, production acceptance or mainnet authorization**. No production code/configuration was changed. No live wallet interaction, public-chain transaction, deployment, signature or network switch was performed. Temporary property checks ran only in Foundry's local EVM. No secrets were retrieved or committed.

## 2. Threat model

Protected assets are escrowed Sepolia ETH; creator-only withdrawal/cancellation; individual refund eligibility; wallet permissions and submission intent; correct contract/RPC/chain identity; and production builds, dependencies and CI credentials.

Relevant adversaries include unauthorized callers, malicious payout receivers/reentrant contracts, contributors racing to fill a goal, spammers publishing expensive metadata, compromised RPC/hosting/dependencies/actions, and users accidentally resubmitting after loss of page-session feedback. Trusted boundaries include the chain's consensus/timestamps, configured Sepolia RPC, wallet/provider behavior, GitHub/Vercel access controls, and browser-delivered code. A public RPC reporting the expected chain ID is not a cryptographic guarantee of honest responses. The frontend cannot replace contract authorization.

## 3. Testing ledger and observed protections

| Fresh local execution | Actual outcome |
| --- | --- |
| Locked audit-only install, `npm ci --ignore-scripts --no-fund` | Exit 0; no manifest/lockfile changes |
| `npm audit --omit=dev --json` | Exit 0; 0 registry-reported vulnerabilities of every severity |
| `npm audit --json` | Exit 0; 0 registry-reported vulnerabilities of every severity |
| Foundry format/build | Both exit 0; initial build used cache, subsequent Slither forced recompilation confirmed solc 0.8.20 |
| `forge test -vvv` | 43 passed, 0 failed, 0 skipped |
| `forge test --fuzz-runs 2000 -vv` | 43 passed, 0 failed, 0 skipped; the existing funding/refund fuzz test ran 2,000 inputs |
| Temporary bounded stateful property check | 1 passed, 0 failed/skipped; 256 runs, 16,384 handler calls, 0 handler reverts; separate from the 43 accepted tests |
| Slither | Analysis succeeded; exit 255 with 4 reported results: 1 Low/Medium-confidence and 3 Informational/High-confidence |
| Frontend typecheck/build | Exit 0 each; existing worker-module externalization and 637.57 kB chunk warnings remain |
| Vitest | 57 passed, 0 failed, 0 skipped, across 2 files |
| Existing mocked Chromium suite | 131 passed, 0 failed, 0 skipped; no retries added |
| Compiled ABI versus committed frontend ABI | All 29 entries exactly match after canonical object-key ordering |
| Production GET/header/deep-link checks | Blocked locally: proxy CONNECT 403, curl exit 56, HTTP code 000; no origin headers obtained |
| Direct GitHub advisory API cross-checks | Blocked by the same proxy; no independent clean bill of health for viem/wagmi/OpenZeppelin inferred |

The npm audit metadata reports 28 production, 67 development and 47 optional dependencies, 114 total; categories overlap. Zero advisories is a point-in-time registry result, not an assertion of absent vulnerabilities or exploit reachability. There were no returned advisory IDs, severities, affected packages or fixed-version recommendations to enumerate. Solidity git dependencies are outside npm's audit scope. The independently accessible official Solidity bug list was used to triage Slither's compiler warning.

### Contract source and accounting review

Reviewed [contract](../../contracts/src/DecentralizedCrowdfunding.sol), [accepted tests](../../contracts/test/DecentralizedCrowdfunding.t.sol), pinned submodules and compiler configuration. Source-level protections, supported by the actual tests, include:

- Creation validation and sequential IDs (`:52–73`); strict cap, positive contributions and derived Active/deadline check (`:75–84`). Reaching the goal early stays Active; creator cancellation remains available before deadline, including fully funded campaigns (`:112–118`, `:135–140`).
- Creator-only Successful withdrawal, one-time flag, effects before external call, nonReentrant guard and explicit success check (`:86–97`). Refunds use only the caller's record, zero it before the call, revert on failed transfer, and preserve historical raised totals (`:99–110`). Unauthorized callers cannot select another recipient.
- Status is read-only; cancelled takes precedence; the exact deadline is no longer Active. No administrator, upgrade, owner sweep, contributor loop or automatic status transaction exists. Events follow accepted state updates; create IDs are sequential and funds are accounted per campaign, despite a pooled ETH balance.
- Reverting receivers leave accounting recoverable but do not guarantee eventual recipient liveness (F-02). Guarded payouts prevent nested withdrawal/refund; reentry into unguarded creation/contribution/cancellation remains subject to its own checks. Existing malicious-receiver tests passed; this is not exhaustive adversarial callback verification.
- Ordinary direct ETH has no receive/fallback entry point. Forced ETH can still create surplus without increasing `amountRaised`; the temporary property check exercised that case. There is no recovery mechanism for unsolicited surplus. Per-campaign payout limits do not treat that surplus as campaign funding.

The liability property sums Active raised funds, unwithdrawn Successful funds, and outstanding known-contributor balances for Failed/Cancelled campaigns. Successful historical contributions after withdrawal are not liabilities/refundable balances. The temporary model also checks historical raised totals against independent deposit counters, cap preservation, exact payout deltas, duplicate settlement rejection and surplus conservation. Its finite actors/values/sequences and early-return handler calls limit assurance; it is not formal verification.

### Frontend and transaction review

Reviewed [configuration](../../web/src/blockchain/config.ts), [providers](../../web/src/blockchain/providers.tsx), [reads](../../web/src/blockchain/reads.ts), [transactions](../../web/src/blockchain/transactions.ts), [transaction model](../../web/src/blockchain/transaction-model.ts) and [wallet controls](../../web/src/Wallet.tsx).

Preflight validates live configuration, public chain, connected account/network, current campaign, deadline, creator eligibility and current refund record (`transactions.ts:160–272`). Contributions preserve exact wei and recheck the remaining cap; races still require contract enforcement. The one explicit `eth_sendTransaction` request carries captured account, contract, chain ID and ABI-encoded data, with nonzero value only for contributions and retryCount 0 (`:276–344`). Creation parsing rejects zero/over-precision amounts (`transaction-model.ts:51–64`); created ID comes from a matching contract/creator/goal event, never a guessed count (`:66–91`).

Receipt success is required before authoritative refresh. Reverted receipts unlock as reverted; RPC timeout retains the hash as unresolved; replacement mismatches are not treated as original-action success (`transactions.ts:101–159`). Confirmed-but-stale is distinct from refreshed. Locks survive unresolved wallet switches; only completed/refreshed work can reset (`:28–50`). Wallet connection/switch controls are explicit (`Wallet.tsx:23–69`); restoration uses accepted wagmi behavior, backed by mocks rather than a new real-wallet session.

Queries are scoped by chain/address/campaign/account; wrong-network/disconnected contribution data is hidden and previous-wallet placeholder data is not used (`reads.ts:190–217`). Foreground 15-second reads are separate from write submission. Targeted invalidation is deployment/account-aware (`transaction-model.ts:201–250`). No optimistic increment of financial values or automatic wallet submission was identified in this review; 131 mocked scenarios passed, including wallet switching, pending reload and failed-refresh cases. This is not proof that all provider/race cases are covered.

Tracked configuration exposes only public Vite address/RPC settings, warns that VITE variables are public, rejects embedded URL credentials and invalid address/chain configuration, and does not silently fall back to demo after live read failure. Reviewed source/workflows and tracked filenames did not reveal private keys, seed phrases or secret-bearing Vite values. This was targeted source inspection, not an exhaustive secret-history scan or inspection of private production environment values.

## 4. Findings and reassessment

Severity below is contextual review triage, not a CVSS assessment. Assurance gaps are explicitly distinguished from demonstrated exploits. No scanner High/Critical result or exploitable fund-theft defect was demonstrated by this execution; that does not establish their absence.

| ID | Severity / status | Evidence, impact and proposed follow-up (not implemented) |
| --- | --- | --- |
| F-01 | Medium; source-confirmed engineering limitation, tested mock handling | `transactions.ts:23–26,101–159` uses one confirmation and page-session state. Reload loses tracking; replacement is reported unresolved, not comprehensively reconciled; no later reorg monitor. A user could misinterpret lost feedback or resubmit a still-pending action. Current locks, unresolved-hash messaging and mock tests reduce, but do not remove, this risk. Separately authorize stronger finality/replacement/persistence design and recovery acceptance before higher-value release. |
| F-02 | Medium; source-confirmed payout compatibility/liveness risk | Contract `:94–95,107–108`; accepted tests `:431–470` actually passed rollback/retry checks. A permanently rejecting creator contract can strand its Successful proceeds; a rejecting contributor cannot receive its refund. Failure is isolated and records remain intact; there is no alternate recipient/redirect. Document recipient compatibility; consider a separately reviewed future payout design only after authorization. No deployed-contract change was made or proposed as an automatic fix. |
| F-03 | Informational; evidence gap partially closed | Both npm scans now executed successfully; Slither produced four triaged results; extended fuzz and bounded stateful testing ran. This supersedes a source-only lack of execution evidence, not earlier historical results. Direct advisory API cross-checks, comprehensive compiler/dependency vulnerability analysis and a formal independent audit remain incomplete. Keep reproducible scans and independent review as release work; no package updates in 8B. |
| F-04 | Low; source-confirmed supply-chain hardening gap | Existing workflow `uses:` entries reference mutable `actions/checkout@v4/@v6`, `setup-node@v4`, `upload-artifact@v4`, `foundry-toolchain@v1`. All workflows declare contents:read; most disable checkout credential persistence, but `web.yml` leaves its default. Mutable tags can change executed CI code. Separately pin reviewed action SHAs/review updates; never infer branch protections from workflow permissions. No demonstrated compromise. |
| F-05 | Release assurance gate; unresolved, not a demonstrated vulnerability | Owner deliberately skipped 7F physical-device/accessibility and 8A complete real-wallet acceptance. Both remain **Not tested**. [7D automation](../iteration-7/automated-acceptance-7d.md), [manual scope](../iteration-7/manual-acceptance-7d.md) and user-attested 6F observations retain their separate provenance. No full real-wallet recovery matrix, spoken screen reader or independent formal audit is established. Security sign-off and explicit authorization remain required for broader release. |
| F-06 | Low; freshly source-confirmed documentation drift | `README.md:5,54,85–89` and `web/.env.example:2` still describe pre-deployment status/future hosting despite historical deployment evidence and fresh Vercel API provenance. This can mislead operators about the accepted release/configuration. Authorize a distinct documentation correction; do not rewrite 6A history. These existing files remain unchanged. |
| F-07 | Low; source-confirmed exposure, availability abuse not reproduced | Contract `:52–73` allows permissionless campaign creation and arbitrary-length nonempty title/description, subject to transaction/block gas. `reads.ts:95–119` bounds listing work to 12 deterministic IDs, mitigating count growth, but one large return payload can still pressure a page's RPC/render path (`allowFailure:false`). React renders text, not HTML injection in the reviewed paths. No spam/DoS experiment was conducted. Consider explicit metadata limits in a separately authorized future contract/UI design; document permissionless-content risks and RPC budgets. No unbounded settlement loop was found. |
| F-08 | Verification gap; headers/access controls inconclusive | Local proxy prevented all five public GETs; security-header presence/absence, current deep-link HTTP behavior and end-to-end TLS were not measured. Vercel API returned READY/source provenance and project protection metadata, not browser headers. Repository rulesets GET returned `[]`; classic branch-protection GET was 403 `Resource not accessible by integration`. Do not equate either limitation with absent protection. Obtain authorized read-only header and admin evidence separately. |

Slither's `timestamp` result is Low/Medium-confidence: deadline-based logic intentionally uses chain timestamps and boundary tests pass; timestamps are not randomness and should not be treated as exact wall-clock scheduling. Its two `low-level-calls` findings are Informational/High-confidence: accepted ETH pull payouts use guard + checks-effects-interactions + checked return, but retain F-02 recipient-liveness risk. Its Informational/High-confidence `solc-version` warning is retained with official bug conditions and source/settings triage in the ledger; it is not silently dismissed or an authorization to change the accepted compiler.

## 5. Release gates and risk decision

**Conditional experimental Sepolia review only; security acceptance remains open.** The executed checks add useful evidence for the accepted design. They do not authorize mainnet, unrestricted real-funds release, further testnet spending, remediation or deployment. Existing deployment evidence is not permission for new transactions.

Before a broader release: obtain independent security sign-off, resolve/accept the documented risks, verify hosted headers/access controls through an accessible read-only environment, review supply-chain/compiler advisories and build-version drift, and explicitly decide the skipped 7F/8A gates. Their owner-skipped status is not a pass. Pending/replacement/reorg, receiver liveness, metadata limits and historical documentation drift require conscious review. Physical-device, spoken-screen-reader, real-wallet and comprehensive security acceptance are not claimed.

## 6. Open work and independent review request

Review the findings, scanner triage, finite property model, actual CI logs and blocked checks in the [ledger](security-verification-8b.md). Any remediation must be a separate explicitly authorized change. Keep this PR **draft, open and unmerged**, with no auto-merge. This evidence submission does not constitute a finished/accepted security audit while the stated verification gaps and release gates remain open.
