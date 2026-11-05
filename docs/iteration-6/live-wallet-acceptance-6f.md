# Checkpoint 6F — live MetaMask acceptance observations

**Documentation only. Comprehensive production/security acceptance remains incomplete.** This checkpoint records user-performed creator-connected withdrawal UI and live dApp-specific network-change observations. It performs no wallet connection, permission/signature request, network/configuration change, transaction, deployment or application change.

Accepted repository `main`: [`162dde4a7fc69df4fed85c359d6d622e28152dce`](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/tree/162dde4a7fc69df4fed85c359d6d622e28152dce). Branch: `feature/iteration-6f-live-wallet-acceptance`. This source reference identifies the documentation baseline, not independently established build provenance for the user's live session.

## Evidence attribution and historical boundary

The live observations below are **user attestation**, including screenshot-supported visual findings and the user's test narrative in the preceding ChatGPT conversation, as supplied for this checkpoint. They are **not an independently reproduced MetaMask session by this agent**. No repository screenshot files, permanent screenshot URLs or independent wallet-test transcripts were supplied or created; none is invented here. The screenshot-supported characterization comes from the user’s report; this agent did not capture or independently inspect a stored screenshot. The conversation is the evidence source, without a captured stable external permalink.

Historical 6A–6E documents remain unchanged. In particular, [6E](acceptance-followup-6e.md#public-withdrawn-state-frontend--no-connected-wallet) independently recorded the **public, wallet-disconnected** withdrawn-state UI while creator-connected verification was still pending **at that checkpoint**. The later user-attested creator result below supplements that history; it does not recast 6E's browser inspection as creator-connected or independently verify a real wallet now.

## Creator-connected Campaign #2 withdrawal UI

Production page: [Campaign #2](https://decentralized-crowdfunding-dapp.vercel.app/campaigns/2).

Creator wallet A: `0x4A779fA7d5eA106f1aDFB8369e65fCAA465ca7Fd`.

Network: **Ethereum Sepolia**, chain ID **11155111**.

The user confirmed, while connected as creator A:

- Campaign #2 had already completed its successful withdrawal.
- Exact message **“Successfully withdrawn”** was visible.
- The **“Withdraw Funds”** button was absent.
- **No additional withdrawal transaction was submitted.**

This completes the narrowly scoped **user-attested creator-connected UI acceptance** observation. It is separate from 6E's independent public disconnected-page evidence and post-withdrawal getters. It does not demonstrate a live duplicate-withdrawal attempt. **Independent creator-wallet replay has not been performed here and remains open if final review requires evidence beyond user attestation.**

## Live network-change test — Chrome on Windows

Environment supplied by the user: **real MetaMask in Chrome on Windows, November 5, 2026 (MYT)**. Exact browser/extension versions and screenshot capture times were not supplied and are not inferred. This single observed environment is not a comprehensive browser/device compatibility matrix.

### Initial observation — inconclusive

Initially, changing the network through MetaMask did not cause the website to display **“Wrong network”**. Disconnecting and reconnecting then caused the website to display **“Wrong network”** and **“Switch to Sepolia”** correctly.

That initial observation **does not establish a frontend, Wagmi or MetaMask defect**. MetaMask can distinguish a portfolio-selected network from the network assigned to an individual connected dApp. The initial selection did not conclusively establish which network had been assigned to this site. No underlying provider/RPC fault or root cause is inferred.

### Controlled dApp-specific observation

The user repeated the test **without disconnecting**:

1. Creator wallet A remained connected to the crowdfunding website.
2. The user opened MetaMask's **connected-dApp network controls**.
3. The user changed the network assigned specifically to **`decentralized-crowdfunding-dapp.vercel.app`** from **Sepolia to Ethereum**.
4. The user returned to the website **without refreshing or reconnecting**.

The user's screenshots and narrative support these **user-attested visual findings**:

| Observation | User-confirmed result |
| --- | --- |
| Connected identity | Wallet A remained connected |
| Network indicator | **“Wrong network”** appeared |
| Explicit switch control | **“Switch to Sepolia”** button appeared |
| Warning text | **“Wrong network. Switch explicitly to use wallet-specific reads.”** appeared |
| Automatic switching | The app did **not automatically return the wallet to Sepolia** during the controlled observation |
| Financial interaction | **No transaction or signature was requested** |

This establishes live **dApp-assigned network-change detection and rendering**, plus absence of automatic return during that observation. It does not establish that every outcome of the site's explicit switch button was tested or that all live account/network transitions and recovery paths pass. The user changed the dApp's network in MetaMask; this is not evidence that the site's **Switch to Sepolia** action completed successfully.

### Separate network-switch error/recovery state

An intermediate user screenshot displayed exactly:

> Network switch rejected or unavailable. Public browsing remains on Sepolia.

Record this as a **separate user-attested visual error/recovery state**. The message alone does not establish the precise cause, a completed recovery, or a full success/rejection matrix for **Switch to Sepolia**. It is not evidence of a confirmed Wagmi/MetaMask defect and is not conflated with the later controlled detection result.

## Existing automated coverage — mocked wallet, not a live replay

The existing Playwright suite was inspected without modification. These source links are pinned to the accepted baseline; their mocked EIP-1193 events, RPC responses and assertions are distinct from the user's real MetaMask observations above.

| Coverage | Existing source reference |
| --- | --- |
| `chainChanged` emission / account switching fixture | [wallet mocks](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/blob/162dde4a7fc69df4fed85c359d6d622e28152dce/web/tests/mocks.ts#L299) |
| Contribution isolation on explicit connection, account change and disconnect | [reads.spec.ts — identity isolation](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/blob/162dde4a7fc69df4fed85c359d6d622e28152dce/web/tests/reads.spec.ts#L151) |
| Wrong network, no automatic switching, explicit switch enables reads | [reads.spec.ts — wrong network](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/blob/162dde4a7fc69df4fed85c359d6d622e28152dce/web/tests/reads.spec.ts#L192) |
| Rejected network-switch handling | [reads.spec.ts — rejection](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/blob/162dde4a7fc69df4fed85c359d6d622e28152dce/web/tests/reads.spec.ts#L211) |
| No automatic wallet permissions/writes on public refresh, polling or deadline expiry | [public reads](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/blob/162dde4a7fc69df4fed85c359d6d622e28152dce/web/tests/reads.spec.ts#L29), [read-only polling](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/blob/162dde4a7fc69df4fed85c359d6d622e28152dce/web/tests/reads.spec.ts#L236) |
| Pending transaction context/duplicate lock survives account/network changes or disconnect | [transactions.spec.ts — pending identity](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/blob/162dde4a7fc69df4fed85c359d6d622e28152dce/web/tests/transactions.spec.ts#L496) |
| Wrong network blocks writes; explicit switching does not resume a queued transaction | [transactions.spec.ts — network safeguard](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/blob/162dde4a7fc69df4fed85c359d6d622e28152dce/web/tests/transactions.spec.ts#L542) |
| Completed wallet-switch state release versus unresolved transaction protection | [transactions.spec.ts — hotfix cases](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/blob/162dde4a7fc69df4fed85c359d6d622e28152dce/web/tests/transactions.spec.ts#L855) |

These tests support automated behavior under controlled mocks. They do **not** convert every network/account scenario into live acceptance or independently reproduce the user's screenshots. No new local browser, Foundry, Anvil or MetaMask test was run for these Markdown edits. Automatically triggered CI results are reported separately in the PR, with exact counts only after logs are inspected.

## Remaining acceptance work and engineering limitations

Still incomplete:

- Comprehensive physical-device testing.
- Full keyboard, focus and screen-reader accessibility testing.
- Cross-browser and mobile-browser compatibility testing.
- Full real MetaMask account/network-change and recovery matrix, including the explicit switch button's success/rejection/recovery outcomes.
- Independent formal security audit.
- Comprehensive production/security acceptance and independent final review.

An independent creator-wallet replay beyond this user attestation remains unperformed, **if required by final acceptance review**. No screenshot or independent transcript is manufactured to close it.

Engineering limitations remain **page-session-only pending tracking**, **one-confirmation receipt handling**, and **no comprehensive transaction replacement/chain-reorganization monitor**. No additional live duplicate withdrawal or refund attempts occurred; this iteration does not resolve those limits or imply new live duplicate-settlement testing.

The [current checklist](checklist.md) marks only the specified user-attested 6F observations complete. Exact wallet/network/UI text, evidence attribution, source links/relative anchors, two-file scope, historical preservation, `git diff --check` and required Git identity are validated for the PR. No code, Solidity, ABI, tests, dependencies, workflows, MetaMask/RPC/Vercel configuration or deployment behavior is changed. Leave the PR open and unmerged for independent review; no further wallet operation or deployment is authorized by this record.
