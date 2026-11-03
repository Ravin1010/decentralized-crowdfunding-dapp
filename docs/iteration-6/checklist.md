# Deployment and acceptance checklist — 6B evidence record

**No public-chain deployment occurred in 6A.** This checklist now records the later deployment and Codespaces observations supplied by the user for 6B. The [dedicated 6B evidence document](deployment-evidence-6b.md) distinguishes user-supplied chain evidence, user-attested browser checks and independent local artifact verification. This documentation update authorizes no transaction or deployment.

The environment blocked independent Etherscan/public RPC rechecks with HTTP 403 at CONNECT. Checked items below carry explicit provenance and must not be interpreted as independently verified public-chain results. Unprovided evidence and unperformed live lifecycle tests remain open.

## Preparation and provenance

- [x] 6A accepted in `main`; source baseline independently confirmed as `fd7a58366f0ac42deeaaf3a600ecaf2e703e37f5`.
- [x] Accepted source rebuilt locally with pinned compiler/settings; exact frontend ABI and compiled runtime hash independently reproduced.
- [ ] Operator's deployment-time clean checkout, signer/test ETH budget and command/fee review evidence supplied.
- [ ] Original explicit deployment authorization reference supplied. The current instruction is evidence recording only and is not retroactive authorization.
- [ ] Independent public receipt/runtime/source recheck completed; network access currently blocks it.

## Deployment evidence

| Evidence | Recorded value / provenance |
| --- | --- |
| Accepted deployment source SHA | `fd7a58366f0ac42deeaaf3a600ecaf2e703e37f5` — source supplied by user; repository baseline independently confirmed |
| Explicit deployment authorization reference | Not supplied |
| Deployment network and chain ID | Ethereum Sepolia, **11155111** — user-supplied |
| Public deployer address | `0x8C710111bCfA5418289171c3b7B11665ddA50E7d` — user-supplied |
| Contract address | `0x8627ffb5768CF5E47965E55F6855f8910b474A25` — user-supplied |
| Deployment transaction hash | [`0xfec76744a082b6455d0cde1b18310d7c7657b05a7bc4eed78b5dfd848412560d`](https://sepolia.etherscan.io/tx/0xfec76744a082b6455d0cde1b18310d7c7657b05a7bc4eed78b5dfd848412560d) — user-supplied |
| Receipt status | Successful — user-supplied; raw receipt not independently retrieved |
| Block number / block hash | **12053283** — user-supplied; block hash not supplied |
| Deployment timestamp | **2026-11-03 13:43:24 MYT (05:43:24 UTC)** — user-supplied UTC timestamp |
| Reported gas used | **6,498,902** — user-supplied; reconcile against raw receipt (6A local reference: 939,622 gas) |
| Compiler / optimization | Solidity **0.8.20**, **200 runs** — user-supplied explorer settings; accepted local settings independently checked |
| Creation bytecode fingerprint | **4030 bytes**, keccak256 `0x202c464ec9e438aef048e3759d6a2def21492b9af4c773bc973c2c14c4cd1c52` — independent local artifact |
| Runtime bytecode fingerprint | **3997 bytes**, keccak256 `0x5b1a0eabdf6cde465b6427bf7d7c2b6542fa748dbac6cd60543d80ba9ebededd` — independent local artifact; user reports identical on-chain runtime |
| Runtime match result | Exact on-chain/accepted artifact match reported by user; local hash reproduced; public runtime fetch blocked |
| Source verification | [Sepolia Etherscan verified source](https://sepolia.etherscan.io/address/0x8627ffb5768CF5E47965E55F6855f8910b474A25#code), **“Pass - Verified”** — user-supplied; independent explorer fetch blocked |
| Initial `campaignCount()` | **0** — user-supplied initial read, not an independently fetched current value |
| Public RPC / browser checks | Public reads without wallet and Sepolia recognition passed in Codespaces — user-attested; independent RPC/CORS checks outstanding |
| Frontend hosting | Temporary GitHub Codespaces development preview; URL not supplied; permanent hosting outstanding |
| Exact frontend build SHA / public configuration evidence | Not supplied; no frontend/deployment configuration changed by this PR |

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

Outstanding risks: independent chain/source/receipt recheck unavailable, reported gas discrepancy unresolved, temporary hosting, incomplete real device matrix and no approved live crowdfunding lifecycle results. See [6B evidence and limitations](deployment-evidence-6b.md).

Do not fill public evidence with mock/local Anvil artifacts or inferred outcomes. Recover a submitted transaction's actual receipt before considering any repeat. **Do not deploy another contract, submit on-chain transactions or merge this PR under this documentation-only checkpoint.**
