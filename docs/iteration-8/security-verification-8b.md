# Iteration 8B — Security verification execution ledger

## Baseline, execution and provenance

See the [risk review](security-release-review-8b.md) for threat model, findings and release decision. Started 2026-11-06 11:34:29 UTC (19:34:29 MYT), on Debian GNU/Linux 13/trixie. Baseline and initial feature SHA: `149d7fcb5b7e309d0417c4c1e6a69ab997f95da1`. Branch: `feature/iteration-8b-security-release-review`. Commands below ran against that unchanged production/test source; only the two 8B Markdown documents are added by this work.

Preparation read `AGENTS.md`, product spec, architecture, design system, test plan, relevant 6A–7E evidence, contract/tests/compiled artifact, frontend blockchain modules and all four accepted workflows. Initial checks: clean tree; freshly fetched exact `origin/main`; no existing local/remote branch or PR of this feature name. GitHub PR #16 API: merged, merge SHA equals baseline, prior PR head `d8467b818d648f715aca6bd4d0bbd6efc41a6825`. No historical failure evidence was overwritten.

| Tool/library | Executed version / pinned revision |
| --- | --- |
| Node / npm | 24.19.0 / 11.9.0 |
| Python | 3.12.14 |
| Playwright / Chromium | 1.64.1 / Debian system Chromium 154.0.8037.57 |
| Foundry | 1.5.0-v1.5.0, commit `1c57854462289b2e71ee7654cd6666217ed86ffd` |
| solc | 0.8.20+commit.a1b79de6, optimizer true / 200 runs |
| OpenZeppelin | package 5.0.2, git `dbb6104ce834628e473d2173bbc9d47f81a9eec3` |
| forge-std | v1.9.7, git `77041d2ce690e692d6e03cc812b57d1ddaa4d505` |
| Slither / crytic-compile | 0.11.6 / 0.4.2 |
| solc-select / web3 (isolated scanner dependencies) | 1.2.0 / 7.16.0 |

Submodules recursively initialized without changing revisions. Nested OpenZeppelin test dependencies: erc4626-tests `8b1d7c2ac248c33c3506b1bff8321758943c5e11`, forge-std `eb980e1d4f0e8173ec27da77297ae411840c8ccb`, ds-test `cd98eff28324bfac652e63a239a60632a761790b`.

Raw outputs stayed under `/tmp/8b-*` and are ephemeral local artifacts, not permanent public links or committed logs. Reproduction commands and the optional harness source are preserved here. No private environment dump, keystore, production secret value, wallet screenshot or credential artifact was collected.

## 1. Dependency audit — real execution

```bash
cd web
node --version
npm --version
npm_config_cache=/workspace/.npm-cache npm ci --ignore-scripts --no-fund > /tmp/8b-npm-ci.log 2>&1
install_exit=$?
npm audit --omit=dev --json > /tmp/8b-npm-audit-prod.json
prod_audit_exit=$?
npm audit --json > /tmp/8b-npm-audit-all.json
all_audit_exit=$?
```

Actual exit codes: install **0**, production audit **0**, all-dependency audit **0**. Both JSON responses parsed successfully, contained no tool/network error and reported info/low/moderate/high/critical/total **0**. No affected direct/transitive package, advisory ID or fixed version was returned; no reachability dismissal was required. Metadata: prod 28, dev 67, optional 47, peer 0, peerOptional 0, total 114 (categories overlap). `--ignore-scripts` was an audit-only install. The same install subsequently supported all reported build/test commands successfully; no separate script-enabled install was needed. No `audit fix`, update or lockfile rewrite was run.

The registry result does not cover git-pinned Solidity dependencies, unknown vulnerabilities, hosting or action supply chains. Additional public GETs for GitHub advisory queries affecting `viem@2.57.14`, `wagmi@3.7.9`, and OpenZeppelin's repository advisories were locally blocked (curl 56, proxy CONNECT 403, HTTP 000). These independent advisory cross-checks are **unverified**, not clean. There are consequently no newly obtained advisory URLs/publication dates for those package queries. The compiler advisory cross-check below did succeed.

## 2. Foundry and ABI checks

```bash
# Repository root; tool locations are this execution environment's temporary paths.
git submodule update --init --recursive
export PATH=/tmp/iteration7d-bin:$PATH
export FOUNDRY_SOLC=/tmp/iteration7d-solc/solc-0.8.20
cd contracts
forge --version
"$FOUNDRY_SOLC" --version
forge fmt --check
forge build
forge test -vvv
forge test --fuzz-runs 2000 -vv
```

All six substantive operations (submodules, fmt, build, ordinary tests, extended tests, compiler invocation) succeeded. Format/build/tests exit 0. Ordinary suite: **43 passed, 0 failed, 0 skipped**. Extended suite: **43 passed, 0 failed, 0 skipped**; `testFuzzFundingCapAndRefundConservation(uint96,uint96)` actually reported **runs: 2000**, rather than the ordinary 256. This is extended fuzz execution of an existing test, **not 2,000 distinct tests or invariant verification**. Other 42 cases are deterministic cases in the same suite.

The initial `forge build` reported cached compilation. Slither subsequently forced `forge build --build-info --deny never --skip ./test/** ./script/** --force`; its build-info and artifact metadata identify solc 0.8.20 / `0.8.20+commit.a1b79de6`. No compiler settings were changed. Exact normalized comparison of all compiled ABI entries to `web/src/blockchain/abi.ts`: **29 versus 29, equal, missing 0, extra 0**. Object keys were recursively sorted before comparing; array order, event indexing, parameter names/types and mutability were retained.

Accepted tests freshly exercised invalid IDs, deadline boundaries, fully funded Active cancellation, individual refunds, strict cap, double settlements, failed receivers/rollback, payout reentrancy and cross-campaign isolation. Tests `testWithdrawalTransferFailureRollsBackAndCanRetry` / `testRefundTransferFailureRollsBackAndCanRetry` prove state restoration with a receiver that later accepts ETH; they do not prove payout liveness for a permanently rejecting contract.

## 3. Slither — findings retained

Disposable environment installation:

```bash
python3 -m venv /tmp/8b-slither-env
/tmp/8b-slither-env/bin/pip install --disable-pip-version-check --no-cache-dir slither-analyzer==0.11.6
export VIRTUAL_ENV=/tmp/8b-slither-env
export PATH=/tmp/iteration7d-bin:/tmp/8b-slither-env/bin:$PATH
export FOUNDRY_SOLC=/tmp/iteration7d-solc/solc-0.8.20
cd contracts
slither --version
pip freeze > /tmp/8b-slither-freeze.txt
slither . --exclude-dependencies --solc "$FOUNDRY_SOLC" --json /tmp/8b-slither.json > /tmp/8b-slither.log 2>&1
slither_exit=$?
```

Installation succeeded. The first launch without `VIRTUAL_ENV` failed with read-only `/home/agent/.solc-select`; it was a scanner environment failure, not a clean scan. Setting the scanner's own virtual environment redirected its supported cache location into `/tmp`; no security/network policy or detector was bypassed. A harmless pip read-only-cache warning remained. The corrected scan completed with **exit 255**, JSON **success:true**, error:null, **2 contracts analyzed / 102 detectors / 4 results**. Exit 255 is retained as findings-present, not reported as exit-0 clean. Only dependencies were excluded from detector reporting as requested; they still compiled. No finding-specific exclusion/suppression was added.

| Detector / count | Slither severity / confidence | Source evidence and triage |
| --- | --- | --- |
| `timestamp` / 1 | Low / Medium | Contract `_status`, lines 135–140, comparison line 137. Expected deadline dependence, not randomness. Exact boundary tests pass; validator/chain time and wall-clock differences remain a design constraint. No change made. |
| `solc-version` / 1 | Informational / High | Main pragma line 2 and OpenZeppelin ReentrancyGuard pragma line 4, `^0.8.20`. Accepted build is exactly pinned to 0.8.20. Warning names three compiler bugs; conditions checked below. Retained informational toolchain risk, not a demonstrated miscompilation. |
| `low-level-calls` / 2 | Informational / High | Withdrawal line 94 and refund line 107. Required native ETH calls are guarded, update state first and revert on unsuccessful return. Existing malicious/rejecting receiver tests passed. F-02 payout recipient compatibility remains unresolved. |

References: [timestamp detector](https://github.com/crytic/slither/wiki/Detector-Documentation#block-timestamp), [compiler detector](https://github.com/crytic/slither/wiki/Detector-Documentation#incorrect-versions-of-solidity), [low-level calls](https://github.com/crytic/slither/wiki/Detector-Documentation#low-level-calls).

### Compiler advisory cross-check

A fresh successful curl GET retrieved the [official Solidity bug list](https://raw.githubusercontent.com/ethereum/solidity/develop/docs/bugs.json), exit 0. The GitHub connector's first raw-fetch attempt itself returned an AttributeError, so it was not treated as evidence. The ordinary public raw GET succeeded without policy changes. The following are the three bugs named by Slither, not a comprehensive compiler audit:

| Bug | Official severity / fixed | Applicability assessment and dated source |
| --- | --- | --- |
| SOL-2023-3 `VerbatimInvalidDeduplication` | Low / 0.8.23 | Official description states Solidity-source compilation is unaffected; Yul `verbatim` is required. This contract and its ReentrancyGuard are Solidity. [2023-11-08 bug post](https://blog.soliditylang.org/2023/11/08/verbatim-invalid-deduplication-bug/) |
| SOL-2023-2 `FullInlinerNonExpressionSplitArgumentEvaluationOrder` | Low / 0.8.21 | Official description excludes the default optimizer sequence. Accepted settings use optimizer/200 without custom optimizer steps. Trigger not identified. [2023-07-19 bug post](https://blog.soliditylang.org/2023/07/19/full-inliner-non-expression-split-argument-evaluation-order-bug/) |
| SOL-2023-1 `MissingSideEffectsOnSelectorAccess` | Low / 0.8.21 | Requires complex side-effectful `.selector` expression in legacy codegen. No such expression exists in the reviewed contract/ReentrancyGuard. Trigger not identified. [2023-07-19 bug post](https://blog.soliditylang.org/2023/07/19/missing-side-effects-on-selector-access-bug/) |

Post dates above are identified by the official bug-list links; the posts were not separately fetched. These conditions reduce the relevance of these specific warnings; they do not prove the compiler generally safe or authorize an upgrade/redeployment. No claim that npm scanned OpenZeppelin's Solidity code is made.

## 4. Additional bounded property exercise — isolated local EVM

A temporary project `/tmp/8b-invariant-project` copied only the accepted contract and Foundry config and symlinked the exact accepted `contracts/lib`. Its new harness was never added to repository tests. One stateful invariant checks:

- Actual target balance covers aggregate unsettled liability.
- Balance minus liability equals independently tracked forced ETH; balance plus paid ETH equals deposits plus forced ETH.
- Historical `amountRaised` equals independent gross deposits and never exceeds goal.
- Payout deltas are exact; settlement flags/counts agree; immediate repeated withdrawal/refund fails; each eligible per-campaign/per-wallet settlement occurs at most once.

Three known EOA actors, at most eight campaigns, 1 wei–5 ETH goals, 60 seconds–3 days duration, time advances up to one day per action, forced surplus up to 1 ETH. Random actions are create/contribute/cancel/withdraw/refund/advance/forceEther. Setup seeds a completed successful withdrawal, a completed cancelled refund, and an unsettled funded campaign to avoid entirely vacuous settlement coverage. Invalid/inapplicable random actions return early; handler call counts are **not numbers of actual financial writes**. Test balances use `vm.deal` only on local actors/helper, never to alter the crowdfunding target balance.

```bash
export PATH=/tmp/iteration7d-bin:$PATH
export FOUNDRY_SOLC=/tmp/iteration7d-solc/solc-0.8.20
export FOUNDRY_INVARIANT_RUNS=256
export FOUNDRY_INVARIANT_DEPTH=64
export FOUNDRY_INVARIANT_FAIL_ON_REVERT=true
forge test --root /tmp/8b-invariant-project --fuzz-seed 0x8b -vv
```

Two executions were made: the initial unseeded setup passed; the final setup above added deterministic payout examples and also passed. Final **exit 0**, **1 property passed, 0 failed/skipped**, **256 runs / 16,384 handler calls / 0 handler reverts**. Selector calls: advance 2,331; cancel 2,328; contribute 2,335; create 2,336; forceEther 2,340; refund 2,374; withdraw 2,340. The helper's constructor-only `selfdestruct` produces compiler deprecation warning 5159 and intentionally models forced surplus. It does not alter production code or claim a contemporary public-network SELFDESTRUCT experiment.

Coverage is bounded, uses finite known actors and the existing status getter, does not independently prove the entire status specification, and does not include arbitrary malicious receiver callbacks. The accepted 43 tests separately cover receiver failure/reentrancy. The model checks conservation and settlement on generated traces, not mathematical proof, an independent audit or actual Sepolia behavior.

### Reproducible temporary harness source

Copy the exact baseline contract/config, link accepted libs as above, and save this source as temporary `test/ReleaseInvariant.t.sol`. SHA-256 of the source below: `61b669c740b2bf6fcdb89fa209f3f180a9d5aea6647613c17e23c85143735e71`.

```solidity
// Temporary 8B verification harness; never deployed or added to repository tests.
pragma solidity ^0.8.20;
import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {DecentralizedCrowdfunding as Fund} from "../src/DecentralizedCrowdfunding.sol";
contract ForcedSurplus {
    constructor(address payable recipient) payable { selfdestruct(recipient); }
}
contract LedgerHandler is Test {
    Fund public immutable fund;
    address[3] public actors = [address(0xA11CE), address(0xB0B), address(0xCA11)];
    uint256 public deposited;
    uint256 public paid;
    uint256 public forced;
    uint256 public withdrawals;
    uint256 public refunds;
    mapping(uint256 => uint256) public gross;
    mapping(uint256 => uint256) public withdrawalCount;
    mapping(uint256 => mapping(address => uint256)) public refundCount;
    constructor(Fund target) { fund = target; }
    function create(uint256 who, uint256 goal, uint256 duration) external {
        if (fund.campaignCount() >= 8) return;
        vm.prank(actors[who % 3]);
        uint256 id = fund.createCampaign("finite model", "temporary QA", bound(goal, 1, 5 ether), bound(duration, 60, 3 days));
        assertEq(gross[id], 0);
    }
    function contribute(uint256 choice, uint256 who, uint256 value) external {
        if (fund.campaignCount() == 0) return;
        uint256 id = choice % fund.campaignCount() + 1;
        (Fund.Campaign memory c, Fund.Status s) = fund.getCampaign(id);
        if (s != Fund.Status.Active || c.amountRaised == c.goal) return;
        uint256 amount = bound(value, 1, c.goal - c.amountRaised);
        address actor = actors[who % 3];
        vm.deal(actor, amount);
        vm.prank(actor);
        fund.contribute{value: amount}(id);
        deposited += amount;
        gross[id] += amount;
    }
    function cancel(uint256 choice) external {
        if (fund.campaignCount() == 0) return;
        uint256 id = choice % fund.campaignCount() + 1;
        (Fund.Campaign memory c, Fund.Status s) = fund.getCampaign(id);
        if (s != Fund.Status.Active) return;
        vm.prank(c.creator);
        fund.cancelCampaign(id);
    }
    function withdraw(uint256 choice) external {
        if (fund.campaignCount() == 0) return;
        uint256 id = choice % fund.campaignCount() + 1;
        (Fund.Campaign memory c, Fund.Status s) = fund.getCampaign(id);
        if (s != Fund.Status.Successful || c.withdrawn) return;
        uint256 beforeBalance = c.creator.balance;
        vm.prank(c.creator);
        fund.withdrawFunds(id);
        assertEq(c.creator.balance - beforeBalance, c.amountRaised);
        paid += c.amountRaised;
        withdrawalCount[id]++;
        withdrawals++;
        assertEq(withdrawalCount[id], 1);
        vm.prank(c.creator);
        (bool duplicate,) = address(fund).call(abi.encodeCall(fund.withdrawFunds, (id)));
        assertFalse(duplicate);
    }
    function refund(uint256 choice, uint256 who) external {
        if (fund.campaignCount() == 0) return;
        uint256 id = choice % fund.campaignCount() + 1;
        (, Fund.Status s) = fund.getCampaign(id);
        if (s != Fund.Status.Failed && s != Fund.Status.Cancelled) return;
        address actor = actors[who % 3];
        uint256 amount = fund.contributions(id, actor);
        if (amount == 0) return;
        uint256 beforeBalance = actor.balance;
        vm.prank(actor);
        fund.claimRefund(id);
        assertEq(actor.balance - beforeBalance, amount);
        assertEq(fund.contributions(id, actor), 0);
        paid += amount;
        refundCount[id][actor]++;
        refunds++;
        assertEq(refundCount[id][actor], 1);
        vm.prank(actor);
        (bool duplicate,) = address(fund).call(abi.encodeCall(fund.claimRefund, (id)));
        assertFalse(duplicate);
    }
    function advance(uint256 secondsForward) external { vm.warp(block.timestamp + bound(secondsForward, 1, 1 days)); }
    function forceEther(uint256 value) external {
        uint256 amount = bound(value, 1, 1 ether);
        vm.deal(address(this), amount);
        new ForcedSurplus{value: amount}(payable(address(fund)));
        forced += amount;
    }
}
contract ReleaseInvariant is StdInvariant, Test {
    Fund fund;
    LedgerHandler handler;
    function setUp() public {
        fund = new Fund();
        handler = new LedgerHandler(fund);
        // Non-vacuous settled examples plus unsettled liability before random actions.
        handler.create(0, 1 ether, 60);
        handler.contribute(0, 1, 1 ether);
        handler.advance(60);
        handler.withdraw(0);
        handler.create(1, 1 ether, 60);
        handler.contribute(1, 2, 0.5 ether);
        handler.cancel(1);
        handler.refund(1, 2);
        handler.create(2, 1 ether, 3 days);
        handler.contribute(2, 0, 0.25 ether);
        bytes4[] memory selectors = new bytes4[](7);
        selectors[0] = handler.create.selector;
        selectors[1] = handler.contribute.selector;
        selectors[2] = handler.cancel.selector;
        selectors[3] = handler.withdraw.selector;
        selectors[4] = handler.refund.selector;
        selectors[5] = handler.advance.selector;
        selectors[6] = handler.forceEther.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
        targetContract(address(handler));
    }
    function invariant_unsettledLiabilityAndNonduplicableSettlement() public view {
        uint256 liability;
        uint256 successfulSettlements;
        uint256 refundSettlements;
        for (uint256 id = 1; id <= fund.campaignCount(); id++) {
            (Fund.Campaign memory c, Fund.Status s) = fund.getCampaign(id);
            assertEq(c.amountRaised, handler.gross(id));
            assertLe(c.amountRaised, c.goal);
            uint256 wc = handler.withdrawalCount(id);
            assertLe(wc, 1);
            successfulSettlements += wc;
            assertEq(c.withdrawn, wc == 1);
            if (c.withdrawn) {
                assertEq(uint256(s), uint256(Fund.Status.Successful));
                assertGe(block.timestamp, c.deadline);
            } else if (s == Fund.Status.Active || s == Fund.Status.Successful) {
                liability += c.amountRaised;
            }
            for (uint256 a; a < 3; a++) {
                address actor = handler.actors(a);
                uint256 rc = handler.refundCount(id, actor);
                assertLe(rc, 1);
                refundSettlements += rc;
                if (rc == 1) assertEq(fund.contributions(id, actor), 0);
                if (s == Fund.Status.Failed || s == Fund.Status.Cancelled)
                    liability += fund.contributions(id, actor);
            }
        }
        assertEq(successfulSettlements, handler.withdrawals());
        assertEq(refundSettlements, handler.refunds());
        assertGe(address(fund).balance, liability);
        assertEq(address(fund).balance - liability, handler.forced());
        assertEq(address(fund).balance + handler.paid(), handler.deposited() + handler.forced());
    }
}
```

## 5. Frontend checks and wallet boundary

Executed after the successful audit-only install, with logs redirected to `/tmp/8b-*`:

```bash
cd web
npm run typecheck
npm run build
npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium \
  PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/8b-browser.json \
  npm run test:browser -- --browser chromium --reporter line,json
```

All exit codes **0**. Unit: **57 passed / 0 failed / 0 skipped, 2 files**. Browser: **131 passed / 0 failed / 0 skipped**, one worker, no retries added. Existing suite includes the 57 responsive/accessibility cases plus wallet/read/transaction/accessible-link cases. This is mock RPC/EIP-1193 evidence, not new real MetaMask, production wallet or physical-device acceptance. It includes no public crowdfunding writes. No new local Firefox/WebKit execution is claimed here; ordinary PR CI outcomes are recorded separately below.

Build warnings remain: `node:worker_threads` externalized from ox/Tempo, and the 637.57 kB minified entry chunk exceeds the 500 kB recommendation. No assertion was disabled and no timeout/retry policy changed. Accepted screenshot tests regenerated historical tracked PNG outputs; those execution-only changes were restored to the exact baseline. Screenshots are not part of this PR.

The source review checked explicit account/chain/contract preflight, exact ABI/value payload, receipt `status === success`, one-confirmation policy, unresolved hashes, replacement mismatch, account switches, reload, targeted invalidation and financial query isolation. See the [risk report](security-release-review-8b.md#frontend-and-transaction-review) for line references. Public Vite variables and tracked configuration were inspected without reading private `.env` values. No secret values were found in those reviewed public paths; this is not an exhaustive repository-history secret scan.

## 6. Hosted release and repository controls — read-only

Fresh Vercel API reads (`get_deployment` by production alias; `get_project` by project ID) returned:

- Production alias `decentralized-crowdfunding-dapp.vercel.app` listed on deployment `dpl_CW5Pw7F9UA1kxjHqe54JfAnhy8PX`, READY/production.
- Project `prj_sVG75ZF0tWyEsMXDKcd7RTxGnJU7`; recorded Git `main`, source SHA `149d7fcb5b7e309d0417c4c1e6a69ab997f95da1`, deployment hostname `decentralized-crowdfunding-dapp-gghy9dypw.vercel.app`.
- Safe project metadata: framework `vite`, Node setting `26.x`, SSO protection metadata enabled with deploymentType `all_except_custom_domains`. This metadata is not a successful production access/HTTP header test. No private environment values were requested, exposed or changed.

No deployment/promotion/configuration tool was invoked. A feature-branch push may cause the repository's existing integrations to create their ordinary checks/previews; no production deployment is initiated by 8B. Vercel API provenance is not an independent cryptographic asset hash or fresh contract-code verification.

Public curl GET checks targeted only `/`, `/campaigns`, `/campaigns/1`, `/campaigns/2`, `/create`:

```bash
curl -sS --max-time 30 -D /tmp/8b-headers-home.txt \
  -o /dev/null -w '%{http_code}' \
  https://decentralized-crowdfunding-dapp.vercel.app/
```

All five attempts: **curl exit 56**, `CONNECT tunnel failed, response 403`, HTTP code **000**. These are environment proxy denials, not the origin website returning 403. Redirect behavior, TLS handshake/certificate and SPA deep-link status are **Blocked** locally. The following origin headers are all **Not observed**, not “missing”: Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy, Cross-Origin-Embedder-Policy, and cache headers. No absent-header vulnerability is asserted. Appropriate CSP/permissions/isolation policy needs application/wallet integration context, not a blanket header checklist.

GitHub read-only connector GETs:

- [Repository rulesets](https://api.github.com/repos/Ravin1010/decentralized-crowdfunding-dapp/rulesets): success, literal `[]` at execution. This does not establish classic branch protection.
- [Main protection](https://api.github.com/repos/Ravin1010/decentralized-crowdfunding-dapp/branches/main/protection): **403**, `Resource not accessible by integration`. Protection requirements remain unverified, not assumed disabled.

All four committed workflows declare `contents: read`. Checkout/setup/artifact/Foundry action references are mutable version tags. Most checkouts disable credential persistence; `web.yml` does not explicitly do so. Node 22 in workflows versus local 24.19.0/project setting 26.x is recorded, not changed. No action/branch/Vercel settings were mutated.

## 7. Evidence digests and reproduction boundary

SHA-256 values identify local outputs; they do not make ephemeral `/tmp` files permanent evidence URLs:

| Artifact | SHA-256 |
| --- | --- |
| Both npm audit JSON files (identical contents) | `c3c7fc6ac3d959c8c5ccde7c4a12541ab7a7af507e76d59ba1540d743f41ef65` |
| Slither JSON | `18c22f269df470ae31d69d44c760a2f7617f234bb3b5cb8d10490b651977a520` |
| Accepted 43-test log | `5e51c0a879bea55d19dd5a50f4172b550ff73ebb370623c2a748dcc6679e5426` |
| Extended fuzz log | `58706353e61aa9980b3042ec2ab7418fa754269b18d613f698a3e70ab6097228` |
| Final seeded property log | `86fb244858b356957972a6f7b37941bfec57c250d31db9f92dd0336ef1af8b41` |
| Chromium JSON | `1c14579860a7c5ee3486272a75f3e586a0e28426dcbe524cc142a06503ee6291` |

Registry advisories, raw bug-list `develop` content, hosted deployment metadata and CI runner/browser versions are time-dependent. Reproduction must retain this exact source, lockfile, compiler and submodule pins, record newly resolved scanner transitive versions and distinguish fresh results from this ledger. Temporary property source is embedded above so it can be reproduced after this workspace expires.

## 8. PR CI and final documentation validation

Ordinary CI has not yet been observed for the initial evidence commit at the point of this section's creation. Final-head run links, exact outcomes and raw-log verification will be appended after the draft PR is opened. Historical CI results are not substituted for this execution.

Pre-submission validation requires exactly the two authorized new Markdown files, valid local relative links, matching embedded harness digest, no generated source/configuration changes, `git diff --check`, raw author/committer checks and a clean working tree after commit. Every 8B commit must use author and committer `Ravin1010 <75482385+Ravin1010@users.noreply.github.com>` with no co-author trailer. Actual SHAs/identity are verified from Git and included in the PR handoff.

## 9. Next-stage actions and acceptance boundary

Independent review must consider all four Slither results and F-01–F-08, approve any separate remediation scope, obtain accessible header/control evidence, and explicitly decide remaining release gates. Do not silently “fix” findings within this evidence PR. The owner-skipped 7F manual-device/accessibility and 8A complete real-wallet scopes remain **Not tested**. Prior user-attested 6F evidence remains limited to its recorded observations; it is not upgraded to full wallet acceptance.

This review permits no new live blockchain action or deployment. Conditional experimental Sepolia assessment only; no mainnet or unrestricted real-funds release without security sign-off and explicit authorization. An absence of reported exploits in these checks is not proof of security, formal verification or a completed independent audit. Keep the PR draft/open/unmerged and stop for independent review.

## 10. Hosted CI evidence supplement — initial evidence head

Draft [PR #18](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/pull/18) was opened with head **`0f25c81fef6f685d808bfec08569334fd3e87409`**, base `149d7fcb5b7e309d0417c4c1e6a69ab997f95da1`. The following are fresh PR-triggered results, verified from job logs rather than inherited results or status icons. No workflow was edited, dispatched with altered inputs or rerun to mask a failure.

| Workflow / jobs | Actual log evidence at initial evidence head |
| --- | --- |
| [Foundry checks](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42213317187) | Format/build passed; Foundry 1.5.0 / solc 0.8.20; 43 passed, 0 failed/skipped. Job `127877055297`. |
| [Frontend build](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42213317160) | `tsc --noEmit && vite build` passed; unit 57 passed; Chromium 131 passed; 0 failed/skipped. Job `127877054794`. |
| [Automated acceptance 7D](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42213317200) | Windows Chrome 6 passed; Linux Chromium 20 passed; 0 failed/skipped. Jobs `127877054916` / `127877055136`. All six full axe scans reported `violations:[]`. |
| [Cross-browser QA](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/actions/runs/42213317240) | Firefox 57 passed, 0 failed/skipped, job `127877055347`. WebKit installation was still in progress at 2026-11-06 12:00 UTC; this is not a pass. The run link and PR #18 retain its eventual outcome. |

Hosted environment observed in logs: Ubuntu 24.04.5 LTS and Windows Server 2025 Datacenter; Node 22.23.4, npm 10.9.9, Playwright 1.64.1. Windows Google Chrome channel: **157.0.8103.39**. Linux acceptance Chromium: **156.0.8078.4**. Firefox: **157.0**. These are hosted automated browser sessions, not physical-device or owner-computer evidence.

The Linux job's six `AXE_RESULT` records cover `/`, `/campaigns`, `/campaigns/1`, `/campaigns/2`, `/create` and invalid-form `/create`. Each reported zero violations. **All six retain `color-contrast` incomplete checks; `/campaigns` also retains `aria-prohibited-attr` incomplete.** Neither incompletes nor prior historical failures are converted to passes. No full WCAG or spoken-screen-reader acceptance is inferred.

Hosted production route/read/reflow tests succeeded even though local direct curl remained proxy-blocked. They do not measure the security headers blocked in section 6, prove cryptographic asset provenance, or establish comprehensive real-wallet behavior. Their existing safety fixture rejects permission/signature/switch/send RPC methods; no public transaction was submitted.

Raw `git cat-file -p` and fuller log verified author **and** committer of `0f25c81fef6f685d808bfec08569334fd3e87409` as `Ravin1010 <75482385+Ravin1010@users.noreply.github.com>`; no co-author trailer. Later documentation-only evidence commits are verified separately and recorded in PR metadata. Final-head checks must be inspected after any such commit; results above belong to the explicitly named head.

### Local bytecode cross-check supplement

Using viem `size`/`keccak256` on the newly built artifact: creation **4,030 bytes**, `0x202c464ec9e438aef048e3759d6a2def21492b9af4c773bc973c2c14c4cd1c52`; runtime **3,997 bytes**, `0x5b1a0eabdf6cde465b6427bf7d7c2b6542fa748dbac6cd60543d80ba9ebededd`. These match the recorded 6B artifact values exactly. Artifact metadata: optimizer enabled/200, EVM target `shanghai`, no viaIR setting. This is a **fresh local artifact to historical evidence comparison**, not a fresh on-chain code retrieval or chain gas-schedule reconciliation.

This documentation-only supplement records the first evidence head without rewriting its results. Subsequent final-head CI run IDs, terminal results and any initial-run failure are recorded in [PR #18](https://github.com/Ravin1010/decentralized-crowdfunding-dapp/pull/18) after log inspection; readers must not treat the above pending WebKit observation as a completed test.
