# Manual Sepolia deployment procedure — future operator use only

Checkpoint 6A prepared and locally tested this procedure. **Do not execute the broadcast step until separate explicit deployment authorization is recorded.** No public contract has been deployed. Never paste a private key, recovery phrase or wallet password into Codex, chat, GitHub, a command argument, or this repository.

## Reproduce accepted artifacts

Start from the subsequently reviewed/accepted release commit (record its SHA in the checklist), with a clean checkout and recursive pinned submodules. The 6A baseline is `537f2b5f7d5a088f9562e0b47f5c2b3799a3420f`; this checkpoint does not change Solidity, dependencies, ABI or compiler configuration.

```sh
git status --short
git rev-parse HEAD
git submodule update --init --recursive
cd contracts
forge --version
forge fmt --check
forge build --force
forge test -vvv
forge test --gas-report
forge inspect src/DecentralizedCrowdfunding.sol:DecentralizedCrowdfunding abi
forge inspect src/DecentralizedCrowdfunding.sol:DecentralizedCrowdfunding metadata
```

Use Foundry **v1.5.0** and Solidity **0.8.20+commit.a1b79de6**, optimizer enabled, **200 runs**, EVM **Shanghai**, `viaIR` false/default and IPFS metadata hash. Preserve remappings and paths from `foundry.toml`/compiled metadata; do not regenerate with different source paths or settings. OpenZeppelin **5.0.2** is pinned at `dbb6104ce834628e473d2173bbc9d47f81a9eec3`. Save the exact compiler standard-JSON input/metadata from this build for verification.

Source: `contracts/src/DecentralizedCrowdfunding.sol`. Artifact: `contracts/out/DecentralizedCrowdfunding.sol/DecentralizedCrowdfunding.json`; full frontend ABI: `web/src/blockchain/abi.ts`. The Anvil runner asserts exact ABI equality. There are **no constructor arguments, linked libraries, immutables, owner/admin controls or upgrade proxies**. ReentrancyGuard initializes its storage during construction.

6A fingerprints (keccak256 of full hex bytecode, including metadata):

| Artifact | Bytes | keccak256 |
| --- | --- | --- |
| Creation bytecode | 4030 | `0x202c464ec9e438aef048e3759d6a2def21492b9af4c773bc973c2c14c4cd1c52` |
| Runtime bytecode | 3997 | `0x5b1a0eabdf6cde465b6427bf7d7c2b6542fa748dbac6cd60543d80ba9ebededd` |

Recompute after an accepted clean build; investigate any difference before signing. The local Anvil runner compares the complete deployed runtime to the artifact, not just code length.

## Read-only network, wallet and cost checks

Use a dedicated Sepolia test wallet controlled locally by the operator, with test ETH for deployment and gas. A hardware signer is preferred; a Foundry encrypted keystore is also suitable. Configure/unlock it **locally outside this repository**, using interactive prompts. Do not provide raw keys or keystore passwords to an agent. Do not use a mainnet funds wallet or commit wallet files. The wallet becomes no contract administrator.

In the operator's local terminal, set `SEPOLIA_RPC_URL` to a suitable Sepolia HTTPS endpoint and `DEPLOYER_ADDRESS` to the wallet's public address. These variables below are operator-provided; no credentials or real addresses are supplied here. Explorer API credentials, if used later, belong only in the operator's local secret environment, never `VITE_` variables.

```sh
cast chain-id --rpc-url "$SEPOLIA_RPC_URL"   # MUST be 11155111
cast balance "$DEPLOYER_ADDRESS" --ether --rpc-url "$SEPOLIA_RPC_URL"
cast gas-price --rpc-url "$SEPOLIA_RPC_URL"
# Read-only eth_estimateGas for contract creation, from contracts/:
cast estimate --rpc-url "$SEPOLIA_RPC_URL" --from "$DEPLOYER_ADDRESS" \
  --create "$(forge inspect src/DecentralizedCrowdfunding.sol:DecentralizedCrowdfunding bytecode)"
```

The local gas report observed **939622 gas** deployment cost; this is an estimate/reference, not a promised Sepolia cost. Use the current creation estimate plus a reasonable gas-limit margin (e.g. 20%), and a current maximum gas price to calculate an upper budget: `gasLimit × maxFeePerGas` wei (divide by 10^18 for ETH). Deployment transfers no funding value. Check the wallet balance covers that budget and fees; retain spare test ETH. Review final fees in the local signing tool. Do not infer gas cost from ETH/USD or use stale public gas prices.

## Explicit broadcast — only after future authorization

Record approval, source SHA, artifact fingerprints, expected sender, chain and gas budget in the checklist **before** running this local operator command. `sepolia-deployer` below denotes an encrypted keystore alias already configured locally; use the actual alias, or the appropriate Foundry hardware-wallet flags instead. No key/password argument is required.

```sh
# FUTURE OPERATOR ACTION; NOT EXECUTED IN 6A
forge create src/DecentralizedCrowdfunding.sol:DecentralizedCrowdfunding \
  --rpc-url "$SEPOLIA_RPC_URL" --chain 11155111 \
  --account sepolia-deployer --broadcast
```

There are no constructor arguments. Deploy **once**. Save the transaction hash immediately. If the command loses connectivity or times out, inspect wallet/receipt history and the sender's nonce before doing anything else; a missing CLI response is not proof of failure and must not cause a second deployment.

## Receipt, address and runtime verification

Set `DEPLOYMENT_TX_HASH` only to the actual returned hash in the operator terminal:

```sh
cast receipt "$DEPLOYMENT_TX_HASH" --rpc-url "$SEPOLIA_RPC_URL" --json
```

Require receipt status `0x1`, expected sender, null `to` (creation), nonzero contractAddress, and a mined block number. Record the actual receipt/address/block in the checklist. Resolve pending/reverted transactions before proceeding. Do not record an estimated or predicted address as deployed. Confirm the receipt remains canonical after additional blocks appropriate to review; the frontend's one-confirmation policy is not a finality guarantee.

Set `DEPLOYED_ADDRESS` to that receipt's actual contractAddress:

```sh
cast code "$DEPLOYED_ADDRESS" --rpc-url "$SEPOLIA_RPC_URL"
cast keccak "$(cast code "$DEPLOYED_ADDRESS" --rpc-url "$SEPOLIA_RPC_URL")"
cast keccak "$(forge inspect src/DecentralizedCrowdfunding.sol:DecentralizedCrowdfunding deployedBytecode)"
cast call "$DEPLOYED_ADDRESS" 'campaignCount()(uint256)' --rpc-url "$SEPOLIA_RPC_URL"
```

Require nonempty runtime and exact byte-for-byte equality with the compiled deployedBytecode, including metadata (compare the displayed hashes and, for the record, the complete hex). It should have zero campaigns immediately after deployment. If code/interface differs, stop; do not configure the frontend or send test funding. Recheck the public RPC chain and browser CORS before configuring Vite.

## Source verification and frontend configuration

Use Sepolia Etherscan (https://sepolia.etherscan.io) and the exact accepted compiler/settings/source inputs. Foundry can submit and poll verification with the operator's locally supplied explorer API key:

```sh
# Future local operator action, after successful deployment/code checks:
forge verify-contract "$DEPLOYED_ADDRESS" \
  src/DecentralizedCrowdfunding.sol:DecentralizedCrowdfunding \
  --chain 11155111 --compiler-version v0.8.20+commit.a1b79de6 \
  --num-of-optimizations 200 --watch
```

Foundry reads `ETHERSCAN_API_KEY` from the operator's local environment. Alternatively upload Foundry's standard JSON input via the explorer's source-verification UI; select compiler 0.8.20, optimizer 200, Shanghai, original source paths/remappings, IPFS metadata and empty constructor arguments. Record the successful source verification URL; a submission alone is not verification success.

Only after code/source checks, set the frontend's public `VITE_CROWDFUND_CONTRACT_ADDRESS` to the actual address and `VITE_SEPOLIA_RPC_URL` to a browser-safe endpoint, rebuild, and verify SPA deep-link hosting. These values are public; use no secret RPC token. Browse the initial empty state without MetaMask, then test explicit connection/network switching with real MetaMask in future 6B. **Small-value lifecycle transactions require separate approval** and belong to the future handoff, not this procedure's preparation checkpoint.
