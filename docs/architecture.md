# MVP architecture

## Technologies and boundaries

- React + TypeScript + Vite frontend; custom CSS design tokens.
- Solidity contract (one contract) and Foundry for tests/deployment scripts in later iterations.
- Sepolia is the initial supported chain.
- Later wallet integration: wagmi + viem, using TanStack Query through wagmi.
- No off-chain backend, persistent DB, blockchain indexer, WebSockets, or custom global campaign store for MVP.

## Contract shape (planned, not implemented)

- `campaignCount`: monotonically increases, campaign IDs begin at 1.
- `Campaign`: creator, title, description, goal, deadline, amountRaised, cancelled, withdrawn.
- `campaigns[id]`: private storage, exposed through `getCampaign(id)`.
- `contributions[id][wallet]`: wallet's current refundable/recorded amount.
- Write actions: `createCampaign`, `contribute`, `withdrawFunds`, `claimRefund`, `cancelCampaign`.
- Read actions: `getCampaign` (including effective status), `getCampaignStatus`, public count getter, contributions getter.
- Five events: `CampaignCreated`, `ContributionReceived`, `FundsWithdrawn`, `RefundClaimed`, `CampaignCancelled`. No expiry status-write event.
- Campaign status is computed from deadline + amounts + cancelled flag. See product specification.

The exact Solidity method signatures, data types, ABI, and event fields are finalized in the contract implementation iteration. Do not assume the frontend ABI ahead of that checkpoint.

## Public read path

- Public RPC client independent of MetaMask/signer. Visitor sees campaigns without wallet.
- Read-only operations must never call `eth_requestAccounts`, `getSigner()`, send transactions, or switch networks.
- Avoid requesting one transaction per deadline. Effective status comes from a view, using chain time.
- Prefer grouped/batched reads when practical, but keep the MVP simple. Stable IDs and sorting; never append duplicate campaign cards.

## Wallet/write path

- User-initiated Connect requests wallet permission.
- Previous authorization may restore silently without new permission prompts.
- Network switch only via explicit user action; do not auto-switch.
- After connecting in response to an intended write, require a separate explicit submit action.
- A transaction follows: awaiting signature -> submitted/pending -> receipt success -> targeted query invalidation -> authoritative refetch.
- On rejection/revert, do not change confirmed financial data. On successful receipt but failed refresh, show confirmation plus a stale-data warning.
- Prevent duplicate submissions of the same action while pending; do not claim wallet pending state is persistent across reload unless actually tracked.

## Query and caching plan

Query identity must include `chainId`, contract address, and applicable campaign ID/wallet:

- Campaign list: chain + contract.
- Campaign detail: chain + contract + campaign ID.
- Wallet contribution: chain + contract + campaign ID + normalized wallet.
- Wallet balance: chain + wallet.

Starting policy: foreground polling about every 15 seconds for visible relevant views; local countdown update about every second with no RPC call each second; manual refresh is read-only. Pause unnecessary background polling.

Confirmed write -> invalidate directly affected data only:

- Create: list/count and new campaign.
- Contribute: campaign detail/list funding, relevant user contribution, wallet balance.
- Withdraw: campaign settlement state and wallet balance.
- Refund: campaign eligibility, contributor balance, wallet balance.
- Cancel: campaign detail/list status, relevant eligibility.
- Account/network change: invalidate wallet- and chain-scoped queries as applicable.

No optimistic ETH/funding updates. No duplicate subscriptions that manually increment amounts. No caching of financial data across wallet or chain identities. Treat query failures as errors, not zero amounts.

## Data correctness

Separate historical `amountRaised` from actual refundable balance and withdrawal state. With strict goal cap, funding percentage is at most 100% on-chain. UI may show `Fully funded — awaiting deadline` while status remains Active.

## Iteration separation

1. Foundation + docs.
2. Static visual prototype and responsive screenshots.
3. Solidity contract + Foundry tests.
4. Wallet and reads.
5. Confirmed transaction flows and integration.
6. Reconciliation, regression, and deployment.
