# Checkpoint 6B — Sepolia deployment evidence

This checkpoint records an existing deployment and user-reported Codespaces checks. It is **documentation only**: no deployment, crowdfunding transaction, frontend configuration change, merge or secret handling was performed by this PR.

Accepted source/main commit: [`fd7a58366f0ac42deeaaf3a600ecaf2e703e37f5`](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/tree/fd7a58366f0ac42deeaaf3a600ecaf2e703e37f5).

Documentation branch: `feature/iteration-6b-sepolia-deployment-evidence`. The documentation head SHA is recorded in the PR, separately from the immutable deployment source SHA above.

## Deployment authorization

One Sepolia deployment was explicitly authorized in the preceding ChatGPT conversation before execution: the user responded **“proceed”** to a request to authorize **one** contract deployment. No stable external authorization permalink was captured. Live crowdfunding lifecycle transactions remain separately unauthorized.

That prior authorization covered the already executed deployment. This subsequent documentation-only PR neither performs nor authorizes another deployment or any crowdfunding transaction. An absent permalink is not an absent authorization.

## Evidence provenance

1. **Original Codex environment limitation (historical):** HTTPS requests to Sepolia Etherscan and PublicNode RPC were blocked by the managed environment with HTTP 403 at CONNECT, before an explorer response or JSON-RPC result. The original agent did not independently retrieve a receipt, block, deployed runtime, explorer verification result or campaign count. That historical limitation remains unchanged.
2. **Subsequent independent reviewer verification:** the reviewer subsequently checked the deployment through Blockscout, confirming the transaction, successful receipt, sender, contract, block/hash, timestamp and gas fields below. The reviewer recomputed both full creation and runtime bytecode hashes and confirmed exact matches to the accepted deployment artifacts. This correction records that supplied independent-review finding; it does not claim the original agent performed those public checks. The Blockscout API references are provided below.
3. **User-supplied Etherscan verification output:** the user's Foundry output confirms Etherscan **“Pass - Verified”**, Solidity **0.8.20**, optimizer **200 runs**. The independent reviewer did **not** directly recheck Etherscan's verification status. Blockscout chain verification must not be conflated with an independent Etherscan-status check.
4. **Independent local repository/artifact checks:** the accepted source SHA was confirmed against remote `main`; the original local forced build reproduced the accepted runtime hash and exact frontend ABI. These local checks are separate from the later reviewer chain checks.
5. **User-attested browser checks:** Codespaces/MetaMask observations below were performed by the user, not independently replayed by this agent or established by the Blockscout checks. The initial campaign count remains user-supplied, not a newly fetched current value.

## Confirmed deployment evidence

| Field | Recorded evidence | Provenance |
| --- | --- | --- |
| Network | Ethereum Sepolia, chain ID **11155111** | Subsequent independent Blockscout review |
| Source commit | `fd7a58366f0ac42deeaaf3a600ecaf2e703e37f5` | Accepted repository baseline; reviewer compared bytecode to accepted artifacts |
| Deployer | `0x8C710111bCfA5418289171c3b7B11665ddA50E7d` | Subsequent independent Blockscout review |
| Contract | `0x8627ffb5768CF5E47965E55F6855f8910b474A25` | Subsequent independent Blockscout review |
| Deployment transaction | `0xfec76744a082b6455d0cde1b18310d7c7657b05a7bc4eed78b5dfd848412560d` | Subsequent independent Blockscout review |
| Block number | **12053283** | Subsequent independent Blockscout review |
| Block hash | `0x7643fbead4a2270102eec6404bf8766754364b7051ec7743b851f04c4f0a52fd` | Subsequent independent Blockscout review |
| Deployment timestamp | **2026-11-03 13:43:24 MYT (05:43:24 UTC)** | Subsequent independent Blockscout review; Malaysia time conversion |
| Receipt | **Success** | Subsequent independent Blockscout review |
| Actual gas used | **6,498,902** | Subsequent independent Blockscout review; distinct from gas limit |
| Transaction gas limit | **6,551,648** | Subsequent independent Blockscout review |
| Unused gas capacity | **52,746** | Gas limit minus gas used; not additional gas consumed |
| Source verification | Etherscan **“Pass - Verified”** | User-supplied Foundry output; not directly rechecked on Etherscan by the reviewer |
| Compiler | Solidity **0.8.20**, optimizer **200 runs** | User-supplied Foundry verification output; accepted local settings checked |
| Creation bytecode | **4,030 bytes**, keccak256 `0x202c464ec9e438aef048e3759d6a2def21492b9af4c773bc973c2c14c4cd1c52` | Full hash recomputed by independent reviewer; matches accepted artifact |
| Runtime bytecode | **3,997 bytes**, keccak256 `0x5b1a0eabdf6cde465b6427bf7d7c2b6542fa748dbac6cd60543d80ba9ebededd` | Full hash recomputed by independent reviewer; matches accepted artifact |
| Initial `campaignCount()` | **0** | User-supplied initial observation; not a claim about current chain state |

Public verification references used by the independent reviewer:

- [Blockscout transaction API](https://eth-sepolia.blockscout.com/api/v2/transactions/0xfec76744a082b6455d0cde1b18310d7c7657b05a7bc4eed78b5dfd848412560d).
- [Blockscout contract API](https://eth-sepolia.blockscout.com/api/v2/smart-contracts/0x8627ffb5768CF5E47965E55F6855f8910b474A25).
- [Blockscout block API](https://eth-sepolia.blockscout.com/api/v2/blocks/12053283).

Additional reference: [Etherscan source page](https://sepolia.etherscan.io/address/0x8627ffb5768CF5E47965E55F6855f8910b474A25#code), corresponding to the user's Foundry verification output. This is not evidence of a direct reviewer Etherscan recheck.

### Independent local artifact result

The original `forge build --force` succeeded using Foundry **1.5.0**, Solidity **0.8.20+commit.a1b79de6**, optimizer enabled/**200**, Shanghai, viaIR false and IPFS metadata. OpenZeppelin remains pinned to **5.0.2**. The full compiled ABI exactly equals the committed `web/src/blockchain/abi.ts`; no ABI or configuration was changed.

The accepted compiled creation/runtime bytecode lengths and hashes above were reproduced locally and subsequently matched by the reviewer's full-bytecode recomputation. The contract has no constructor arguments. The original local comparison did not fetch public transaction input or deployed code; the later Blockscout verification is a distinct evidence source.

### Gas explanation: local reference versus upgraded Sepolia

The historical 6A local Foundry reference remains **939,622 gas**. The independent review confirms actual Sepolia gas used of **6,498,902**, a transaction gas limit of **6,551,648**, and **52,746** unused gas capacity. Gas used is not the gas limit or block/cumulative gas.

The [Ethereum Foundation's October 16, 2026 announcement](https://blog.ethereum.org/2026/10/16/glamsterdam-hoodi-announcement) confirms that Glamsterdam activated on Sepolia on **October 6, 2026** and includes EIP-8037 state-creation repricing. The article's later Hoodi postponement does not retract that Sepolia activation. [EIP-8037](https://eips.ethereum.org/EIPS/eip-8037) changes code-deposit state cost from **200 to 1,530 gas per byte**, alongside other state-creation/accounting changes. Both cited sources were read during this documentation correction.

For the **3,997-byte runtime**, that code-deposit repricing alone adds `3,997 × (1,530 − 200) = 5,316,010` gas. This substantially explains the observed `6,498,902 − 939,622 = 5,559,280` gas increase over the older local reference. It is **not a complete opcode-level gas reconciliation**; other changed charges and accounting require a full trace for exact attribution. No complete explanation of the remaining difference is claimed, and neither the historical reference nor actual gas used is replaced by the transaction gas limit.

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

1. Preserve the completed independent Blockscout receipt/block and full-bytecode verification above. Etherscan status remains supported by user-supplied Foundry output, not a direct independent reviewer check. A complete opcode-level gas trace is not part of this evidence record.
2. Provision and verify persistent frontend hosting, build/source provenance, public browser-safe RPC/CORS, HTTPS and SPA deep links. The current Codespaces preview is temporary.
3. Perform broader real-browser/device testing, including mobile/tablet, keyboard/focus, account switching, wrong-network/explicit switching, errors/stale data, and wallet continuity. The user-attested connect/disconnect/reconnect/refresh checks do not cover every case.
4. Obtain **separate explicit authorization** before any live crowdfunding lifecycle transaction. Create/contribute/cancel/refund/withdraw public smoke tests remain unperformed in this evidence record; their hashes and outcomes remain blank in the checklist.
5. Retain known MVP limits: page-session-only pending feedback, one-confirmation policy, limited replacement/reorg handling and no independent security audit. Save hashes before navigation and inspect receipts/current state before repeating an action.
6. Obtain independent PR review and explicit acceptance. This documentation PR grants no deployment, signing, spending, merge or final production acceptance permission.

Documentation validation includes the original local artifact/ABI comparison, verified EIP/activation references, gas arithmetic, `git diff --check`, relative-link checks, exact recorded identifiers, documentation-only diff and commit identity verification. Full frontend/Foundry/browser/Anvil regression is not rerun for a Markdown-only change; historical 6A test results remain historical. Any automatic CI results belong to this documentation PR and are reported separately.
