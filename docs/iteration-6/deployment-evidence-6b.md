# Checkpoint 6B — Sepolia deployment evidence

This checkpoint records an existing deployment and user-reported Codespaces checks. It is **documentation only**: no deployment, crowdfunding transaction, frontend configuration change, merge or secret handling was performed by this PR.

Accepted source/main commit: [`fd7a58366f0ac42deeaaf3a600ecaf2e703e37f5`](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/tree/fd7a58366f0ac42deeaaf3a600ecaf2e703e37f5).

Documentation branch: `feature/iteration-6b-sepolia-deployment-evidence`. The documentation head SHA is recorded in the PR, separately from the immutable deployment source SHA above.

## Evidence provenance

- **User-supplied deployment evidence:** the user confirms the deployment, receipt, Etherscan verification, on-chain runtime match and initial campaign count listed below. Public reference links identify the reported transaction/contract; supplying a link does not establish an independent recheck.
- **Independent repository/artifact checks in this checkpoint:** remote `main` exactly matched the accepted SHA; the branch starts there. A forced local build with Solidity 0.8.20 reproduced the accepted runtime hash and exact frontend ABI. These checks verify the source/artifact, not the current public chain.
- **Independent public-chain recheck unavailable:** HTTPS requests to Sepolia Etherscan and the public Sepolia PublicNode RPC were attempted through the environment's normal network path. Both were blocked by the managed network policy with HTTP 403 at CONNECT, before an explorer response or JSON-RPC result was received. No receipt, block, deployed runtime, explorer verification result or campaign count was independently retrieved here. This access limitation must remain visible until independent review supplies that evidence.
- **User-attested browser checks:** the Codespaces/MetaMask observations below were performed by the user, not replayed or independently observed by this agent. They are distinct from the local mocked/Anvil evidence recorded in 6A.

## Reported confirmed deployment

| Field | Recorded evidence | Provenance in this checkpoint |
| --- | --- | --- |
| Network | Ethereum Sepolia, chain ID **11155111** | User-supplied; public RPC recheck blocked |
| Source commit | `fd7a58366f0ac42deeaaf3a600ecaf2e703e37f5` | User-supplied deployment source; independently confirmed accepted repository baseline |
| Deployer | `0x8C710111bCfA5418289171c3b7B11665ddA50E7d` | User-supplied |
| Contract | `0x8627ffb5768CF5E47965E55F6855f8910b474A25` | User-supplied |
| Deployment transaction | `0xfec76744a082b6455d0cde1b18310d7c7657b05a7bc4eed78b5dfd848412560d` | User-supplied |
| Block number | **12053283** | User-supplied; block hash not supplied |
| Deployment timestamp | **2026-11-03 13:43:24 MYT (05:43:24 UTC)** | User-supplied UTC timestamp, with Malaysia time conversion |
| Receipt | **Successful** | User-supplied; raw receipt not independently retrieved |
| Gas used | **6,498,902** | User-supplied; reconciliation note below |
| Source verification | Etherscan **“Pass - Verified”** | User-supplied; explorer recheck blocked |
| Compiler | Solidity **0.8.20**, optimizer **200 runs** | User-supplied verification settings; local compiler/settings independently checked |
| Runtime keccak256 | `0x5b1a0eabdf6cde465b6427bf7d7c2b6542fa748dbac6cd60543d80ba9ebededd` | User reports exact on-chain runtime match; independently reproduced locally from accepted source |
| Initial `campaignCount()` | **0** | User-supplied initial observation; not a claim about current chain state |

Public references for independent review:

- [Contract and verified source](https://sepolia.etherscan.io/address/0x8627ffb5768CF5E47965E55F6855f8910b474A25#code).
- [Deployment transaction](https://sepolia.etherscan.io/tx/0xfec76744a082b6455d0cde1b18310d7c7657b05a7bc4eed78b5dfd848412560d).
- [Deployment block](https://sepolia.etherscan.io/block/12053283).
- [Deployer address](https://sepolia.etherscan.io/address/0x8C710111bCfA5418289171c3b7B11665ddA50E7d).

### Independent local artifact result

`forge build --force` succeeded using Foundry **1.5.0**, Solidity **0.8.20+commit.a1b79de6**, optimizer enabled/**200**, Shanghai, viaIR false and IPFS metadata. OpenZeppelin remains pinned to **5.0.2**. The full compiled ABI exactly equals the committed `web/src/blockchain/abi.ts`; no ABI or configuration was changed.

The accepted compiled runtime is **3997 bytes**, with the same keccak256 as the user's reported on-chain runtime hash above. Creation bytecode remains **4030 bytes**, keccak256 `0x202c464ec9e438aef048e3759d6a2def21492b9af4c773bc973c2c14c4cd1c52`. The contract has no constructor arguments. No claim is made that the public transaction input or deployed code was fetched by this local comparison.

### Gas evidence requiring reconciliation

The supplied receipt gas-used value **6,498,902** is recorded unchanged. The historical 6A local Foundry deployment reference was **939,622 gas**. These are different observations; the local reference is not a substitute for the actual receipt. An independent reviewer should inspect the transaction receipt's `gasUsed` and distinguish it from the transaction gas limit and block/cumulative gas fields. The reason for the difference is not established here. Do not silently replace either value or mark the discrepancy resolved without the actual receipt.

## User-attested Codespaces frontend and wallet checks

The user confirms:

- Live Sepolia mode loaded without demo campaigns.
- The initial campaign collection was empty.
- Public campaign reads worked without connecting a wallet.
- MetaMask connected successfully and displayed the connected address correctly.
- Sepolia chain **11155111** was recognized.
- Disconnect, reconnect and refresh passed.
- **No crowdfunding transactions were submitted** during these checks.

These observations establish a reported development-preview smoke check, not an independently reproduced browser session, full device matrix or live transaction lifecycle test. The Codespaces preview URL and exact frontend build/configuration evidence were not supplied and are not invented. **Codespaces preview is temporary development hosting, not permanent production hosting.** No preview URL, RPC credential, `.env` file or deployment configuration is committed by this PR.

## Historical boundary and outstanding checks

The [6A readiness report](README.md), [deployment preparation procedure](deployment.md), [original future handoff](handoff-6b.md) and [local Anvil report](anvil-results.json) remain unchanged historical records. Their statements that no public deployment occurred describe **Checkpoint 6A**. This later 6B record does not rewrite 6A as a deployment or relabel its mocks/Anvil evidence as Sepolia testing. The [checklist](checklist.md) now records the later evidence with provenance.

Outstanding items:

1. Independently retrieve the public receipt/block and deployed runtime, confirm sender/address/status/timestamp, reconcile gas used, verify source settings and compare complete runtime/ABI against the accepted source. Record the actual block hash; do not infer it.
2. Provision and verify persistent frontend hosting, build/source provenance, public browser-safe RPC/CORS, HTTPS and SPA deep links. The current Codespaces preview is temporary.
3. Perform broader real-browser/device testing, including mobile/tablet, keyboard/focus, account switching, wrong-network/explicit switching, errors/stale data, and wallet continuity. The user-attested connect/disconnect/reconnect/refresh checks do not cover every case.
4. Obtain **separate explicit authorization** before any live crowdfunding lifecycle transaction. Create/contribute/cancel/refund/withdraw public smoke tests remain unperformed in this evidence record; their hashes and outcomes remain blank in the checklist.
5. Retain known MVP limits: page-session-only pending feedback, one-confirmation policy, limited replacement/reorg handling and no independent security audit. Save hashes before navigation and inspect receipts/current state before repeating an action.
6. Obtain independent PR review and explicit acceptance. This documentation PR grants no deployment, signing, spending, merge or final production acceptance permission.

Documentation validation includes local artifact/ABI comparison, `git diff --check`, relative-link checks, exact recorded identifiers, documentation-only diff and commit identity verification. Full frontend/Foundry/browser/Anvil regression is not rerun for a Markdown-only change; historical 6A test results remain historical. Any automatic CI results belong to this documentation PR and are reported separately.
