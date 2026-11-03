# Checkpoint 6A — release-readiness review

Accepted remote `main` baseline: `537f2b5f7d5a088f9562e0b47f5c2b3799a3420f`. Branch: `feature/iteration-6a-release-readiness`.

**Assessment:** no release-blocking contract defect was identified by this review and local regression. The MVP is ready for deployment review, subject to explicit future deployment authorization and the live verification gates below. No public-chain deployment/transaction, actual MetaMask extension test, independent audit or production acceptance is claimed.

## Review and minimal corrections

Reviewed the product/design/architecture/test documents, accepted contract/tests/artifact and full frontend ABI, public/wallet reads, wallet continuity, all five transaction flows, query identity/invalidation, existing workflows, and Iteration 5 local evidence/limitations.

- **Configuration correction:** only an empty address selects demo mode. A malformed or zero nonempty address now displays an accessible configuration error without sample campaigns or enabled reads. Valid address plus missing code, incompatible interface or RPC failure continues to fail visibly without fallback. Runtime/source authenticity must additionally be verified by the deployment operator; a readable interface alone is not proof of authentic bytecode.
- **Pending-page notice:** submitted feedback now explicitly asks the user to save the hash and check wallet/explorer history before repeating the action after navigation. No transaction store, background monitor or persistence mechanism was added.
- Focused unit/browser regressions cover invalid configuration and pending navigation/reload without resubmission, another permission prompt, fabricated failure/success, or unconfirmed funding changes.
- Local Anvil verification adds exact deployed-runtime comparison and a distinct creator/two-contributor failed-campaign lifecycle, with two rejected authorization simulations. Solidity source/tests/settings/dependencies and committed ABI are unchanged. No dependency or CSS changes.

## Reproducible ABI and bytecode

Foundry **1.5.0** (`1c57854462289b2e71ee7654cd6666217ed86ffd`), native Solidity **0.8.20+commit.a1b79de6**, optimizer enabled **200 runs**, Shanghai EVM, viaIR false, IPFS metadata. OpenZeppelin **5.0.2**, revision `dbb6104ce834628e473d2173bbc9d47f81a9eec3`.

The full compiled ABI exactly equals `web/src/blockchain/abi.ts`: nine functions (four reads/five writes), five events and the actual custom errors. There is no argument-taking constructor, linked library, immutable substitution, admin, owner, fee, proxy or upgrade mechanism. ReentrancyGuard initializes storage without constructor arguments. A forced rebuild reproduced the bytecode fingerprints. Anvil-deployed runtime exactly equals the artifact's complete runtime, including metadata.

| Bytecode | Bytes | keccak256 |
| --- | --- | --- |
| Creation | 4030 | `0x202c464ec9e438aef048e3759d6a2def21492b9af4c773bc973c2c14c4cd1c52` |
| Runtime | 3997 | `0x5b1a0eabdf6cde465b6427bf7d7c2b6542fa748dbac6cd60543d80ba9ebededd` |

Sepolia (11155111) supports the compiled Shanghai instructions. Constructor-free deployment needs no initializer/administrative follow-up. The funding cap is enforced by `msg.value <= goal - amountRaised`; effective status remains Active before deadline even if full. Cancel precedes status calculation. Withdraw/refund use checks-effects-interactions, ReentrancyGuard and explicit successful ETH calls; failure rolls back settlement accounting. No contract alteration was necessary. The public contributions mapping getter returns zero for absent keys; explicit campaign detail/status reads reject invalid IDs.

## Transaction reconciliation

| Operation | Review outcome |
| --- | --- |
| Create | One explicit wallet request; exact typed inputs; confirmed event matched by contract/creator/goal; no campaignCount guess; new campaign fetched before link; list uses stable IDs. |
| Contribute | Positive parseEther wei, <= fresh remaining goal, fresh chain deadline/status; synchronous duplicate lock; no optimistic financial data; detail/list/original-account contribution refreshed after receipt success. |
| Withdraw | Creator, Successful after chain deadline, not withdrawn; returned flag removes eligibility; historical raised retained. |
| Refund | Failed/Cancelled and fresh positive submitting-account record; confirmed/refreshed contribution becomes zero and eligibility disappears; history retained. Progress/success/refresh failure remain distinct. |
| Cancel | Creator, Active before deadline, including fully funded Active; explicit confirmation; returned status drives UI; refunds remain individual. |

No mount/effect/poll/reconnect/deadline path invokes a write. Read-only refresh never resumes a queued action. Explicit connect and submit remain separate. Receipt success is required; hash/signature alone stays pending. Refetch failure remains confirmed with read-only retry. Context retains original account/chain/contract/campaign/hash while current wallet contributions remain query-isolated. Query reconciliation targets only affected methods/IDs/accounts; events do not also increment totals.

## Regression results

Executed with Node **24.19.0**, npm **11.9.0**, system Chromium and the pinned Foundry/compiler. Existing CI uses Node 22. No test coverage or assertions were disabled.

| Check | 6A result | Accepted baseline |
| --- | --- | --- |
| `npm ci`, `npm run typecheck`, `npm run build` | Passed | Passed |
| `npm test` | **57 passed, 0 failed** | 55 |
| `npm run test:browser` | **65 passed, 0 failed** | 63 |
| `forge fmt --check`, `forge build` | Passed, including forced recompilation | Passed |
| `forge test -vvv` | **43 passed, 0 failed, 0 skipped**, including 256 fuzz runs | 43 |
| `forge test --gas-report` | **43 passed, 0 failed** | 43 |
| `npm run test:anvil` | **3 lifecycles passed, 12 actual local crowdfunding writes**, 0 page errors | 2 lifecycles / 7 writes |

Unit delta: two invalid configured-address cases. Browser delta: invalid-config error path and pending reload/navigation safety. Anvil delta: one failed-campaign multi-wallet RPC lifecycle and five writes, supplementing the existing two browser-driven lifecycles/seven writes. The two unauthorized actions are **read-only simulations rejected with NotCreator/NoContribution**, not submitted public or local writes. Contract/Multicall3 fixture deployments are excluded from the crowdfunding write count.

Foundry gas report: deployment **939622 gas**, **4030 bytes** creation code. Function gas varies by state/caller/input; fuzz averages are not a live gas quote. Estimate the actual creation transaction and current fee budget before any future approved deployment. Security regressions pass for payout reentrancy, reverting recipients/rollback/retry, strict cap, deadline boundaries, duplicate settlement and independent campaign accounting.

Anvil evidence: [machine-readable local results](anvil-results.json). Successful UI lifecycle: create → exact-goal contribution → time advance → withdraw. Cancelled UI lifecycle: create → partial contribution → cancel → refund. Supplemental lifecycle: distinct creator/two contributors → underfunded deadline → individual refunds; the first refund preserves the second wallet's balance and both preserve historical raised. Final escrow is zero. Only temporary local accounts and localhost RPC were used.

## Browser and accessibility evidence

Actual Chromium checks exercised homepage, discovery, detail and create routes at **1440px, 768px and 375px**. Existing scenarios check disconnected/connected/wrong-network states, signature pending, chain pending, confirmed, reverted, confirmed-but-stale, refund and withdrawal completion; keyboard skip-link focus, reset focus, reduced motion and horizontal overflow. These are deterministic mocked wallet/RPC scenarios plus the real local Anvil lifecycles, not real MetaMask or public Sepolia testing. No full accessibility audit or screen-reader certification is claimed.

Only the two newly relevant mobile captures are added in 6A:

- [Invalid configuration — actual local browser, no deployed address](screenshots/configuration-error-mobile.png).
- [Pending navigation notice — simulated wallet/RPC](screenshots/simulated-pending-notice-mobile.png).

Existing visual references remain in [Iteration 4](../iteration-4/README.md) and [Iteration 5](../iteration-5/README.md). The regression runner regenerates historical captures locally; they are restored rather than replacing the accepted screenshot collection. Approved layouts, colors, typography and artwork remain unchanged.

## Configuration and deployment handoff

Empty address = labeled demo. Nonempty invalid address = error. Valid address = live path with actual RPC chain validation (11155111), no-code/interface failure and no sample fallback. Public reads are independent of MetaMask. Contribution data is scoped by chain/contract/campaign/current wallet and hidden on wrong network/disconnect/read failure. Foreground polling remains ~15 seconds and read-only. `VITE_` values are public and contain no secrets; no deployment address is invented.

Read the [manual deployment procedure](deployment.md), [blank evidence checklist](checklist.md), and [future 6B handoff](handoff-6b.md). The root README now documents the actual MVP and verification commands. Existing frontend/Foundry workflows remain unchanged: read-only permissions, feature push/main PR verification, pinned Foundry 1.5.0 and compiler 0.8.20. Standalone Anvil verification is local rather than part of CI.

## Limitations and future gates

- **Pending tracking is page-session only.** Leaving/reloading drops feedback but does not classify the transaction as failed/successful or resubmit it. Save the hash; use wallet activity/Sepolia Etherscan and authoritative state before repeating an action. A manual repeat after reload is not deduplicated across sessions. No persistent/replacement monitor is promised.
- One receipt confirmation; deeper reorg/finality handling and replacement tracking remain limited. A replaced hash remains unresolved. Missing creation events do not imply transaction failure or a guessed ID.
- No real MetaMask extension/public Sepolia RPC CORS, rate-limit, hosted SPA deep-link or live lifecycle verification has occurred. These are future acceptance gates, not locally established results.
- Existing nonfatal build warnings: optional ox/Tempo `node:worker_threads` externalization and ~637 kB minified entry (~192 kB gzip). Local color-environment warnings and existing CI Node-action runtime notices do not change test outcomes.
- No independent security audit. No public deployment, public ETH transfer, real-wallet artifact, secret handling, automatic wallet signing, merge/auto-merge or execution of 6B/6C.

No remaining release-blocking code defect was identified within the reviewed/tested scope. **Authorization, verified deployed runtime/source and real-wallet/hosted smoke testing are mandatory future gates.** Keep all deployment/live evidence fields blank until those gates are authorized and observed.
