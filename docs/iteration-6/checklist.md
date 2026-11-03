# Deployment and acceptance checklist — 6B evidence record

**No public-chain deployment occurred in 6A.** This checklist records the later authorized deployment, subsequent independent Blockscout verification and user-attested Codespaces checks. The [dedicated 6B evidence document](deployment-evidence-6b.md) distinguishes the original Codex limitation, later reviewer findings, user-supplied Foundry/Etherscan output and local artifact checks. This documentation update authorizes no transaction or deployment.

The original Codex environment blocked Etherscan/public RPC rechecks with HTTP 403 at CONNECT; that remains historical evidence. A subsequent independent reviewer verified the public-chain deployment through Blockscout. The reviewer did not directly recheck Etherscan status. Checked items below identify their provenance; unprovided evidence and unperformed lifecycle tests remain open.

## Preparation and provenance

- [x] 6A accepted in `main`; source baseline independently confirmed as `fd7a58366f0ac42deeaaf3a600ecaf2e703e37f5`.
- [x] Accepted source rebuilt locally with pinned compiler/settings; exact frontend ABI and compiled runtime hash independently reproduced.
- [ ] Operator's deployment-time clean checkout, signer/test ETH budget and command/fee review evidence supplied.
- [x] One Sepolia deployment was explicitly authorized in the preceding ChatGPT conversation before execution: the user responded **“proceed”** to the request for one deployment. No stable external authorization permalink was captured. Live crowdfunding lifecycle transactions remain separately unauthorized.
- [x] Subsequent independent reviewer verified transaction/receipt/block and recomputed both full bytecode hashes through Blockscout; matches accepted artifacts. This does not claim a direct reviewer Etherscan-status check.

## Deployment evidence

| Evidence | Recorded value / provenance |
| --- | --- |
| Accepted deployment source SHA | `fd7a58366f0ac42deeaaf3a600ecaf2e703e37f5` — source supplied by user; repository baseline independently confirmed |
| Deployment authorization / reference | One Sepolia deployment explicitly authorized before execution by the user’s **“proceed”** in the preceding ChatGPT conversation; no stable external permalink captured. This documentation work grants no further transaction authorization. |
| Deployment network and chain ID | Ethereum Sepolia, **11155111** — subsequent independent Blockscout review |
| Public deployer address | `0x8C710111bCfA5418289171c3b7B11665ddA50E7d` — subsequent independent Blockscout review |
| Contract address | `0x8627ffb5768CF5E47965E55F6855f8910b474A25` — subsequent independent Blockscout review |
| Deployment transaction hash | [`0xfec76744a082b6455d0cde1b18310d7c7657b05a7bc4eed78b5dfd848412560d`](https://sepolia.etherscan.io/tx/0xfec76744a082b6455d0cde1b18310d7c7657b05a7bc4eed78b5dfd848412560d) — subsequent independent Blockscout review |
| Receipt status | **Success** — subsequent independent Blockscout review |
| Block number / block hash | **12053283** / `0x7643fbead4a2270102eec6404bf8766754364b7051ec7743b851f04c4f0a52fd` — subsequent independent Blockscout review |
| Deployment timestamp | **2026-11-03 13:43:24 MYT (05:43:24 UTC)** — subsequent independent Blockscout review |
| Actual gas used | **6,498,902** — subsequent independent Blockscout review; distinct from gas limit (6A local reference: 939,622 gas) |
| Transaction gas limit / unused capacity | **6,551,648** / **52,746** — reviewer-verified limit minus used; unused capacity is not gas consumed |
| Compiler / optimization | Solidity **0.8.20**, **200 runs** — user-supplied Foundry/Etherscan output; accepted local settings independently checked |
| Creation bytecode fingerprint | **4030 bytes**, keccak256 `0x202c464ec9e438aef048e3759d6a2def21492b9af4c773bc973c2c14c4cd1c52` — independent local artifact and full creation-bytecode hash recomputed by subsequent reviewer |
| Runtime bytecode fingerprint | **3997 bytes**, keccak256 `0x5b1a0eabdf6cde465b6427bf7d7c2b6542fa748dbac6cd60543d80ba9ebededd` — independent local artifact and full runtime-bytecode hash recomputed by subsequent reviewer |
| Bytecode match result | Independent reviewer recomputed both full creation and runtime hashes and confirmed exact matches to accepted deployment artifacts; original local hashes reproduced separately |
| Source verification | [Sepolia Etherscan verified source](https://sepolia.etherscan.io/address/0x8627ffb5768CF5E47965E55F6855f8910b474A25#code), **“Pass - Verified”** — user-supplied Foundry output; no direct independent reviewer Etherscan-status recheck |
| Initial `campaignCount()` | **0** — user-supplied initial read, not an independently fetched current value |
| Public RPC / browser checks | Public reads without wallet and Sepolia recognition passed in Codespaces — user-attested; independent RPC/CORS checks outstanding |
| Frontend hosting | Temporary GitHub Codespaces development preview; URL not supplied; permanent hosting outstanding |
| Exact frontend build SHA / public configuration evidence | Not supplied; no frontend/deployment configuration changed by this PR |

Public reviewer references: [Blockscout transaction API](https://eth-sepolia.blockscout.com/api/v2/transactions/0xfec76744a082b6455d0cde1b18310d7c7657b05a7bc4eed78b5dfd848412560d), [contract API](https://eth-sepolia.blockscout.com/api/v2/smart-contracts/0x8627ffb5768CF5E47965E55F6855f8910b474A25), [block API](https://eth-sepolia.blockscout.com/api/v2/blocks/12053283).

### Gas context

The [Ethereum Foundation announcement](https://blog.ethereum.org/2026/10/16/glamsterdam-hoodi-announcement) confirms Sepolia's **October 6, 2026** Glamsterdam activation. [EIP-8037](https://eips.ethereum.org/EIPS/eip-8037) increased code-deposit state cost from **200 to 1,530 gas per byte**. Both sources were verified during this correction. For **3,997 runtime bytes**, that change alone adds **5,316,010 gas**, substantially explaining the **5,559,280-gas** increase over the historical local reference. This is not a complete opcode-level reconciliation. Actual gas used, gas limit and unused capacity remain separate; see the [6B gas explanation](deployment-evidence-6b.md#gas-explanation-local-reference-versus-upgraded-sepolia).

## Browser and live acceptance

- [x] Public browsing in live Sepolia mode, no demo campaigns, initial empty collection and wallet-free reads — **user-attested Codespaces checks**.
- [x] MetaMask connects, connected address displays correctly, chain 11155111 recognized; disconnect/reconnect/refresh pass — **user-attested Codespaces checks**.
- [x] No crowdfunding transactions submitted during those checks — **user attestation**.
- [ ] Persistent frontend hosting, build/source provenance, HTTPS, browser-safe RPC/CORS and SPA deep links verified.
- [ ] Broader real browser/device, mobile/tablet, keyboard/focus, account changes, wrong-network/explicit switch, stale/error and pending navigation checks completed.
- [ ] Separate authorization for small-value creator/contributor lifecycle transactions recorded.
- [ ] Authorized live lifecycle receipts/read reconciliation completed; historical funding and per-wallet settlement verified.
- [ ] Pending/replacement/reload limits explained and confirmed with live-test operators; submitted hashes saved before navigation.
- [ ] Independent review and final acceptance recorded. No production acceptance is claimed.

## Future live lifecycle evidence — intentionally unfilled

| Live evidence | Actual value |
| --- | --- |
| Live lifecycle authorization reference | |
| Create smoke-test transaction hash(es) | |
| Contribution smoke-test transaction hash(es) | |
| Cancellation smoke-test transaction hash | |
| Refund smoke-test transaction hash(es) | |
| Withdrawal smoke-test transaction hash | |
| Receipt and authoritative read reconciliation results | |
| Broader real MetaMask / responsive testing evidence | |
| Final acceptance result, reviewer and date | |

Outstanding limits: Etherscan status relies on user-supplied Foundry output, no complete opcode-level gas reconciliation, temporary hosting, incomplete real device matrix and no approved live crowdfunding lifecycle results. See [6B evidence and limitations](deployment-evidence-6b.md).

Do not fill public evidence with mock/local Anvil artifacts or inferred outcomes. Recover a submitted transaction's actual receipt before considering any repeat. **Do not deploy another contract, submit on-chain transactions or merge this PR under this documentation-only checkpoint.**
