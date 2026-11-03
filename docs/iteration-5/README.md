# Iteration 5 — confirmed crowdfunding transactions

Baseline: `a9df8c94843965beca6b1627be7b2b77fcdb8d6e`. Branch: `feature/iteration-5-transaction-flows`.

The accepted frontend now exposes exactly five explicit contract actions: createCampaign, contribute, withdrawFunds, claimRefund and cancelCampaign. Solidity source, contract tests, compiler settings and Solidity dependency revisions are unchanged. No public-chain deployment, backend, additional application dependency or new state-management layer was introduced.

## Implementation

- `web/src/blockchain/abi.ts`: generated directly from the accepted Foundry artifact's full ABI, preserving reads and adding actual write/event/error entries. The local Anvil runner asserts exact equality with the compiled ABI before deployment.
- `transaction-model.ts`: typed operations and immutable submission context, exact wei/day validation, confirmed creation-event matching, safe error messages and targeted query matching.
- `transactions.ts`: one focused hook for validation, a single wallet submission, public receipt observation and authoritative reconciliation.
- `web/src/Transactions.tsx`: existing detail-panel action controls and accessible status/error feedback.
- `web/src/App.tsx`: activate the existing creation form only in live mode and place controls in the original detail panel. Demo forms/campaigns remain non-transactional.
- Focused Vitest/browser fixtures/scenarios, a standalone local Anvil runner, minimal CSS for feedback/wrapping, package script and AGENTS iteration boundary.

Existing wagmi **3.7.9**, viem **2.57.14** and TanStack Query **5.105.1** are reused. Package dependencies and lockfile are unchanged; package.json only adds `test:anvil`.

## State and submission safety

The transaction hook's state is the authoritative UI phase: `idle`, `awaiting_signature`, `pending_confirmation`, `confirmed`, `rejected`, `reverted`, or `error`. A confirmed state separately records whether refresh is in progress, succeeded or failed. Refs serialize submission/receipt checks and retain the confirmed retry context; they do not store a second campaign ledger.

Before submission, the hook captures wallet account, Sepolia chain ID, configured contract and operation/campaign. It checks live configuration, actual public RPC chain, connected wallet/network and inputs. Creation probes campaignCount to validate the configured contract interface; this count is **never used to derive the new ID**. Other actions read the latest campaign and block timestamp; refunds also re-read the caller's contribution. Creator/status/withdrawn/deadline/remaining-goal checks precede the wallet request. The account/network is rechecked after asynchronous validation.

Each function uses the compiled ABI's typed `encodeFunctionData` and wagmi's `getWalletClient`. The wallet is sent exactly one standard `eth_sendTransaction` request with explicit from/to/chainId, exact payable value where applicable and `retryCount: 0`. This deliberately avoids viem's convenience-send fallback from eth_sendTransaction to wallet_sendTransaction after some invalid-input/provider errors, which could otherwise open a second wallet request. Rejection, insufficient balance and decoded custom reverts are not retried automatically.

No transaction starts from mount, polling, deadline expiry, account changes, connection restoration or network switching. Connecting and submitting are separate explicit actions. The accepted silent wallet reconnection and explicit Switch to Sepolia control remain unchanged.

A synchronous lock prevents duplicate clicks before React renders a disabled button, including under Strict Mode. Confirmed actions remain locked through failed refreshes. After a fully successful refresh, a separate “Choose another action” resets only transaction/input UI state; eligibility still comes from contract reads. The create form never automatically resets into a second submission.

## Receipts and feedback

Signature and hash availability do not count as success. After the wallet hash arrives, the public client waits for one successful receipt. Feedback shows the original submission wallet/campaign and hash; public Sepolia RPC configurations get an Etherscan link, while localhost verification hashes do not masquerade as public explorer transactions.

Receipt status `reverted` produces failure feedback. Receipt timeouts or temporary RPC loss remain `pending_confirmation`, retain the original hash and disable resubmission. “Check confirmation” is read-only. A replacement hash is conservatively reported as unresolved rather than claiming the original action succeeded.

After receipt success, the hook marks the transaction confirmed and refreshes the affected queries. Failed refresh displays **“Transaction confirmed, but the latest campaign data could not be loaded.”** The original hash is preserved. “Retry data refresh” only refetches; it never sends a second transaction. There are no raw provider JSON dumps in product feedback. Common contract custom errors, wallet rejection and insufficient ETH/gas have concise messages, including nested MetaMask data.originalError wrappers.

Transaction context remains associated with its original wallet/chain/contract even if the current wallet changes, switches network or disconnects. Current-wallet contribution hooks retain their accepted identity isolation. Public receipts can complete without a connected wallet. Pending transaction tracking is **page-session only**, not persisted across reloads/navigation; save the hash and use wallet/explorer history if leaving a pending page.

## Five workflows

1. **Create**: nonempty title/description; positive ETH with at most 18 decimals and uint256 bounds; 1–30 whole days converted by bigint multiplication to seconds. After receipt success, decode CampaignCreated from logs of the configured contract, matching creator and goal. Only a single unambiguous positive campaign ID is accepted. Missing/foreign/malformed/ambiguous events remain a confirmed transaction with unresolved ID; no campaignCount guess. Refetch the new campaign before offering its link. No fabricated card is appended.
2. **Contribute**: exact parsed wei must be positive and no greater than the remaining goal, with a second check against fresh campaign data and block time before the wallet opens. The entered amount is never silently reduced. Funding and the wallet record update only through authoritative reads; exact goal funding remains Active until the contract reports deadline success.
3. **Withdraw**: creator on Sepolia, Successful, not withdrawn. Receipt success triggers detail refresh; “Successfully withdrawn” and removal of the button depend on the returned withdrawn flag. Historical amountRaised is preserved.
4. **Refund**: Failed/Cancelled plus a positive current-wallet contribution. Receipt/refetch confirms zero, removes eligibility, and shows refund confirmation without erasing historical raised funds. An initial zero record is not labeled as a previous refund.
5. **Cancel**: creator, Active, before deadline, including fully funded Active campaigns. An explicit inline confirmation explains individual pull refunds before the wallet request. Cancelled status and refund eligibility follow refreshed reads; no automatic refunds occur.

Creators can also contribute and claim eligible refunds; roles are not mutually exclusive. Demo mode retains local validation and disabled transaction controls.

## Targeted query reconciliation

The existing wagmi query keys retain chain/contract/campaign/account separation. Before loading post-receipt state, older affected in-flight reads are cancelled, matching cache entries are invalidated, and active affected queries are refetched with errors propagated. Unrelated chains/contracts/wallets are not globally invalidated. Imperative creation reads use wagmi's bigint-aware hashFn, preserving the same cache identity as hooks.

| Action | Affected queries |
| --- | --- |
| Create | campaignCount, campaign lists, confirmed new campaign ID; explicit count/new-campaign fetch when no observer is mounted |
| Contribute | selected campaign detail/status, list batches containing it, original submitting wallet's contribution |
| Withdraw | selected campaign detail/status and withdrawn state |
| Refund | selected campaign detail/status and original wallet's contribution/eligibility |
| Cancel | selected campaign detail/status and list batches containing it |

Inactive relevant entries are marked stale for their next observer. Wrong-network/disabled wallet reads are not displayed as confirmed. No wallet balance is displayed, so no balance query is added. Events do not increment totals; reads remain the only source for financial data. Polling/manual refresh stay read-only.

## Verification

From `web/`:

```sh
npm ci
npm run typecheck
npm run build
npm test
npx playwright install --with-deps chromium
npm run test:browser
```

From `contracts/`:

```sh
forge fmt --check
forge build
forge test -vvv
```

Local results:

| Check | Result |
| --- | --- |
| npm ci / typecheck / production build | Passed |
| Vitest | **55 passed, 0 failed** (26 accepted cases plus transaction validation/event/error/reconciliation cases) |
| Playwright | **60 scenarios passed, 0 failed** (25 accepted wallet/read scenarios plus 35 transaction scenarios) |
| Foundry fmt / build / test | Passed; **43 passed, 0 failed, 0 skipped**, including 256 fuzz runs |
| Temporary local Anvil | **2 UI lifecycles passed**, 7 real crowdfunding writes, receipt/read agreement, no page errors |
| Exact ABI comparison / git diff --check | Passed |

The cloud uses `/usr/bin/chromium` via PLAYWRIGHT_CHROMIUM_EXECUTABLE and a writable npm cache. Foundry **1.5.0** and native Solidity **0.8.20** were installed under /tmp; FOUNDRY_SOLC selects the pinned compiler without changing repository configuration. The existing frontend CI automatically discovers the added unit/browser files; Foundry CI is unchanged.

Browser coverage includes creation validation/rejection/pending/success/event identity/missing event/duplicate-card prevention; exact funding, zero/excessive/precision rejection and funding/deadline races; withdrawal and refund eligibility/history/double-click prevention; fully funded cancellation and explicit confirmation; receipt revert versus success; insufficient gas/funds; confirmed-but-stale refresh/retry; pending timeout/check without resubmission; wrong network/separate connect/submit; account/network/disconnect changes during confirmation; no automatic requests under polling/Strict Mode; and viewport overflow at 375/768/1440px.

### Reproduce real local Anvil verification

Compile the accepted contract first. With Anvil available on PATH and a Playwright Chromium installed:

```sh
cd web
npm run test:anvil
```

In this cloud run, ANVIL_BIN pointed to `/tmp/iteration5-bin/anvil` and PLAYWRIGHT_CHROMIUM_EXECUTABLE to `/usr/bin/chromium`.

The runner launches Anvil on **127.0.0.1:18546**, chain ID 11155111, installs viem's pinned canonical Multicall3 fixture for Sepolia-style batched reads only on that local chain, and deploys the **unchanged accepted crowdfunding bytecode**. It launches an isolated Vite process on 127.0.0.1:5175 using that actual local address/RPC. The EIP-1193 authorization adapter is simulated; transactions are sent to Anvil's unlocked accounts and receive real receipts. No private keys are read or committed. All child processes close after verification.

The two lifecycles run through browser controls:

- Create → exact-goal ETH contribution → advance local time/mine → successful creator withdrawal. Contract withdrawn/status/history and UI agree.
- Create → partial contribution → explicit cancellation → individual refund. Contract status/history/contribution and UI agree; final contract balance is zero.

The runner asserts seven crowdfunding submissions, one explicit authorization, no standalone message-signing or network-switch requests, exact ABI equality, and zero browser page errors. Results are recorded in [anvil-results.json](anvil-results.json). This is real **local** contract verification, not a Sepolia deployment test. The standalone Anvil runner is locally verified; the normal CI jobs run unit/browser mocks and Foundry tests.

## Actual browser evidence

All captures are actual Chromium rendering. Files prefixed **simulated-** use deterministic mocked wallet/JSON-RPC responses and must not be presented as public-chain activity. Anvil images use actual local contract reads/receipts with a simulated EIP-1193 authorization adapter. The application retains Sepolia chain metadata on local verification chains; these are not public Sepolia addresses or hashes.

| State | Desktop 1440px | Tablet 768px | Mobile 375px |
| --- | --- | --- | --- |
| Simulated create pending | [Desktop](screenshots/simulated-create-pending-1440.png) | [Tablet](screenshots/simulated-create-pending-768.png) | [Mobile](screenshots/simulated-create-pending-375.png) |
| Simulated contribution pending | [Desktop](screenshots/simulated-pending-1440.png) | [Tablet](screenshots/simulated-pending-768.png) | [Mobile](screenshots/simulated-pending-375.png) |
| Simulated contribution confirmed/refreshed | [Desktop](screenshots/simulated-confirmed-1440.png) | [Tablet](screenshots/simulated-confirmed-768.png) | [Mobile](screenshots/simulated-confirmed-375.png) |

Also captured: [simulated confirmed-but-stale data](screenshots/simulated-confirmed-refresh-error-mobile.png), [real local withdrawal](screenshots/anvil-withdrawn-desktop.png), [real local refund](screenshots/anvil-refunded-mobile.png). Viewport contribution captures are successive explicit 0.1 ETH simulations, with no new contribution reflected while its own receipt is pending.

## Limitations and scope

No contract was deployed to **Sepolia or mainnet**, and no real MetaMask extension popup/public-chain transaction was verified. The local Anvil authorization adapter and deterministic browser wallet are explicitly test fixtures. Actual public RPC availability/CORS/rate limits and extension UX remain environment constraints.

Receipt confirmation uses one block; deeper confirmation/reorg reconciliation and persistent pending/replacement tracking are not claimed here. A replaced hash stays unresolved rather than being falsely attributed to the original action. A confirmed create with no matching event remains confirmed with no guessed link. Ordinary links perform full reloads, so pending feedback is not guaranteed after navigation; wallet authorization continuity remains supported.

The production build passes with the pre-existing optional ox/Tempo worker_threads externalization notice and a ~636 kB minified entry (~192 kB gzip) chunk warning. They are not suppressed. Existing GitHub Node action runtime and local NO_COLOR/FORCE_COLOR notices are unrelated to transaction behavior.

No contract logic/test/dependency/compiler changes, public deployment, backend, fees, proxy, indexer, WebSocket, optimistic financial state, automatic transaction retry, merge/auto-merge, or Iteration 6 work occurred. The permanent Ravin1010 author/committer and no-co-author rules remain in force.
