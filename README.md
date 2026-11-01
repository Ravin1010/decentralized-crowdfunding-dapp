# DeCen Crowdfund

A decentralized, all-or-nothing crowdfunding DApp for Ethereum. Rebuilding from scratch with a community-first design and reliable blockchain interaction.

**Status:** Iteration 1 — repository foundation only. The application does not yet connect to a blockchain or implement crowdfunding.

## Structure

- `web/` — React + TypeScript + Vite frontend
- `contracts/` — Foundry project (Solidity implementation begins in Iteration 3)
- `docs/` — product, visual design, architecture, and test specifications
- `AGENTS.md` — mandatory instructions for Codex working in this repository

## Develop locally

Requirements: Node.js 22.12+ and npm. Foundry is required for smart contract work later.

```sh
cd web
npm install
npm run dev
```

To check the frontend:

```sh
cd web
npm run typecheck
npm run build
```

To prepare Foundry once installed:

```sh
cd contracts
forge build
```

The contract directories contain placeholders only. No Ethereum credentials or contract addresses are needed at this stage.

## MVP behavior (agreed)

- Visitors can browse campaigns without connecting MetaMask.
- Campaigns have a fixed ETH goal; **overfunding is rejected on-chain**.
- A fully funded campaign stops accepting contributions but remains Active until deadline.
- After deadline: Successful if the goal was met; otherwise Failed.
- Creator may cancel before deadline. Failed and Cancelled campaigns use individual pull-based refunds.
- Creator withdraws only after successful deadline completion.
- Automatic reads and deadline checks must never request a wallet signature.
- Funding figures change **only after receipt-confirmed transactions and authoritative refetches**.
- No backend, database, IPFS uploads, fees, or advanced real-time synchronization in the MVP.

See `docs/product-spec.md` and `docs/architecture.md` for the full contract.

## Development workflow

Codex changes should be scoped to one iteration, made on a feature branch, and submitted as a reviewable PR. **Do not merge to `main` without explicit approval.** No deployed contracts or real funds are used in Iteration 1.
