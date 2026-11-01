# MVP verification plan

## Iteration 1 (foundation)

- Repository contains only intended startup files and documentation.
- `cd web && npm install && npm run typecheck && npm run build` should succeed in a network-enabled environment.
- `cd contracts && forge build` should succeed after Foundry installation; no Solidity logic exists yet.
- No API keys, private keys, RPC secrets, or deployed addresses in Git.
- Review the PR and do not merge until accepted.

## Solidity tests (future iteration)

- Creation rejects zero goal and out-of-range duration.
- IDs start at 1; expected records and deadlines are stored.
- Contributions reject zero, after deadline, after cancellation, and over goal.
- Exactly filling remaining goal succeeds.
- Reaching goal early remains Active but rejects further funding.
- At deadline, met goal -> Successful; unmet -> Failed.
- Creator can cancel before deadline, including fully funded; unauthorized or post-deadline cancellation fails.
- Failed/Cancelled contributor can refund only own balance once; repeated claim fails.
- Creator withdraws only after successful deadline; once only; unauthorized withdrawals fail.
- Historical `amountRaised` is not erased by refund/withdraw.
- ETH receiver revert and reentrancy attempts do not compromise accounting.
- Boundary timestamps include `deadline - 1`, `deadline`, `deadline + 1`.

## Frontend tests (future iteration)

- Homepage loads without MetaMask; no `eth_requestAccounts` on initial load or refresh.
- Countdown expiry is read-only and prompts no wallet transaction.
- Wallet connection, rejection, wrong-chain selection, and account switching correctly control actions.
- One contribution produces exactly one final funding increase.
- A confirmed create shows one new campaign, no duplicate cards.
- Refund and withdraw buttons disappear when refreshed state removes eligibility.
- Reverted/rejected transactions preserve confirmed financial figures.
- Confirmed receipt with failed refetch shows stale-data warning, not a false rollback.
- Manual refresh and polling never sign transactions.
- Relevant queries invalidate after receipts; stale reads cannot overwrite newer confirmed data.
- Desktop, mobile, keyboard/focus, and reduced-motion QA.

## Demo acceptance

Use small Sepolia test amounts only; document deployment/ABI and all confirmed transaction receipts. No mainnet operation or real fundraising in the MVP.
