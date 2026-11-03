# Deployment and acceptance checklist — evidence pending

This is a preparation template, not deployment authorization. **No public-chain deployment occurred in 6A.** Expected future network: Ethereum Sepolia (chain ID 11155111). Evidence fields below are intentionally blank until actual observations exist.

## Before future 6B deployment

- [ ] 6A PR reviewed and accepted; accepted release source SHA recorded.
- [ ] Clean recursive checkout, pinned Foundry/compiler/OZ settings and ABI rechecked.
- [ ] Creation/runtime bytecode fingerprints independently reproduced.
- [ ] Dedicated local signer, correct sender, Sepolia chain and test ETH budget checked.
- [ ] Explicit deployment authorization recorded.
- [ ] Manual deployment command reviewed, including fees and no constructor arguments.

## Deployment evidence — fill only after approved execution

| Evidence | Actual value |
| --- | --- |
| Accepted release source SHA | |
| Explicit deployment authorization reference | |
| Actual deployment network and chain ID | |
| Public deployment wallet address | |
| Contract address | |
| Deployment transaction hash | |
| Receipt status | |
| Block number / block hash | |
| Actual deployment gas used | |
| Creation/runtime bytecode fingerprints | |
| Runtime byte-for-byte match result | |
| Source verification link and result | |
| Public RPC chain/CORS/read checks | |
| Frontend deployment URL | |
| Build source SHA / public configuration | |

## Future live testing — separate approval required

- [ ] Source verified and runtime matches accepted artifact before frontend configuration.
- [ ] Public browsing/empty state works without MetaMask or permission.
- [ ] Real MetaMask connect, silent restoration, disconnect, account changes and explicit network switch checked.
- [ ] Separate authorization for small-value creator/contributor lifecycle transactions recorded.
- [ ] All receipts checked, campaign/account state reconciled, historical funding preserved.
- [ ] Desktop/tablet/mobile, keyboard/focus and stale/error feedback checked on actual hosted frontend.
- [ ] Pending/replacement/reload limitation explained to test operators; hashes saved before navigation.
- [ ] Final acceptance reviewed; no unsupported production/mainnet claims.

| Live evidence | Actual value |
| --- | --- |
| Live lifecycle authorization reference | |
| Create smoke-test transaction hash(es) | |
| Contribution smoke-test transaction hash(es) | |
| Cancellation smoke-test transaction hash | |
| Refund smoke-test transaction hash(es) | |
| Withdrawal smoke-test transaction hash | |
| Receipt and authoritative read reconciliation results | |
| Real MetaMask / responsive testing evidence | |
| Remaining issues / risk acceptance | |
| Final acceptance result, reviewer and date | |

Do not fill public evidence with mock or local Anvil addresses, hashes, screenshots or inferred success. If a command times out after submission, recover its actual receipt before considering any resubmission.
