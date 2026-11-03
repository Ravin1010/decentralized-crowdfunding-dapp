# Future Checkpoint 6B handoff

**6B is not authorized by 6A. No step below was executed against a public chain in this checkpoint.** Use the [deployment procedure](deployment.md) and [evidence checklist](checklist.md) only after review.

1. Confirm the subsequently accepted release source SHA, clean submodules, compiler/settings, exact frontend ABI and creation/runtime bytecode fingerprints.
2. Have the operator confirm a dedicated local Sepolia signer, chain ID 11155111, public sender address, available test ETH and current gas budget. Keep all secrets local; never request them in chat or GitHub.
3. Obtain explicit authorization to deploy this exact contract to Sepolia and record it.
4. The operator deploys once with the documented manual command and local encrypted/hardware signer. Save the actual submitted hash; never retry an uncertain submission blindly.
5. Verify a successful canonical receipt, expected sender/network, deployed address and exact runtime bytecode. Stop on any mismatch.
6. Record the actual address, deployment hash, block and fingerprints in the checklist. No predicted or fictional values.
7. Verify source on Sepolia Etherscan with original standard-JSON inputs/settings; record successful verification.
8. Configure/rebuild the frontend using the verified address and a public browser-safe Sepolia RPC. Confirm SPA deep links and reads, including the genuine initial empty state without a wallet.
9. Test real MetaMask browsing and explicit connection, silent restoration, explicit disconnect, account changes, wrong network and explicit switching. Initial browsing must prompt for no permission/signature.
10. **Obtain separate approval before any small-value creator/contributor lifecycle tests.** Then execute only approved actions, save each receipt/hash, reconcile authoritative reads, and record final results. A successful withdrawal needs a passed campaign deadline; refunds remain individually initiated. No automatic funding, keepers or deadline transactions.

Known handoff constraints: one confirmation; page-session-only pending feedback; unresolved replacement tracking; no independent audit; public RPC availability/CORS/rate limits and real extension behavior remain unverified locally. Save pending hashes and use wallet/explorer history before repeating an action. A refresh failure after a successful receipt is not a failed transaction. Do not begin 6C, merge, or claim production acceptance without its own authorization.
