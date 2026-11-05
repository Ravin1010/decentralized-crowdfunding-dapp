# Checkpoint 6E — post-withdrawal and production provenance evidence

**Documentation only. Comprehensive production/security acceptance remains pending independent review.** This follow-up records newly supplied independent read-only findings and current corroborating Vercel API/public-page reads. No deployment, configuration change, application change, wallet permission/signature request or transaction was performed by this verification.

Accepted repository `main`: [`ab9a127ad0383681a61974339ba55dd42790c385`](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/tree/ab9a127ad0383681a61974339ba55dd42790c385). Branch: `feature/iteration-6e-acceptance-evidence`. The documentation PR records its own head separately; a later documentation commit must not be substituted for the deployment's recorded source commit.

## Historical boundary and evidence methods

The [6D live evidence](live-lifecycle-evidence-6d.md), [6B deployment record](deployment-evidence-6b.md) and all 6A documents remain unchanged. The post-withdrawal getter, withdrawn UI and deployment-source provenance gaps were **pending during 6D**. This later 6E record closes only the checks explicitly supported below; it does not claim the earlier checkpoints performed them.

| Evidence | Method and provenance |
| --- | --- |
| Campaign #2 post-withdrawal state | Supplied independent read-only verification through **Sepolia Blockscout's Read Contract interface**, linked to the existing TinyFish run below. No write interaction. The exact returned values are recorded as that independent finding, not as a new getter execution by this documenting agent. |
| Production deployment-to-source provenance | **Connected Vercel API** independent verification supplied in the handoff, corroborated again in 6E with read-only `get_deployment` calls by deployment ID and by production hostname, with Git repository information requested. Project identity was also read with `get_project`. |
| Public withdrawn-state browser evidence | Supplied independent **disconnected** read-only browser inspection, linked to the existing TinyFish run below. A fresh TinyFish `fetch_content` read of the public rendered HTML body corroborated the exact message, status and absence of the withdrawal control. This is not creator-connected MetaMask verification. |
| Reference retrieval limits | Reading the two historical TinyFish run URLs through `fetch_content` returned 404; the web reader could not open those run pages. The web reader also could not open the production page, but the separate rendered-page fetch succeeded. Historical run links and supplied findings are retained; no run transcript or fresh getter result was fabricated. |

## Post-withdrawal contract state — Campaign #2

Network: **Ethereum Sepolia**, chain ID **11155111**. Contract: `0x8627ffb5768CF5E47965E55F6855f8910b474A25`. Campaign ID: **2**.

Independent read-only reference: [Blockscout Read Contract verification run](https://agent.tinyfish.ai/runs/536c1ec8-82f1-44ac-9ea6-d3a42a2e31cb). Public contract reference: [Sepolia Blockscout contract](https://eth-sepolia.blockscout.com/address/0x8627ffb5768CF5E47965E55F6855f8910b474A25).

The independently verified `getCampaign(2)` result supplied for this checkpoint is:

| Field | Verified result |
| --- | --- |
| `creator` | `0x4A779fA7d5eA106f1aDFB8369e65fCAA465ca7Fd` |
| `title` | `SEP QA - Successful Withdrawal` |
| `goal` | `100000000000000` wei (**0.0001 ETH**) |
| `deadline` | `1793862816` Unix seconds (**November 5, 2026, 3:13:36 PM MYT**) |
| `amountRaised` | `100000000000000` wei (**0.0001 ETH**) |
| `cancelled` | `false` |
| `withdrawn` | `true` |
| `status` | `1` (**Successful**) |

Additional independent reads in the supplied record:

| Call | Verified result |
| --- | --- |
| `getCampaignStatus(2)` | `1` (**Successful**) |
| `contributions(2, 0x890F63435Cf6F4D526F7062A282A94c74A50cFa3)` | `100000000000000` wei (**0.0001 ETH**) |

Only supplied getter fields are listed; no missing description or other value is invented. These are recorded observations, not a promise of a continuously monitored current state. `withdrawn = true` is a settlement flag; **Successful** remains the effective campaign status. Historical `amountRaised` and wallet B's contribution remain recorded after successful withdrawal. That retained contribution is **not a refundable balance**: the successful campaign does not satisfy Failed/Cancelled refund eligibility. No refund or additional withdrawal was attempted to demonstrate this.

## Vercel API deployment-to-source provenance

| Field | Independently verified API result |
| --- | --- |
| Production hostname | `decentralized-crowdfunding-dapp.vercel.app` |
| Project ID | `prj_sVG75ZF0tWyEsMXDKcd7RTxGnJU7` |
| Production deployment ID | `dpl_DcA7fkgm8FJU1PRDEzemuNT5BQu6` |
| Deployment status | `READY` |
| Deployment target | `production` — fresh API corroboration |
| Git source repository | `Ravin1010/decentralized-crowdfunding-dapp` |
| Git branch | `main` |
| Deployment's recorded Git commit | `ab9a127ad0383681a61974339ba55dd42790c385` |
| Production alias resolution | Hostname lookup returned the same deployment ID; the deployment's alias list includes the production hostname |

In the fresh read-only API responses, `deployment.project.id`, `readyState`, `target`, `meta.githubOrg`, `meta.githubRepo`, `meta.githubCommitRef` and `meta.githubCommitSha` matched the values above. Lookup by `dpl_DcA7fkgm8FJU1PRDEzemuNT5BQu6` and by `decentralized-crowdfunding-dapp.vercel.app` both identified that same deployment. These exact identifiers and methods provide a reproducible authorized API check without inventing a public API transcript or exposing private configuration.

This is **Vercel API deployment-to-source provenance**: the production alias is associated with a READY deployment whose recorded Git source is the accepted commit. It is **not independent cryptographic hash verification of the built JavaScript assets**, and does not claim byte-for-byte reproducibility or an asset-hash audit. The alias result describes the observation at verification time; it does not guarantee future alias immutability. No new deployment, alias change or configuration update was performed during these read-only checks.

Production reference: [DeCen Crowdfund](https://decentralized-crowdfunding-dapp.vercel.app). The previous 6D distinction between repository acceptance and then-unestablished deployment provenance remains historical; it is now supplemented by the API evidence above, not retrospectively rewritten.

## Public withdrawn-state frontend — no connected wallet

Page: [Production Campaign #2](https://decentralized-crowdfunding-dapp.vercel.app/campaigns/2).

Independent browser reference: [public withdrawn-state verification run](https://agent.tinyfish.ai/runs/f68cbd7b-fa10-4801-8f67-4a1c23ac8dd0).

The supplied independent read-only browser inspection confirmed:

- Campaign status **Successful**.
- Exact status message **“Successfully withdrawn”**.
- **Withdraw Funds** button absent.
- Public campaign data loaded successfully.
- No browser loading/error state remained visible.
- **No wallet connected** during the inspection.

A fresh read-only `fetch_content` retrieval of the complete rendered HTML body in this checkpoint also returned **Successful**, `<p role="status">Successfully withdrawn</p>` and **Public data loaded**. Its only button labels were **Connect Wallet** and **Refresh public data**; **Withdraw Funds** was absent. No `role="alert"` or loading/stale/error indicator appeared in the returned body. This corroboration is a rendered-page read, not a new interactive MetaMask session, console audit or full visual/accessibility test.

This closes **public withdrawn-state UI verification** only. A **creator-connected “Successfully withdrawn” MetaMask/UI assertion remains open**. A disconnected visitor's missing Withdraw Funds control alone cannot establish creator-specific action eligibility, even though the public settlement message and independently recorded `withdrawn` flag agree.

## Remaining acceptance requirements and engineering limits

The following are **not completed** by 6E:

- Creator-connected **“Successfully withdrawn”** UI assertion.
- Broader physical-device and accessibility testing.
- Comprehensive browser/device, account/network and wrong-network testing.
- Independent formal security audit.
- Comprehensive production/security acceptance and independent final approval.

Engineering limitations remain: **page-session-only pending tracking**, **one-confirmation receipt handling**, and **no comprehensive transaction replacement/reorganization monitor**. No additional live duplicate withdrawal or refund attempts were performed; duplicate settlement protection remains supported by accepted contract behavior and automated local tests rather than new public-chain attempts.

The [current checklist](checklist.md) marks the independent getter, Vercel API provenance and public UI checks complete, with the methods/references above. It keeps the creator-connected assertion and broader acceptance gaps open. No new functionality, architecture, deployment, configuration or wallet action is authorized by this documentation work.

## Documentation validation

Exact deployment/source identifiers, supplied getter values, historical wei accounting and deadline conversion were checked. Fresh Vercel API responses and rendered HTML corroboration are separated from supplied independent run findings and report-link retrieval limits. Markdown tables/relative links, `git diff --check`, the two-file scope, historical-document preservation, commit attribution and clean working tree are checked for the PR. No local application/Foundry/Anvil regression is rerun for Markdown-only edits; automatically triggered CI is reported separately in the PR. No missing live evidence is invented.
