# DeCen Crowdfund — Technical Handoff

## 1. Purpose and release boundary

This document summarizes the accepted MVP for maintenance, demonstration and portfolio review. It does **not** certify security or expand release permissions. For the project narrative, see the [portfolio overview](portfolio-overview.md).

- **Repository:** https://github.com/Ravin1010/decentralized-crowdfunding-dapp
- **Experimental frontend:** https://decentralized-crowdfunding-dapp.vercel.app
- **Chain:** Ethereum Sepolia (`11155111`)
- **Existing deployed contract:** `0x8627ffb5768CF5E47965E55F6855f8910b474A25`
- **Source baseline when this handoff was prepared:** `2e21382cd9e761caa5258933f2ad3a479bbb4a39` (Iteration 8C accepted `main`)
- **Merge/deployment rule:** this handoff is documentation only. No smart contract redeployment, signing, public-chain transaction, configuration mutation or merge is authorized by it.

## 2. System map

| Responsibility | Location |
| --- | --- |
| Crowdfunding lifecycle and ETH escrow | `contracts/src/DecentralizedCrowdfunding.sol` |
| Core contract tests | `contracts/test/DecentralizedCrowdfunding.t.sol` |
| Network/contract configuration | `web/src/blockchain/config.ts` and `web/.env.example` |
| Public reads and wallet-specific contribution reads | `web/src/blockchain/reads.ts` |
| Wallet connect, disconnect and explicit network switch | `web/src/Wallet.tsx` |
| User-initiated transaction state and receipt reconciliation | `web/src/blockchain/transactions.ts` |
| Transaction model, error decoding and query invalidation | `web/src/blockchain/transaction-model.ts` |
| React screens and campaign actions | `web/src/App.tsx` and `web/src/Transactions.tsx` |
| Test/CI evidence | `.github/workflows/`, `web/tests/`, `web/acceptance/`, `docs/iteration-6/` through `docs/iteration-8/` |

There is no custom backend, database, indexer, platform admin or off-chain transaction scheduler.

## 3. Financial lifecycle

1. **Create:** any address may create a campaign with a nonempty title/description, positive goal and duration from 60 seconds to 30 days. The current web form offers 1–30 whole days; live submission requires an explicitly connected wallet on Sepolia.
2. **Contribute:** while the campaign is Active and before its deadline, a contributor may send positive ETH up to the exact remaining goal. Overfunding reverts.
3. **Full goal reached early:** the campaign remains Active until its deadline, and accepts no further contributions. The creator may still cancel before the deadline.
4. **Cancel:** only the creator can cancel before the deadline; contributors then individually claim refunds.
5. **At or after deadline:** Cancelled takes precedence and remains Cancelled. Otherwise, the contract derives Successful when the goal has been met, or Failed when it has not. No timer-triggered status transaction is required.
6. **Withdraw or refund:** the creator withdraws a successful campaign once; contributors reclaim their own Failed/Cancelled contributions using pull refunds. Historical `amountRaised` remains visible after settlement. Successful-campaign contribution records also remain after withdrawal; they are historical contributions, not refundable balances.

The contract is the authority for permissions, contribution caps and settlement. The interface prevalidates for usability but never overrides on-chain checks. Successful transaction receipt precedes financial data refresh. Demo campaigns are explicitly fictional when the configured contract address is blank.

## 4. Reproduce locally without public-chain writes

Use Node `>=22.12`, npm and Foundry `v1.5.0` with the repository's pinned Solidity compiler and submodules.

```bash
git clone --recurse-submodules https://github.com/Ravin1010/decentralized-crowdfunding-dapp.git
cd decentralized-crowdfunding-dapp
cd web
npm ci
cp .env.example .env.local
npm run dev
```

**Leave `VITE_CROWDFUND_CONTRACT_ADDRESS` blank** to run the labeled demo mode. No secrets belong in any `VITE_` variable. Connecting to the existing Sepolia deployment is an explicit, separate choice; local demo setup does not authorize on-chain writes.

In a separate terminal, start from the repository root for these existing verification commands:

```bash
cd web
npm run typecheck
npm run build
npm test
npx playwright install --with-deps chromium
npm run test:browser
cd ../contracts
forge fmt --check
forge build
forge test -vvv
```

The browser suite requires installed Playwright browsers. A standalone `npm run test:anvil` local integration flow also exists; it uses disposable Anvil accounts and local chain state, not public Sepolia transactions. Consult the root [README](../../README.md) for its prerequisites and test fixture details.

## 5. Recorded verification and provenance

The links below point to historical evidence at their recorded revisions, not fresh chain or wallet verification performed for this handoff. Keep these sources separate; they do not form a single security sign-off:

- **Foundry/local Anvil:** local fund accounting, deadline boundaries, reentrancy/reverting receivers, and local write lifecycles; see [contract documentation](../smart-contract.md) and [local 6A verification](../iteration-6/README.md).
- **Mocked frontend/browser tests:** wallet state, public reads, transaction feedback, responsive behaviors and cross-browser checks; CI counts vary by revision.
- **Historical Sepolia chain evidence:** existing contract deployment, limited create/contribute/cancel/refund/withdraw lifecycles and later getter observations; see [6B](../iteration-6/deployment-evidence-6b.md), [6D](../iteration-6/live-lifecycle-evidence-6d.md) and [6E](../iteration-6/acceptance-followup-6e.md) for the exact independent-review and user-supplied provenance.
- **Limited real-wallet UI observations:** [6F](../iteration-6/live-wallet-acceptance-6f.md) records user-attested creator-connected withdrawn UI and screenshot-supported dApp-specific network detection. This was not an independently reproduced MetaMask session or a complete recovery matrix.
- **Security review:** source analysis, two npm audits, a triaged Slither run, extended fuzzing, and documented blind spots; see [8B review](../iteration-8/security-release-review-8b.md) and [8B ledger](../iteration-8/security-verification-8b.md).
- **8C maintenance:** immutable GitHub Actions pinning and README release-state correction; see [merged PR #19](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/pull/19).

Do not recast an old static screenshot, mocked wallet test, historical live observation or incomplete axe check as a fresh end-to-end acceptance result.

## 6. Known risks and deferred work

| Area | Current disposition |
| --- | --- |
| Transaction finality | One confirmation; no comprehensive replacement, reorganization or reload recovery; remains a documented limitation. |
| Payment receiver liveness | Contract wallets that permanently reject ETH can strand their own creator payout or refund. No alternate payout address exists. |
| Security assurance | Slither's findings were triaged, not fixed by a formal audit. No independent formal security certification. |
| Permissionless content | Arbitrary-length titles/descriptions are bounded by gas, not explicit metadata length caps; possible spam/RPC response burden. |
| Production controls | Certain security headers and classic branch protection were not independently verified in 8B. |
| Accessibility and wallet acceptance | Owner skipped 7F manual-device/screen-reader and 8A complete real-wallet testing; both remain **Not tested**. Automated axe incompletes still require manual evaluation. |
| Broader release | No mainnet deployment and no unrestricted real-value fundraising authorization. |

Per the owner's Iteration 9 handoff, proposed Iteration 8D transaction-recovery work was explicitly skipped. **Do not silently implement or label it resolved.**

## 7. Handoff checklist

- [x] Experimental Sepolia deployment and source evidence documented.
- [x] Root README corrected to reflect the existing deployment.
- [x] CI workflow Action references pinned to immutable SHAs.
- [x] Existing automated and limited live-lifecycle evidence linked with attribution.
- [ ] Independent formal security audit performed — **not completed**.
- [ ] Comprehensive physical-device/accessibility and real-wallet acceptance — **not tested** by owner decision.
- [ ] Production security-header/classic branch protection evidence fully verified — **not completed**.
- [ ] Mainnet or unrestricted real-value release approved — **not authorized**.

**Portfolio readiness is not equivalent to security acceptance.** This handoff records what exists and what remains open; it changes neither the application's guarantees nor its authorization boundary.
