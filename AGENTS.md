# Codex Repository Instructions — DeCen Crowdfund

Read `docs/product-spec.md`, `docs/design-system.md`, `docs/architecture.md`, and `docs/test-plan.md` before making changes.

## Collaboration and scope

- Follow the **explicitly assigned iteration only**. Never start later iterations without permission.
- Branch from the accepted `main` or explicitly specified baseline. Open a PR; **do not merge or enable auto-merge**.
- Do not rewrite, reorganize, or "improve" unrelated files.
- Report changed files, commands executed, test results, and any unverified claims in the PR.
- Prefer minimal, readable code and fewer dependencies. Do not add abstractions speculatively.

## Product invariants

- One MVP crowdfunding contract. Native ETH and Sepolia for development.
- Strict funding goal cap: no overfunding and no contributions after full funding.
- Successful/Failed status determined at or after deadline. Full funding early remains Active.
- Creator cancellation before deadline; individual contributor-initiated refunds after Failed/Cancelled.
- Public campaign reads must work without a wallet connection or MetaMask permission.
- No automatic signing, switching networks, or on-chain transactions on page load, timer expiry, polling, or refresh.
- No optimistic financial figures. Transaction receipt success is required before invalidating and refetching authoritative data.
- Never double-count funds or duplicate campaign cards; always key by chain, contract, campaign ID, and wallet as relevant.

## Visual identity

- Direction: **Modern Community Platform** — human, trustworthy, accessible, distinctive.
- Follow the approved design tokens in `docs/design-system.md`. Do not invent a new design system.
- Avoid generic AI/SaaS visual patterns: shiny gradients, glassmorphism, purple neon, meaningless decorations, repetitive cards, fake analytics.
- Use meaningful hierarchy, restrained whitespace, clear financial data, accessible semantics, and intentional mobile design.
- No unlicensed campaign photographs. Mock images/content must be identified as samples.
- Iteration 2 implements the static UI prototype; wallet and blockchain integration remain deferred.

## Engineering

- Prefer simple React state for UI-only interactions and wagmi/viem-backed TanStack Query for future blockchain data.
- Do not add Zustand, Redux, custom global stores, WebSocket subscriptions, indexers, or background transaction agents for the MVP.
- Use Solidity and Foundry tests for fund safety and lifecycle boundary conditions when that iteration begins.
- Never commit secrets, private keys, seed phrases, RPC credentials, or `.env` files.
- Verify builds/tests whenever dependencies and tools are available; if unable, state so rather than claiming success.

## Iteration 2 boundary (this PR)

Allowed: responsive static frontend screens, clearly labeled fictional campaign fixtures, local presentational form interactions, visual wallet examples, and browser screenshots. Preserve the Iteration 1 foundation.
Not allowed: Solidity contract implementation, wallet connection, Web3 reads/writes, fictional campaigns presented as real data, backend/database, deployment, changing `main`, or starting Iteration 3.
