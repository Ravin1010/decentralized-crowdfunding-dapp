# Checkpoint 6D — live Sepolia evidence and acceptance handoff

**Documentation only. Final comprehensive production acceptance remains pending independent review.** This checkpoint consolidates existing deployment, live lifecycle, hosting and wallet-switch evidence. It performs no deployment, transaction, wallet permission/signature request, application change or configuration change.

Accepted repository `main`: [`4a38309ce6aa42990dbef2fe84c0022f193c3913`](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/tree/4a38309ce6aa42990dbef2fe84c0022f193c3913). Documentation branch: `feature/iteration-6d-live-evidence`. The PR records its separate documentation head SHA; that SHA is not a contract deployment source or an established Vercel build SHA.

## Provenance and current verification limits

| Evidence category | Provenance and scope |
| --- | --- |
| Original deployment and bytecode verification | Historical [6B deployment evidence](deployment-evidence-6b.md). Preserve its original agent HTTP 403 limitation, subsequent independent Blockscout reviewer verification and user-supplied Foundry/Etherscan verification output as distinct sources. |
| Seven live lifecycle transactions below | The supplied independent-review record states all seven were checked through Sepolia Blockscout, including the listed events and outcomes. This document records those prior findings, not newly retrieved receipts. |
| Public production page access | Supplied independent-review findings: homepage, listing, creation and campaign details were accessed at the Vercel production domain. No immutable Vercel build-SHA attestation was supplied. |
| Real MetaMask wallet-switch observation | User attestation only: after Campaign #2's contribution, switching B → A cleared the previous confirmation message without navigation. Not an independently reproduced interaction or complete live wallet-switch matrix. |
| PR #9 automated regression | GitHub Actions evidence: 57 unit tests, 70 browser scenarios and 43 Foundry tests passed. Browser transactions use deterministic mocks; Foundry uses local EVM tests. These are separate from public-chain results. |
| Fresh read-only checks in this 6D workspace | Remote `main` and GitHub PR #8/#9 merge metadata were verified. All seven Blockscout transaction API URLs and seven Etherscan transaction-page fallbacks were attempted through the web reader; none was accessible. Production homepage/list/create/detail reads were also inaccessible. Normal HTTPS probes to Blockscout and Vercel failed with HTTP 403 at CONNECT under the managed network policy. No new receipt, event, sender, amount, campaign ID, block, balance, getter result or rendered production-page result was obtained here. |

The failed fresh recheck does not erase the supplied prior independent verification; it limits what this agent can independently claim. Receipt/event/sender/amount/campaign-ID/block data below are recorded from that supplied evidence and checked for internal consistency. No fabricated raw receipt, block hash, screenshot, transaction or getter value fills the access gap.

## Existing deployment reference

- Network: **Ethereum Sepolia**, chain ID **11155111**.
- Contract: `0x8627ffb5768CF5E47965E55F6855f8910b474A25`.
- Deployer: `0x8C710111bCfA5418289171c3b7B11665ddA50E7d`.
- Original deployment transaction: [`0xfec76744a082b6455d0cde1b18310d7c7657b05a7bc4eed78b5dfd848412560d`](https://eth-sepolia.blockscout.com/tx/0xfec76744a082b6455d0cde1b18310d7c7657b05a7bc4eed78b5dfd848412560d).

Refer to [6B](deployment-evidence-6b.md#confirmed-deployment-evidence) for original source SHA, compiler/settings, full bytecode hashes, receipt/block/gas evidence and exact historical provenance. No replacement deployment or fresh source-verification claim is introduced by 6D.

## Live lifecycle A — Campaign #1: SEP QA - Cancel and Refund

Creator **wallet A**: `0x4A779fA7d5eA106f1aDFB8369e65fCAA465ca7Fd`.

Contributor **wallet B**: `0x890F63435Cf6F4D526F7062A282A94c74A50cFa3`.

Goal: **0.0002 ETH = 200000000000000 wei**. All four successful actions, events and blocks below were independently checked through Blockscout according to the supplied review record. Actor labels identify the roles in that record, not freshly fetched sender fields.

| Action / campaign ID | Actor | Transaction / public explorer | Block | Verified event / amount meaning |
| --- | --- | --- | --- | --- |
| Create #1 | Creator A | [`0xedbcac00c9f76238cccf05ccbd625d6581babb9dfc9b65954c979fca9e334386`](https://eth-sepolia.blockscout.com/tx/0xedbcac00c9f76238cccf05ccbd625d6581babb9dfc9b65954c979fca9e334386) | 12060569 | `CampaignCreated`; goal 0.0002 ETH, not an ETH contribution |
| Contribute #1 | Contributor B | [`0x443732f7ed6b248dbe800d14aa5c03f8f92f16bb31d70920e46d3c0f51e526aa`](https://eth-sepolia.blockscout.com/tx/0x443732f7ed6b248dbe800d14aa5c03f8f92f16bb31d70920e46d3c0f51e526aa) | 12060590 | `ContributionReceived`; 0.0001 ETH contributed |
| Cancel #1 | Creator A | [`0xdaa78fad00050e4dd8ac9f3c8bf1335241b5dc97f3cd6d01ebfa9264111be76a`](https://eth-sepolia.blockscout.com/tx/0xdaa78fad00050e4dd8ac9f3c8bf1335241b5dc97f3cd6d01ebfa9264111be76a) | 12060605 | `CampaignCancelled`; cancellation initiates no automatic refund |
| Claim refund #1 | Contributor B | [`0xd0e60ad204ea69aa283170a3168572330a2257fd72e4bd8b5f9c5b2371cb7b95`](https://eth-sepolia.blockscout.com/tx/0xd0e60ad204ea69aa283170a3168572330a2257fd72e4bd8b5f9c5b2371cb7b95) | 12060655 | `RefundClaimed`; 0.0001 ETH transferred from contract to B |

Reported verified outcome: **Cancelled**, historical `amountRaised` **0.0001 ETH = 100000000000000 wei**, individual refund to B **0.0001 ETH**, contract ETH balance after refund **0 ETH**. Historical raised is **not zeroed by refund**. Contract design zeros the claimant's recorded balance before payout; that settlement value is different from historical raised. The supplied post-refund balance is a historical observation, not a fresh current-balance query by this agent.

## Live lifecycle B — Campaign #2: SEP QA - Successful Withdrawal

Goal: **0.0001 ETH = 100000000000000 wei**. Creator/payout recipient is wallet A above. The user describes wallet B → A switching after this campaign's contribution; the contributor role below follows that supplied narrative. All three successful transactions, events and blocks were independently verified through Blockscout according to the supplied record; no new sender fields were retrieved here.

| Action / campaign ID | Role in supplied record | Transaction / public explorer | Block | Verified event / amount meaning |
| --- | --- | --- | --- | --- |
| Create #2 | Creator A | [`0x8b0c7b7a205961abbd781a512a5b6f20a0abebc27633de7869a7911f50a7d3a7`](https://eth-sepolia.blockscout.com/tx/0x8b0c7b7a205961abbd781a512a5b6f20a0abebc27633de7869a7911f50a7d3a7) | 12060856 | `CampaignCreated`; goal 0.0001 ETH |
| Fully fund #2 | Contributor, B in user narrative | [`0xebfa8d27ae2d569b0298c564a94d903f4220b1a1dd46b667c054ccd4bb8fb1ad`](https://eth-sepolia.blockscout.com/tx/0xebfa8d27ae2d569b0298c564a94d903f4220b1a1dd46b667c054ccd4bb8fb1ad) | 12060876 | `ContributionReceived`; 0.0001 ETH, exact 100% goal |
| Withdraw #2 | Creator A | [`0xcdfec186386d6bd6bea5de5a75ba624899db2bc2d3e1050d60bc2e36d282e10e`](https://eth-sepolia.blockscout.com/tx/0xcdfec186386d6bd6bea5de5a75ba624899db2bc2d3e1050d60bc2e36d282e10e) | 12067934 | `FundsWithdrawn`; 0.0001 ETH transferred from contract to creator A |

| Milestone | Supplied verified time (MYT, UTC+8) |
| --- | --- |
| Created | November 4, 2026, **3:13:36 PM MYT** |
| Deadline | November 5, 2026, **3:13:36 PM MYT** |
| Withdrawal confirmed | November 5, 2026, **3:16:36 PM MYT** |

Withdrawal occurred **three minutes (180 seconds) after the deadline**. Funding reached 100%; the campaign remained Active before the deadline and became **Successful** afterward under the accepted contract rules. The verified withdrawal event/payout supports successful settlement; it does not substitute for an independently recorded post-withdrawal `getCampaign` getter result or creator-connected UI assertion.

Reported verified outcome: withdrawal **0.0001 ETH** to A, contract ETH balance after withdrawal **0 ETH**. By accepted contract design, historical raised remains **0.0001 ETH** and successful-campaign contribution records are retained after withdrawal; a positive historical contribution is **not a refundable balance**. No fresh post-withdrawal getter/contribution read is claimed. Balances describe the supplied post-transaction observations, not a continually verified current balance. **No second withdrawal attempt is recorded or claimed.**

## Persistent frontend hosting and source boundaries

Production frontend: **[decentralized-crowdfunding-dapp.vercel.app](https://decentralized-crowdfunding-dapp.vercel.app)**. This is the persistent production hostname in the supplied handoff, replacing the earlier temporary Codespaces preview as the current hosting record.

[PR #8](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/pull/8) introduced the Vercel SPA fallback. Its accepted squash commit is `c4dfdf1ce9450e11dc0c581d9094d48de747d262`. GitHub PR metadata was independently checked in this checkpoint and confirms that merge commit. The supplied independent public-access checks cover:

- [Homepage](https://decentralized-crowdfunding-dapp.vercel.app/).
- [Campaign listing](https://decentralized-crowdfunding-dapp.vercel.app/campaigns).
- [Creation page](https://decentralized-crowdfunding-dapp.vercel.app/create).
- Campaign details at `/campaigns/:id`; [Campaign #2 link](https://decentralized-crowdfunding-dapp.vercel.app/campaigns/2) is a canonical reference, not a new browser capture.

Those public access findings are prior independent-review evidence, not new successful page loads in this restricted workspace. Codespaces was temporary **at 6B**; that historical statement remains correct and its document is unchanged. No Vercel project/settings, aliases, build, redeployment or RPC configuration was changed by 6D.

GitHub `main` acceptance and PR merge SHAs are established repository facts. They do **not** prove which immutable Vercel deployment/build SHA serves the production alias. No immutable production build-SHA provenance was supplied or independently established; the checklist leaves this acceptance requirement open.

## Wallet-switch hotfix and live observation

[PR #9](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/pull/9), original head `371b34ba630ef0d5b4be3d36150c182c1ecb9aa8`, was accepted as squash commit `4a38309ce6aa42990dbef2fe84c0022f193c3913`. GitHub merge metadata and accepted `main` were independently checked in 6D.

Previously, a completed confirmed transaction kept the frontend lock set after switching wallets, preventing an eligible contributor from claiming a refund without navigation. The accepted fix clears completed, successfully refreshed transaction state for another connected account. Pending/unresolved receipts and original hashes remain protected; failed/in-progress refresh does not release the lock. Same-wallet manual **Choose another action** remains.

Independent CI evidence for the original PR head:

- [Frontend build #34](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/41787627983): **57 unit tests** and **70 browser scenarios passed**.
- [Foundry checks #22](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/41787627980): **43 tests passed**.

These are automated mock/local test results, not public transactions. **User-attested real MetaMask observation:** switching **B → A after Campaign #2's contribution** caused the previous confirmation message to disappear **without navigation**. This observation was not independently replayed by this agent and does not establish every wallet-switch, pending, disconnect or network-change scenario as live-tested.

## Acceptance handoff and remaining limitations

Completed evidence: original deployment/bytecode review referenced from 6B; two supplied independently verified live lifecycle records (seven transactions); persistent Vercel hostname and prior public page-access findings; accepted SPA routing/hotfix merges and original hotfix CI; narrowly scoped user-attested real MetaMask validation. **This is not comprehensive final production acceptance.**

The following remain explicit:

1. Broader **physical-device and accessibility testing is incomplete**; existing automated responsive checks do not establish a complete real-device or assistive-technology audit.
2. Pending transaction tracking is **page-session only**. Save submitted hashes before navigation/reload and inspect receipt/current state before repeating an operation.
3. Full transaction replacement and chain reorganization handling is **not implemented**.
4. The frontend waits for **one receipt confirmation**; deeper finality/reorg reconciliation is not promised.
5. Duplicate refund/withdrawal prevention is supported by accepted contract behavior and local tests, **not additional live duplicate attempts**. No repeat refund or second withdrawal is claimed by this evidence.
6. A **direct post-withdrawal on-chain getter read** and a **creator-connected “Successfully withdrawn” UI assertion** have **not been independently recorded**. Keep both gates open; the payout/event is not that missing evidence.
7. **Immutable Vercel production build-SHA provenance is not independently established**. Repository acceptance does not fill this gap.
8. **No independent formal security audit** has been completed.

The original 6A/6B descriptions, approval scope and access limits remain historical records, not claims that those checkpoints performed later live work. The current [acceptance checklist](checklist.md) distinguishes completed 6D findings from pending items. This documentation instruction grants **no authority for any further deployment, transaction or signature**; evidence gaps must remain open for separately authorized review.

Validation for this Markdown-only checkpoint: exact identifiers/amounts/block order/timing, links/anchors, GitHub merge metadata, documentation scope, `git diff --check` and required Git identity. Fresh explorer/page checks failed as described; no successful receipt/log decode, getter or live browser result is fabricated. No local application/Foundry/Anvil regression was rerun for documentation edits; any automatically triggered CI is reported separately in the PR.
