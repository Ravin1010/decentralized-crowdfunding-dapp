# DeCen Crowdfund — Portfolio Overview

**Project:** Decentralized crowdfunding DApp · **Network:** Ethereum Sepolia (experimental testnet)

[Live application](https://decentralized-crowdfunding-dapp.vercel.app) · [GitHub repository](https://github.com/Ravin1010/decentralized-crowdfunding-dapp) · [Verified Sepolia contract](https://sepolia.etherscan.io/address/0x8627ffb5768CF5E47965E55F6855f8910b474A25)

## What it does

DeCen Crowdfund is a community-oriented, noncustodial crowdfunding MVP. A creator sets a fixed ETH target and deadline. Contributors fund the campaign directly through a Solidity escrow contract. After the deadline, a successful creator may withdraw once; contributors to failed or cancelled campaigns may each claim their own refunds. Funding is capped at the exact goal: the contract rejects overfunding.

The interface follows the approved **Modern Community Platform** design. Visitors can browse campaigns without granting wallet permission; wallet connection and all five write actions require explicit user choices.

## Key engineering work

- Designed a Solidity all-or-nothing escrow lifecycle with computed campaign statuses, a strict contribution cap, creator-only withdrawal/cancellation, and individual pull refunds.
- Applied OpenZeppelin `ReentrancyGuard`, checks-effects-interactions, and rollback-on-failed-ETH-transfer behavior to payout paths.
- Connected React/TypeScript to Sepolia through wagmi, viem and TanStack Query, separating public reads from connected-wallet actions.
- Implemented a receipt-driven interface that updates financial data from authoritative contract reads, rather than optimistic balances.
- Created Foundry contract tests, local Anvil lifecycle verification, mocked wallet/transaction browser tests, cross-browser checks, accessibility scans and GitHub Actions CI.
- Published an experimental Sepolia frontend on Vercel and recorded testnet deployment and live-lifecycle evidence separately from mock/local results.

## Technology

| Layer | Stack |
| --- | --- |
| Smart contract | Solidity 0.8.20, OpenZeppelin 5.0.2 |
| Contract development | Foundry 1.5.0, local Anvil |
| Frontend | React, TypeScript, Vite, custom CSS |
| Ethereum interaction | wagmi, viem, TanStack Query, MetaMask |
| Verification | Foundry, Vitest, Playwright, axe-core |
| Hosting and CI | Vercel, GitHub Actions |

No backend, custodial platform account, persistent database or indexer is part of this MVP.

## What a reviewer can inspect

1. [Product rules](../product-spec.md) and [contract specification](../smart-contract.md).
2. [Smart contract](../../contracts/src/DecentralizedCrowdfunding.sol) and [Foundry test suite](../../contracts/test/DecentralizedCrowdfunding.t.sol).
3. [Frontend transaction implementation](../../web/src/blockchain/transactions.ts) and [public reads](../../web/src/blockchain/reads.ts).
4. [Sepolia deployment evidence](../iteration-6/deployment-evidence-6b.md) and [live lifecycle evidence](../iteration-6/live-lifecycle-evidence-6d.md).
5. [Security and release review](../iteration-8/security-release-review-8b.md) and [verification ledger](../iteration-8/security-verification-8b.md).

**Visual reference:** [Iteration 2 design screenshots](../iteration-2/README.md) are historical **static prototype** captures, not current production captures. The live link above is the source for the current interface.

## Current maturity and limitations

This is a **portfolio and experimental Sepolia project**, not an audited mainnet financial product. It uses one receipt confirmation and page-session-only transaction feedback; persistent tracking across reloads and comprehensive replacement/reorganization recovery are not implemented. Payouts to a contract that permanently rejects ETH may remain unclaimable. Permissionless, arbitrary-length metadata creates content/RPC availability tradeoffs. The formal independent security audit and complete manual-device, spoken-screen-reader and real-wallet acceptance suites have **not** been completed. Iterations 7F and 8A were intentionally skipped and remain **Not tested**.

For exact limitations and source-attributed results, consult the [Iteration 8B review](../iteration-8/security-release-review-8b.md). No mainnet deployment or unrestricted real-value release is claimed.

For architecture, demo setup and evidence boundaries, see the [technical handoff](final-handoff.md).

## Interview-ready explanation

> I built an Ethereum crowdfunding MVP that prioritizes state correctness. The contract enforces exact-goal funding and individual refunds, while the frontend waits for successful transaction receipts before refetching balances and campaign status. I verified core settlement behavior with Foundry and local EVM tests, then separated mock, CI and actual Sepolia evidence. I also documented tradeoffs such as wallet transaction recovery and payout receiver compatibility instead of presenting the MVP as production-audited.
