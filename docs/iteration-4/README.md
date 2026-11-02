# Iteration 4 — wallet connection and public reads

Accepted baseline: `3cb3dcb6654c6f188ede6872345ef8ac03203717`.

The existing React/Vite pages now render contract data through wagmi/viem and TanStack Query, while MetaMask is used only for explicit connection and network switching. No transaction, signing, deployment, backend, indexer, global campaign store, or event subscription was added. The Solidity contract, its dependency revisions, tests, Foundry configuration and workflow remain unchanged.

## Configuration and modes

Copy `web/.env.example` to `web/.env.local` for local configuration, then restart Vite. Vite embeds these values at build time, so production configuration changes require a rebuild.

- `VITE_CROWDFUND_CONTRACT_ADDRESS`: leave empty for demo mode. A syntactically valid, nonzero Ethereum address enables the live read path. Mixed-case addresses must have a valid checksum. There is no hardcoded deployment address.
- `VITE_SEPOLIA_RPC_URL`: optional; defaults to `https://ethereum-sepolia-rpc.publicnode.com`. HTTPS required, except localhost HTTP for deterministic verification. Credentials in URL userinfo are rejected. The actual RPC chain ID must be **11155111** before campaign reads proceed, including manual refreshes.
- **All `VITE_` values are public browser configuration. Never use private keys, secret RPC credentials, or other secrets.** Public endpoints can impose availability/rate limits; a provider must permit browser requests (CORS).

No crowdfunding contract has been deployed to Sepolia by this project. A syntactically valid address does not prove a deployment exists. An unreadable or incompatible contract produces an error; it never falls back to sample data.

Demo mode preserves all six original fictional campaigns, artwork, stories and fixture amounts. Labels identify sample ETH values, a fixed snapshot and lack of configured deployment. The actual wallet controls can still connect explicitly in demo mode; demo campaigns do not read real contribution balances.

Live mode never includes demo campaigns. Home, explore and details show only public contract responses, chain/contract context, loading, empty, errors, successful refresh time, or explicitly labeled previous/stale campaign data. Original artwork is neutral, decorative artwork rather than a claimed campaign image. Live descriptions and creator addresses come directly from storage; no story, funding plan, or human creator identity is invented.

## Interface and data ownership

`web/src/blockchain/abi.ts` is the read-only projection of the accepted Foundry JSON artifact at `contracts/out/DecentralizedCrowdfunding.sol/DecentralizedCrowdfunding.json`: campaignCount, getCampaign, getCampaignStatus, contributions, and InvalidCampaign. It preserves tuple component names/order/types, enum uint8 and custom error; no write ABI is exposed. `getCampaign` already returns authoritative effective status, so no redundant status query is needed.

`config.ts` validates configuration; `providers.tsx` owns one wagmi configuration (Sepolia HTTP transport and injected MetaMask connector) and one TanStack Query client; `reads.ts` owns read hooks and the contract-to-view conversion. The existing `CampaignCard`, status, progress, cover and detail layouts are reused.

Wagmi's generated query keys include chain ID, contract address, function, campaign ID and contributor address when applicable. The RPC-chain validation query is separately keyed by chain and endpoint. Campaign data is never copied into a second local React store. Only local form fields, pagination, and UI interaction state use React state.

Explore requests campaignCount and a bounded page of up to **12 sequential IDs**, ordered ascending; Next/Previous replace the current result rather than append. Home uses the first page. This keeps requests bounded when campaignCount grows. List reads use wagmi's batch/multicall path. Selected campaign reads validate positive uint256 IDs; nonexistent IDs and RPC/decode failures show errors. Campaigns are keyed by stable IDs within the fixed chain/contract context.

Foreground queries refetch every 15 seconds, with no interval polling in hidden tabs. Focus return and manual refresh can refetch stale data. Unmounted views have no polling observers. There are no timer-based status writes or one-second RPC loops. Contract-returned status remains authoritative even after the displayed deadline passes; there is no local status inference or on-chain deadline synchronization.

A failed campaign refresh retains cached campaign data with a stale warning where available, rather than fabricating zero amounts. Wallet contribution reads use the current connected address and campaign key, have no previous-key placeholder data, and are disabled/hidden on disconnect or wrong network. Failed contribution reads hide unconfirmed balances. A shared public-RPC validation failure is also shown as unavailable rather than a balance. Tests cover delayed old-wallet responses.

## Wallet behavior

- `reconnectOnMount=false`: connection is explicitly initiated each page session. Refresh does not prompt or automatically reconnect. Previously authorized wallets may reconnect after clicking Connect Wallet without a new permission dialog, depending on extension behavior.
- Connect Wallet obtains the injected MetaMask provider and invokes wagmi connection only in its click handler. No chain ID is requested as part of connection, so an unsupported connected chain does not cause an automatic switch.
- Connected state shows a shortened address and Sepolia or wrong-network status. Account/chain/disconnect events are handled by wagmi.
- Only the explicit **Switch to Sepolia** button invokes a network switch. Rejections and unavailable extensions remain recoverable; public reads continue independently.
- Contribution values are labeled **Your contribution**, never assumed to be refundable. Successful campaign records can persist after withdrawal.
- Create remains a local demo form. All financial actions remain unavailable. No success message claims publication, a contribution, withdrawal or refund.

## Financial correctness

All campaign goals, raised amounts, remaining amounts and contributions are bigint wei values. `viem.formatEther` formats exact ETH; fixtures convert their original values once with `parseEther`. Remaining is clamped to zero. Funding percentage uses integer arithmetic and floors before conversion to a bounded 0–100 display value, so a partially funded campaign cannot round to 100%. Long exact values wrap and use smaller headline text when necessary; no precision is discarded.

Status enum values are Active=0, Successful=1, Failed=2 and Cancelled=3. Fully funded Active campaigns say **Fully funded — awaiting deadline**. Historical raised funds, remaining goal, wallet records and creator withdrawal completion are separate displays. The UI never clears historical raised amounts to represent payouts.

## Verification and reproduction

From `web/`:

```sh
npm ci
npm run typecheck
npm run build
npm test
npx playwright install --with-deps chromium
npm run test:browser
```

The cloud run used its existing `/usr/bin/chromium` via `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium` and writable npm cache (`npm_config_cache=/workspace/.npm-cache`). Browser tests start two local Vite processes: demo on 5173 and configured live read path on 5174. The test-only synthetic contract address and intercepted localhost RPC are confined to Playwright configuration/mocks. They are not deployment configuration. Tests run real wagmi/viem ABI encoding/decoding and hooks, using mocked JSON-RPC responses (including Multicall3) and an injected EIP-1193 provider. No Anvil deployment or public RPC is required for these tests.

| Check | Result |
| --- | --- |
| npm ci | Passed; current pinned dependencies install without the deprecated SDK tree from older wagmi |
| npm run typecheck | Passed |
| npm run build | Passed |
| npm test | 26 unit cases passed, 0 failed |
| npm run test:browser | 21 browser scenarios passed, 0 failed |
| forge build | Passed; Solidity 0.8.20 |
| forge test | 43 passed, 0 failed, 0 skipped; includes 256 fuzz cases |
| forge fmt --check | Passed |
| git diff --check | Passed |

Unit tests verify exact amounts, percentage/remaining boundaries, all statuses, settlement distinction, ID validation, configuration and read-only ABI. Browser scenarios verify public browsing without MetaMask/permissions, listing/detail ABI reads, empty/error/mismatched RPC, stale retained data, no duplicate cards, bounded pagination, explicit connection, unavailable/rejected wallet, explicit switch/rejection, accounts/disconnect isolation, contribution failure, delayed old account responses, foreground/background polling, read-only deadline expiry, and responsive/accessibility checks. The frontend workflow now runs these unit and browser tests after its existing build; Foundry CI is unchanged.

At 1440, 768 and 375 pixels, all four demo routes and live list/detail/wrong-network states were checked for horizontal overflow. Browser page errors were checked, along with keyboard skip navigation and reduced-motion support. Exact ETH data initially exposed an overflow that was fixed without changing the approved page structure.

## Screenshot evidence

These are **actual Chromium captures**, produced by `web/tests/reads.spec.ts`, not generated images. Live-path screenshots use **mocked contract responses and a mocked wallet**, not a deployed Sepolia contract or a real MetaMask extension. The synthetic address is test-only. Each set has desktop 1440px, tablet 768px and mobile 375px variants.

| State | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| Demo home | [1440](screenshots/demo-home-1440.png) | [768](screenshots/demo-home-768.png) | [375](screenshots/demo-home-375.png) |
| Disconnected live-path listing | [1440](screenshots/live-list-disconnected-1440.png) | [768](screenshots/live-list-disconnected-768.png) | [375](screenshots/live-list-disconnected-375.png) |
| Connected detail and wallet contribution | [1440](screenshots/live-detail-connected-1440.png) | [768](screenshots/live-detail-connected-768.png) | [375](screenshots/live-detail-connected-375.png) |
| Wrong network | [1440](screenshots/wrong-network-1440.png) | [768](screenshots/wrong-network-768.png) | [375](screenshots/wrong-network-375.png) |

Also captured: [empty contract](screenshots/live-empty.png) and [RPC error](screenshots/live-error.png).

## Known limitations

No deployed Sepolia contract exists, so real Sepolia contract integration and a real extension's popup UX have **not** been verified. Tests mock both boundaries explicitly; the screenshot labels above distinguish this. Real injected-provider behavior and public endpoint availability/CORS should be reviewed with an actual deployment in the authorized future checkpoint.

Vite reports an optional `ox`/Tempo `node:worker_threads` browser externalization and a ~597 kB minified entry chunk (~182 kB gzip) after adding the wallet/read libraries. This application does not use Tempo or worker APIs, and the tested read/wallet paths have no browser page errors. These non-fatal build notices were not suppressed. Playwright's local runner reports the inherited NO_COLOR/FORCE_COLOR conflict; the existing GitHub action runtime deprecation notices are unrelated to app behavior.

There is intentionally no write-transaction integration, transaction retry/receipt UI, fund-moving action, public-chain deployment, or Iteration 5 work. The original Solidity sources, dependencies, tests and compiler settings are unchanged from the accepted baseline. Git author/committer must remain Ravin1010 with the required noreply address and no co-author trailers.
