# DeCen Crowdfund

Community crowdfunding with native ETH and an all-or-nothing funding model. Creators set a goal and deadline; contributors fund up to the exact goal. After the deadline, creators withdraw successful funding once. Contributors individually reclaim their recorded contributions if a campaign fails or is cancelled. Historical funding remains visible after settlement.

**Current status (Iteration 8B):** DeCen Crowdfund is deployed for **experimental Ethereum Sepolia testing only** (chain ID `11155111`) at [decentralized-crowdfunding-dapp.vercel.app](https://decentralized-crowdfunding-dapp.vercel.app). The verified Sepolia contract address is [`0x8627ffb5768CF5E47965E55F6855f8910b474A25`](https://sepolia.etherscan.io/address/0x8627ffb5768CF5E47965E55F6855f8910b474A25). See [6B deployment evidence](docs/iteration-6/deployment-evidence-6b.md), [6D live lifecycle](docs/iteration-6/live-lifecycle-evidence-6d.md) and [8B security review](docs/iteration-8/security-release-review-8b.md) for provenance and limits. **No mainnet deployment, formal security audit, or unrestricted real-value release is claimed.**

## Portfolio & project handoff

- [Portfolio overview](docs/iteration-9/portfolio-overview.md) — project purpose, engineering work and interview summary.
- [Technical handoff](docs/iteration-9/final-handoff.md) — architecture, setup, verification evidence and known limitations.

## Current MVP

- Public campaign discovery and details without MetaMask or wallet permission.
- Explicit MetaMask connection, silent restoration of existing authorization, explicit disconnect and network switching.
- Five user-initiated transactions: create, contribute, cancel, withdraw and claim refund.
- Exact bigint/wei accounting, strict funding cap, contract-derived status and current-wallet contribution reads.
- Separate signature, submitted, confirmed, rejected, reverted and refresh-failure feedback. Financial values update through authoritative reads after receipt success.
- Clearly labeled fictional demo campaigns when no deployment address is configured.
- Responsive community-focused design, keyboard navigation and accessible status feedback.

## Stack and structure

React, TypeScript and Vite; wagmi 3, viem 2 and TanStack Query; Solidity 0.8.20, OpenZeppelin 5.0.2 and Foundry 1.5.0. No backend, database, indexer or custom global campaign store.

```text
web/                     React application, unit/browser/Anvil tests
  src/blockchain/        Committed ABI, configuration, reads, transaction hook
contracts/               Accepted contract, 43 Foundry tests, pinned submodules
.github/workflows/       Frontend and Foundry verification
docs/                   Product, architecture, design and testing documentation
docs/iteration-6/       Readiness evidence, deployment procedure and future handoff
```

## Local development

Use Node >=22.12, npm and Foundry v1.5.0. Initialize the pinned dependencies:

```sh
git clone --recurse-submodules https://github.com/Ravin1010/decentralized-crowdfunding-dapp.git
cd decentralized-crowdfunding-dapp
# For an existing checkout:
git submodule update --init --recursive
cd web
npm ci
cp .env.example .env.local
npm run dev
```

The frontend runs at the URL printed by Vite. Keep the contract address blank to browse demo campaigns. The create form is non-transactional in demo mode.

## Demo and live configuration

| Variable | Meaning |
| --- | --- |
| `VITE_CROWDFUND_CONTRACT_ADDRESS` | Blank enables labeled demo mode. A valid nonzero deployment address selects live Sepolia reads. Malformed/nonzero-address validation failures display configuration errors; they do not show demo campaigns. |
| `VITE_SEPOLIA_RPC_URL` | Optional public HTTPS Sepolia RPC, default `https://ethereum-sepolia-rpc.publicnode.com`. HTTP localhost is accepted only for local verification. Actual RPC chain must be 11155111. |

**All `VITE_` values are public in the browser bundle. Never use private API keys, wallet keys, seed phrases or passwords.** Do not commit `.env.local`. Changing build-time variables requires rebuilding the frontend. An unreadable contract, incompatible interface, missing code or failed RPC produces an error, never fictional live data or zero funds. For live local testing, use only a verified deployment address; leaving the address blank continues to select demo mode. The project has a verified Sepolia address documented above, but this example does not automatically enable live transactions.

Live public reads use the public RPC independently of wallet/network state. Visible views poll approximately every 15 seconds; hidden tabs pause polling. Manual refresh is read-only. Wallet contribution queries are isolated by chain, contract, campaign and current account. No financial data is optimistically updated or persisted in browser storage.

## Verification

```sh
cd web
npm ci
npm run typecheck
npm run build
npm test
npx playwright install --with-deps chromium
npm run test:browser

cd ../contracts
forge fmt --check
forge build
forge test -vvv
forge test --gas-report

cd ../web
npm run test:anvil
```

Compile the contract before the Anvil test and put `anvil` on PATH. Optional overrides: `ANVIL_BIN` and `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. The standalone runner uses temporary localhost Anvil on port 18546 and Vite on 5175, simulated wallet authorization, real contract receipts and real public-client reads. It performs two complete UI lifecycles plus a focused distinct-wallet failed-campaign refund lifecycle. All accounts are disposable local unlocked accounts; no keys are required. Multicall3 is installed only as a local test fixture. Results are written to `docs/iteration-6/anvil-results.json`; historical screenshot paths used by existing tests may be regenerated locally.

See [6A verification](docs/iteration-6/README.md) for exact counts, bytecode fingerprints, browser evidence and limitations. GitHub Actions runs frontend unit/browser tests and Foundry checks; the standalone Anvil test is run locally.

## Sepolia deployment and remaining limitations

The current experimental deployment and its evidence are described in [6B deployment evidence](docs/iteration-6/deployment-evidence-6b.md), [6D live lifecycle](docs/iteration-6/live-lifecycle-evidence-6d.md), [6F limited real-wallet observations](docs/iteration-6/live-wallet-acceptance-6f.md), [7D automated acceptance](docs/iteration-7/automated-acceptance-7d.md), and [8B security and release review](docs/iteration-8/security-release-review-8b.md). The [6A deployment procedure](docs/iteration-6/deployment.md) and [original 6B handoff](docs/iteration-6/handoff-6b.md) are historical preparation documents, not the current deployment state. Vercel serves production SPA routes, but comprehensive manual-device, accessibility, wallet-recovery and security acceptance remain open.

Pending transaction feedback lasts only for the current page session. Save the hash before navigation/reload and recover status from wallet history or Sepolia Etherscan. Reloading never automatically resubmits, restores transaction feedback or proves failure. Check the original receipt and current contract state before submitting the same operation again. One confirmation is used; persistent pending/replacement tracking and deeper reorg reconciliation are outside the MVP. Transactions with a receipt but failed data refresh remain confirmed and offer a read-only retry.

Mocked and Anvil tests are distinct from the limited completed Sepolia lifecycle and real-wallet observations. [Iteration 8B](docs/iteration-8/security-release-review-8b.md) documents unresolved receipt/reorganization handling, payout-recipient compatibility and release-control risks. Skipped 7F manual-device/accessibility and 8A comprehensive real-wallet acceptance remain **Not tested**. No independent formal security audit or mainnet readiness is claimed. Existing nonfatal build warnings concern the optional ox/Tempo worker module and a ~637 kB minified entry chunk.
