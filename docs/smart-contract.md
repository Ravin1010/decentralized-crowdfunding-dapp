# Iteration 3 — crowdfunding contract

`contracts/src/DecentralizedCrowdfunding.sol` implements one native ETH, all-or-nothing crowdfunding contract. Sepolia is the intended future network; this iteration does not deploy a contract or integrate the frontend.

## Reproducible setup

- Solidity: **0.8.20+commit.a1b79de6**, pinned in `contracts/foundry.toml`; source pragma `^0.8.20`. Optimizer enabled, 200 runs.
- OpenZeppelin Contracts: **5.0.2**, Git revision `dbb6104ce834628e473d2173bbc9d47f81a9eec3`. Uses `utils/ReentrancyGuard.sol`, compatible with Solidity 0.8.20.
- forge-std: **1.9.7**, revision `77041d2ce690e692d6e03cc812b57d1ddaa4d505` (tests only).
- Verified with Foundry **1.5.0**, revision `1c57854462289b2e71ee7654cd6666217ed86ffd`.

Dependencies are pinned by Git submodule commits and `contracts/foundry.lock`; do not update to floating dependency heads. From the repository root after cloning:

```sh
git submodule update --init
cd contracts
forge build
forge test -vvv
forge test --gas-report
forge fmt --check
```

Install Foundry from its official release or foundryup before running these commands. The cloud verification used the official Foundry 1.5.0 Linux release and official native solc binary from `ethereum/solc-bin`. Because the cloud home directory is read-only, binaries were installed under `/tmp`, with `PATH` pointing to Foundry and `FOUNDRY_SOLC` pointing to the same pinned 0.8.20 compiler. No compiler or executable is committed.

## Interface

Exactly five external write functions:

```solidity
createCampaign(string calldata title, string calldata description, uint256 goal, uint256 duration)
    external returns (uint256 campaignId);
contribute(uint256 campaignId) external payable;
withdrawFunds(uint256 campaignId) external;
claimRefund(uint256 campaignId) external;
cancelCampaign(uint256 campaignId) external;
```

Read interface:

```solidity
campaignCount() external view returns (uint256);
getCampaign(uint256 campaignId) external view returns (Campaign memory campaign, Status status);
getCampaignStatus(uint256 campaignId) external view returns (Status);
contributions(uint256 campaignId, address contributor) external view returns (uint256);
```

`Campaign` returns creator, title, description, goal (wei), deadline (Unix seconds), historical amountRaised (wei), cancelled, and withdrawn, in that order. IDs begin at 1. Title and description must have nonzero byte length (whitespace is accepted); goal must be positive; duration is inclusive of 60 seconds and 30 days.

All five writes and both explicit campaign getters reject zero/unallocated campaign IDs with `InvalidCampaign()`. The required **public contributions mapping** uses Solidity's generated getter, which returns zero for an unset key, including an invalid campaign ID; it cannot add an existence check. Use `getCampaign` or `getCampaignStatus` to validate campaign existence. The count getter requires no ID.

`Status` enum ordinals are Active=0, Successful=1, Failed=2, Cancelled=3. Precedence is cancelled, then Active strictly before deadline, then Successful if amountRaised >= goal, otherwise Failed. Reads never write storage or require expiry transactions. Withdrawn successful campaigns remain Successful; refunded cancelled/failed campaigns retain their status.

Contributions are accepted only while Active, must be positive, and cannot exceed `goal - amountRaised`. Full funding early remains Active, accepts no further ETH, and may still be cancelled before the deadline. At the deadline, contribution/cancellation are closed and successful withdrawals or failed refunds become available.

## Events

```solidity
event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint256 goal, uint256 deadline);
event ContributionReceived(uint256 indexed campaignId, address indexed contributor, uint256 amount);
event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);
event RefundClaimed(uint256 indexed campaignId, address indexed contributor, uint256 amount);
event CampaignCancelled(uint256 indexed campaignId, address indexed creator);
```

Amounts are wei. No event or function synchronizes deadline status. Campaign metadata is available from `getCampaign` after `CampaignCreated`.

## Fund safety and accounting

Withdrawal is creator-only, once, after a successful deadline. Refunds are caller-only pull payments, available after failure or immediately after cancellation. OpenZeppelin's shared `nonReentrant` guard protects both ETH payout paths. Withdrawal marks `withdrawn` and refund zeros the caller's balance before the external call. Failed sends revert the whole transaction with `TransferFailed()`, preserving eligibility for retry. Each settlement transfers only that campaign's raised amount or that caller's recorded contribution.

`amountRaised` is historical and never decremented by refunds or withdrawal. Contributions accumulate per campaign/wallet, zero on refund, and remain recorded after a successful campaign withdrawal. They are refundable only for Failed/Cancelled campaigns. Contract balance is shared escrow, not a campaign's historical total. No contributor arrays, loops in production settlement, fees, admin privileges, proxies, status scheduler, tokens, or fallback/receive handler exist.

## Verification results

- `forge build`: successful with Solidity 0.8.20; no final compiler/lint warnings.
- `forge test -vvv`: **43 tests passed, 0 failed, 0 skipped**; includes one fuzz test with **256 runs**.
- `forge test --gas-report`: **43 passed, 0 failed, 0 skipped**, including 256 fuzz runs; report generated successfully. Local deployment gas estimate: 939,610; creation bytecode: 4,030 bytes. Estimates are test-environment measurements, not network fee predictions.
- `forge fmt --check` and `git diff --check`: passed.
- Frontend regression: `npm ci`, `npm run typecheck`, and `npm run build` passed. The cloud run set `npm_config_cache=/workspace/.npm-cache` to use a writable cache. No tracked frontend file changed against accepted commit `16e15d68f9806c4754f7690a120431ffd6bc402c`.

Tests cover creation validation/duration endpoints, IDs/events, accumulated and capped contributions, deadline - 1/exact deadline/deadline + 1, computed status without storage writes, cancellation including fully funded campaigns, authorization, individual refunds, double settlement, successful settlement history, failed ETH transfers with rollback and retry, reentrant withdrawal/refund callbacks rejected by the OpenZeppelin guard, effects visible before interaction, and isolation across failed/successful/cancelled campaigns. Fuzzing checks capped funding, individual refund conservation, and historical totals.

Limitations: local automated tests are not an independent security audit. A creator/contributor contract that always rejects ETH cannot receive its payout until its own receiver behavior permits it; there is no alternative payout-address or admin recovery mechanism. Forced ETH is outside campaign accounting and has no sweep function. Tests do not require RPC access. No on-chain deployment, gas fee payment, wallet integration, or Iteration 4 work occurred. Contract/fund accounting approval is required before frontend Web3 integration.
