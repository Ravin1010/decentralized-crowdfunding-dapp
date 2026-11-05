# Deployment and acceptance checklist — 6E follow-up

**Final comprehensive production acceptance remains pending independent review.** This current checklist adds independently verified post-withdrawal state, Vercel API deployment-to-source provenance and public withdrawn-state UI evidence. See [6E acceptance follow-up](acceptance-followup-6e.md) for exact values/methods, and [historical 6D live evidence](live-lifecycle-evidence-6d.md) for the seven lifecycle transactions. The getter, withdrawn UI and production provenance checks were pending at 6D; that document and 6A/6B records remain unchanged.

**Historical boundary:** no public deployment occurred in 6A. The [6B evidence document](deployment-evidence-6b.md) records the later authorized deployment, original Codex HTTP 403 access limitation, subsequent independent Blockscout verification and separate user-supplied Foundry/Etherscan output. Its Codespaces observations and no-crowdfunding-transactions statement describe those earlier checks, not the later 6D lifecycle evidence.

**Historical 6D access limit:** all seven Blockscout API transaction reads and seven Etherscan page fallbacks were attempted but inaccessible through the web reader. Production homepage/list/create/detail reads were also inaccessible; normal Blockscout/Vercel HTTPS probes returned HTTP 403 at CONNECT. The supplied prior independent-review findings are preserved, not presented as fresh successful rechecks by this agent. Repository/PR merge metadata was independently checked during 6D. Later 6E Vercel API and rendered-page reads succeeded as recorded below; this does not rewrite the earlier access failure. This checkpoint authorizes no deployment, transaction or signature.

## Historical 6B preparation and deployment provenance

- [x] 6A accepted in `main`; source baseline independently confirmed as `fd7a58366f0ac42deeaaf3a600ecaf2e703e37f5`.
- [x] Accepted source rebuilt locally with pinned compiler/settings; exact frontend ABI and compiled runtime hash independently reproduced.
- [ ] Operator's deployment-time clean checkout, signer/test ETH budget and command/fee review evidence supplied.
- [x] One Sepolia deployment was explicitly authorized in the preceding ChatGPT conversation before execution: the user responded **“proceed”** to the request for one deployment. No stable external authorization permalink was captured. At 6B, live crowdfunding lifecycle transactions remained separately unauthorized; later completed evidence is recorded below, without inventing an authorization permalink or granting further transaction authority.
- [x] Subsequent independent reviewer verified transaction/receipt/block and recomputed both full bytecode hashes through Blockscout; matches accepted artifacts. This does not claim a direct reviewer Etherscan-status check.

## Deployment evidence

| Evidence | Recorded value / provenance |
| --- | --- |
| Accepted deployment source SHA | `fd7a58366f0ac42deeaaf3a600ecaf2e703e37f5` — source supplied by user; repository baseline independently confirmed |
| Deployment authorization / reference | One Sepolia deployment explicitly authorized before execution by the user’s **“proceed”** in the preceding ChatGPT conversation; no stable external permalink captured. This documentation work grants no further transaction authorization. |
| Deployment network and chain ID | Ethereum Sepolia, **11155111** — subsequent independent Blockscout review |
| Public deployer address | `0x8C710111bCfA5418289171c3b7B11665ddA50E7d` — subsequent independent Blockscout review |
| Contract address | `0x8627ffb5768CF5E47965E55F6855f8910b474A25` — subsequent independent Blockscout review |
| Deployment transaction hash | [`0xfec76744a082b6455d0cde1b18310d7c7657b05a7bc4eed78b5dfd848412560d`](https://sepolia.etherscan.io/tx/0xfec76744a082b6455d0cde1b18310d7c7657b05a7bc4eed78b5dfd848412560d) — subsequent independent Blockscout review |
| Receipt status | **Success** — subsequent independent Blockscout review |
| Block number / block hash | **12053283** / `0x7643fbead4a2270102eec6404bf8766754364b7051ec7743b851f04c4f0a52fd` — subsequent independent Blockscout review |
| Deployment timestamp | **2026-11-03 13:43:24 MYT (05:43:24 UTC)** — subsequent independent Blockscout review |
| Actual gas used | **6,498,902** — subsequent independent Blockscout review; distinct from gas limit (6A local reference: 939,622 gas) |
| Transaction gas limit / unused capacity | **6,551,648** / **52,746** — reviewer-verified limit minus used; unused capacity is not gas consumed |
| Compiler / optimization | Solidity **0.8.20**, **200 runs** — user-supplied Foundry/Etherscan output; accepted local settings independently checked |
| Creation bytecode fingerprint | **4030 bytes**, keccak256 `0x202c464ec9e438aef048e3759d6a2def21492b9af4c773bc973c2c14c4cd1c52` — independent local artifact and full creation-bytecode hash recomputed by subsequent reviewer |
| Runtime bytecode fingerprint | **3997 bytes**, keccak256 `0x5b1a0eabdf6cde465b6427bf7d7c2b6542fa748dbac6cd60543d80ba9ebededd` — independent local artifact and full runtime-bytecode hash recomputed by subsequent reviewer |
| Bytecode match result | Independent reviewer recomputed both full creation and runtime hashes and confirmed exact matches to accepted deployment artifacts; original local hashes reproduced separately |
| Source verification | [Sepolia Etherscan verified source](https://sepolia.etherscan.io/address/0x8627ffb5768CF5E47965E55F6855f8910b474A25#code), **“Pass - Verified”** — user-supplied Foundry output; no direct independent reviewer Etherscan-status recheck |
| Initial `campaignCount()` | **0** — user-supplied initial read, not an independently fetched current value |
| Public RPC / browser checks | At 6B, wallet-free reads and Sepolia recognition passed in Codespaces — user-attested. Later independent public-page access is recorded in 6D; broader browser/RPC/CORS checks remain incomplete. |
| Current frontend hosting | [decentralized-crowdfunding-dapp.vercel.app](https://decentralized-crowdfunding-dapp.vercel.app) — production alias independently resolved via connected Vercel API in 6E; public Campaign #2 rendered-page data also loaded. Codespaces was the historical temporary preview. |
| Vercel API deployment-to-source provenance | Project `prj_sVG75ZF0tWyEsMXDKcd7RTxGnJU7`, production deployment `dpl_DcA7fkgm8FJU1PRDEzemuNT5BQu6`, **READY**; API source `Ravin1010/decentralized-crowdfunding-dapp`, branch `main`, recorded Git commit `ab9a127ad0383681a61974339ba55dd42790c385`. Lookup by hostname and deployment ID returned the same deployment. This is API provenance, not cryptographic verification of built JavaScript assets. See [6E methods](acceptance-followup-6e.md#vercel-api-deployment-to-source-provenance). |

Public reviewer references: [Blockscout transaction API](https://eth-sepolia.blockscout.com/api/v2/transactions/0xfec76744a082b6455d0cde1b18310d7c7657b05a7bc4eed78b5dfd848412560d), [contract API](https://eth-sepolia.blockscout.com/api/v2/smart-contracts/0x8627ffb5768CF5E47965E55F6855f8910b474A25), [block API](https://eth-sepolia.blockscout.com/api/v2/blocks/12053283).

### Historical 6B gas context

The [Ethereum Foundation announcement](https://blog.ethereum.org/2026/10/16/glamsterdam-hoodi-announcement) confirms Sepolia's **October 6, 2026** Glamsterdam activation. [EIP-8037](https://eips.ethereum.org/EIPS/eip-8037) increased code-deposit state cost from **200 to 1,530 gas per byte**. Both sources were verified during the 6B documentation correction. For **3,997 runtime bytes**, that change alone adds **5,316,010 gas**, substantially explaining the **5,559,280-gas** increase over the historical local reference. This is not a complete opcode-level reconciliation. Actual gas used, gas limit and unused capacity remain separate; see the [6B gas explanation](deployment-evidence-6b.md#gas-explanation-local-reference-versus-upgraded-sepolia).

## Historical 6B browser checks

- [x] Live Sepolia mode without demo campaigns, initial empty collection and wallet-free reads — **user-attested Codespaces checks at 6B**.
- [x] MetaMask connects, connected address/chain 11155111 display correctly; disconnect/reconnect/refresh passed — **user-attested at 6B**.
- [x] No crowdfunding transactions during **those earlier checks** — user attestation. The later transactions below do not rewrite that history.

## Completed 6D evidence

- [x] Campaign #1 **SEP QA - Cancel and Refund**: create → 0.0001 ETH contribution → cancel → individual 0.0001 ETH refund; **supplied independent Blockscout verification**, not a fresh workspace recheck. Status Cancelled, historical raised **0.0001 ETH**, reported post-refund contract balance **0 ETH**.
- [x] Campaign #2 **SEP QA - Successful Withdrawal**: create → exact 0.0001 ETH goal → deadline passes → 0.0001 ETH withdrawal to creator A; **supplied independent Blockscout verification**. Successful after deadline, withdrawal three minutes later, reported post-withdrawal contract balance **0 ETH**. Those getter/UI checks were pending during 6D; later 6E verifies the getters and public UI below, while creator-connected UI verification remains open.
- [x] Persistent frontend hostname and independent public access to homepage/list/create/details recorded: **[production Vercel frontend](https://decentralized-crowdfunding-dapp.vercel.app)** — supplied independent-review findings. Current hosting is no longer only a temporary Codespaces preview.
- [x] [PR #8 SPA routing](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/pull/8), accepted squash `c4dfdf1ce9450e11dc0c581d9094d48de747d262`, and [PR #9 hotfix](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/pull/9), accepted squash `4a38309ce6aa42990dbef2fe84c0022f193c3913`: merge metadata independently confirmed via GitHub.
- [x] Original PR #9 CI: **57 unit tests, 70 browser scenarios, 43 Foundry tests passed** — automated mock/local verification, separate from live blockchain findings; [frontend run](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/41787627983), [Foundry run](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/41787627980).
- [x] Real MetaMask **B → A after Campaign #2's contribution** cleared the prior confirmation message without navigation — **user-attested only**, not independently replayed and not a complete live wallet-switch test matrix.

### Live lifecycle transaction evidence

All seven hashes/events/blocks below were previously independently checked through Sepolia Blockscout per the supplied review record. Links are public references; fresh explorer access failed during 6D as recorded above. Later 6E getter evidence is a separate subsequent read. Wallet A (creator): `0x4A779fA7d5eA106f1aDFB8369e65fCAA465ca7Fd`; wallet B (contributor): `0x890F63435Cf6F4D526F7062A282A94c74A50cFa3`.

| Campaign / action | Transaction / explorer | Block | Event / amount |
| --- | --- | --- | --- |
| #1 create | [`0xedbcac00c9f76238cccf05ccbd625d6581babb9dfc9b65954c979fca9e334386`](https://eth-sepolia.blockscout.com/tx/0xedbcac00c9f76238cccf05ccbd625d6581babb9dfc9b65954c979fca9e334386) | 12060569 | `CampaignCreated`; goal 0.0002 ETH |
| #1 contribute | [`0x443732f7ed6b248dbe800d14aa5c03f8f92f16bb31d70920e46d3c0f51e526aa`](https://eth-sepolia.blockscout.com/tx/0x443732f7ed6b248dbe800d14aa5c03f8f92f16bb31d70920e46d3c0f51e526aa) | 12060590 | `ContributionReceived`; 0.0001 ETH |
| #1 cancel | [`0xdaa78fad00050e4dd8ac9f3c8bf1335241b5dc97f3cd6d01ebfa9264111be76a`](https://eth-sepolia.blockscout.com/tx/0xdaa78fad00050e4dd8ac9f3c8bf1335241b5dc97f3cd6d01ebfa9264111be76a) | 12060605 | `CampaignCancelled`; no automatic refund |
| #1 refund | [`0xd0e60ad204ea69aa283170a3168572330a2257fd72e4bd8b5f9c5b2371cb7b95`](https://eth-sepolia.blockscout.com/tx/0xd0e60ad204ea69aa283170a3168572330a2257fd72e4bd8b5f9c5b2371cb7b95) | 12060655 | `RefundClaimed`; 0.0001 ETH to B |
| #2 create | [`0x8b0c7b7a205961abbd781a512a5b6f20a0abebc27633de7869a7911f50a7d3a7`](https://eth-sepolia.blockscout.com/tx/0x8b0c7b7a205961abbd781a512a5b6f20a0abebc27633de7869a7911f50a7d3a7) | 12060856 | `CampaignCreated`; goal 0.0001 ETH |
| #2 fully fund | [`0xebfa8d27ae2d569b0298c564a94d903f4220b1a1dd46b667c054ccd4bb8fb1ad`](https://eth-sepolia.blockscout.com/tx/0xebfa8d27ae2d569b0298c564a94d903f4220b1a1dd46b667c054ccd4bb8fb1ad) | 12060876 | `ContributionReceived`; 0.0001 ETH, 100% |
| #2 withdraw | [`0xcdfec186386d6bd6bea5de5a75ba624899db2bc2d3e1050d60bc2e36d282e10e`](https://eth-sepolia.blockscout.com/tx/0xcdfec186386d6bd6bea5de5a75ba624899db2bc2d3e1050d60bc2e36d282e10e) | 12067934 | `FundsWithdrawn`; 0.0001 ETH to creator A |

Campaign #2 was created **November 4, 2026, 3:13:36 PM MYT**, with deadline **November 5, 2026, 3:13:36 PM MYT**; withdrawal confirmed **November 5, 2026, 3:16:36 PM MYT** (**180 seconds after deadline**). Full funding before deadline remains Active; Successful is determined after deadline.

Refund/withdrawal settlement must not erase historical raised. Successful-campaign contribution records are historical records, not automatically refundable balances. At 6D, direct post-withdrawal getters were not independently recorded; subsequent independent Read Contract results are now documented in 6E below. No duplicate refund or second withdrawal attempt is recorded or claimed.

## Completed 6E acceptance evidence

- [x] **Post-withdrawal `getCampaign(2)`** independently verified through Sepolia Blockscout's **Read Contract** interface — [independent verification run](https://agent.tinyfish.ai/runs/536c1ec8-82f1-44ac-9ea6-d3a42a2e31cb), [exact getter table](acceptance-followup-6e.md#post-withdrawal-contract-state--campaign-2).
- [x] **`getCampaignStatus(2) = 1`** and **`contributions(2, 0x890F63435Cf6F4D526F7062A282A94c74A50cFa3) = 100000000000000` wei** independently verified in that same supplied read-only record. Successful historical contributions remain recorded and are **not refundable balances**.
- [x] **Vercel production alias → deployment → recorded Git source** independently verified via connected API and corroborated again in 6E by lookups using deployment ID and production hostname; exact fields above and [6E provenance](acceptance-followup-6e.md#vercel-api-deployment-to-source-provenance). No configuration/deployment action; **no built-JavaScript cryptographic hash verification claimed**.
- [x] **Public withdrawn-state frontend**, no connected wallet: **Successful**, exact message **“Successfully withdrawn”**, no **Withdraw Funds** button, public data loaded, no visible loading/error state — [independent browser run](https://agent.tinyfish.ai/runs/f68cbd7b-fa10-4801-8f67-4a1c23ac8dd0), [production Campaign #2](https://decentralized-crowdfunding-dapp.vercel.app/campaigns/2). A fresh rendered-HTML read in 6E corroborated these public indicators and disconnected controls. This does **not** complete a creator-connected MetaMask assertion.

| `getCampaign(2)` field | Independently verified result |
| --- | --- |
| `creator` | `0x4A779fA7d5eA106f1aDFB8369e65fCAA465ca7Fd` |
| `title` | `SEP QA - Successful Withdrawal` |
| `goal` | `100000000000000` wei |
| `deadline` | `1793862816` Unix seconds |
| `amountRaised` | `100000000000000` wei |
| `cancelled` | `false` |
| `withdrawn` | `true` |
| `status` | `1` (**Successful**) |

The Read Contract/browser-run findings above are supplied independent results with explicit references; retrieving the two historical TinyFish run pages in this workspace returned 404 via the content reader, so no run transcript or new getter execution by this agent is claimed. Fresh Vercel API and public rendered-page corroboration succeeded by their separate read-only methods. These later findings close the specified 6D evidence gaps prospectively, not retrospectively.

## Outstanding acceptance requirements and limits

- [ ] Broader **physical-device and accessibility** testing, keyboard/focus and assistive-technology coverage completed. Automated responsive cases do not fill this gate.
- [ ] **Comprehensive browser/device and wrong-network testing**, including account/network transitions, completed. Narrow public/user-attested checks do not establish the full matrix.
- [ ] **Creator-connected “Successfully withdrawn” frontend/MetaMask assertion** independently recorded. The completed disconnected public-page check is not this assertion.
- [ ] Independent formal security audit completed. None is claimed.
- [ ] Independent final acceptance result/reviewer/date recorded. **No comprehensive production/security acceptance yet.**

Implementation limits retained: **page-session-only** pending tracking; **one-confirmation** receipt handling; **full replacement and chain reorganization handling not implemented**. Duplicate refund/withdrawal prevention is covered by contract behavior and local tests, **not extra live duplicate attempts**. Save pending hashes before navigation/reload and inspect receipts/current state before repeating an action.

| Still-unverified acceptance evidence | Actual value |
| --- | --- |
| Creator-connected withdrawn UI assertion/reference | |
| Broader physical-device/accessibility results | |
| Comprehensive browser/device/wrong-network results | |
| Formal security audit reference | |
| Final acceptance result, reviewer and date | |

See [6E follow-up and methods](acceptance-followup-6e.md). Preserve the [historical 6D record](live-lifecycle-evidence-6d.md), [6B record](deployment-evidence-6b.md) and all 6A reports unchanged. This is an evidence handoff for independent review, **not permission to deploy/redeploy, send transactions, request signatures, fill gaps with sample writes, merge or enable auto-merge**.
