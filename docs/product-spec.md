# Product specification — MVP

## Purpose

DeCen Crowdfund is a community-first Ethereum crowdfunding platform. Visitors discover projects; creators raise native ETH under a fixed funding goal; contributors get refunds if the campaign fails or is cancelled. No centralized fund custodian.

## Users

- **Visitor:** browse campaign details and effective status without connecting a wallet.
- **Creator:** connect wallet, create campaign, contribute if desired, cancel before deadline, withdraw after success.
- **Contributor:** connect wallet, contribute before deadline up to remaining goal, claim refund for Failed/Cancelled campaigns.

No admin role in MVP.

## Campaign and funding rules

- Native ETH only. Funding goal must be greater than zero.
- Duration range: **60 seconds to 30 days**. UI can offer friendly presets.
- Contributions must be >0, only before deadline, only if campaign is not cancelled, and must satisfy `msg.value <= goal - amountRaised`.
- Exactly reaching the remaining goal is allowed; **overfunding is never allowed**.
- Reaching the goal early **does not** complete the campaign; it stays Active until deadline but accepts no further contributions.
- Deadline is authoritative from chain context. Contributions require `block.timestamp < deadline`; after that, no contribution can succeed.
- After deadline: Successful if `amountRaised >= goal`, otherwise Failed.
- Creator may cancel **only before deadline** (even if the goal was already reached); cancellation makes contributor refunds available.
- After successful deadline completion, creator may withdraw all escrowed campaign funds **once**. No early withdrawal.
- Failed/Cancelled contributors reclaim their own refundable balances through pull-based refunds, with no iteration over all contributors.
- A contributor's refundable amount is the sum of contributions not yet refunded. A successful refund zeros that balance before ETH transfer.
- Preserve historical funding amount after withdrawals/refunds; do not confuse total raised with remaining escrow.
- No platform fee, refund expiration, admin seizures, overfunding, or arbitrary creator withdrawals.

## Campaign status model

On-chain effective status enum: Active, Successful, Failed, Cancelled.

Store immutable campaign parameters and minimal mutable flags (`cancelled`, `withdrawn`). Do not store a separate mutable status that requires transaction-based expiry synchronization. Expose effective status by view function. No automatic status-writing transactions.

Withdrawal and refund completion are secondary settlement indicators, not new enum values.

## MVP interactions

1. Create campaign with title, description, goal, and duration; receive transaction confirmation.
2. Browse list, open campaign details, see exact ETH goal, raised, remaining, deadline, and effective status.
3. Connect MetaMask explicitly for create/contribute/withdraw/refund/cancel.
4. Show signature pending, on-chain pending, confirmed, rejected/reverted, and refresh warning distinctly.
5. Show updated financial values only after receipt success and authoritative blockchain refetch.
6. Show eligibility actions only for the correct connected wallet and status.

## Deferred scope

Uploaded images and IPFS, user profiles, comments, search/filter, campaign categories, multiple chains, tokens other than native ETH, payment splitting, governance, backend, database, analytics dashboard, admin, and instant event-based updates.

## Design intent

Modern Community Platform. Professional but welcoming, with clear social context, honest funding data, accessible workflows, responsive layouts, and minimal visual clutter.
