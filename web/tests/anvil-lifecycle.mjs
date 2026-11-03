// Real accepted contract + real public RPC receipts. Wallet authorization is simulated.
import { spawn } from "node:child_process";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  multicall3Abi,
  keccak256,
} from "viem";
import { sepolia } from "viem/chains";
import { crowdfundingAbi as abi } from "../src/blockchain/abi.ts";

// Test fixture bytecode from the already pinned viem package; not app code.
const { multicall3Bytecode } = await import(
  new URL("./constants/contracts.js", import.meta.resolve("viem"))
);
const rpcUrl = "http://127.0.0.1:18546";
const baseUrl = "http://127.0.0.1:5175";
const artifact = JSON.parse(
  await readFile(
    "../contracts/out/DecentralizedCrowdfunding.sol/DecentralizedCrowdfunding.json",
    "utf8",
  ),
);
assert.deepEqual(abi, artifact.abi);
const anvil = spawn(
  process.env.ANVIL_BIN || "anvil",
  [
    "--host",
    "127.0.0.1",
    "--port",
    "18546",
    "--chain-id",
    "11155111",
    "--silent",
  ],
  { stdio: "ignore" },
);
let startError;
anvil.on("error", (error) => {
  startError = error;
});
let vite, browser;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const client = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
const wallet = createWalletClient({ chain: sepolia, transport: http(rpcUrl) });
const results = [];
try {
  for (let i = 0; i < 60; i++) {
    if (startError) throw startError;
    try {
      if ((await client.getChainId()) === 11155111) break;
    } catch {}
    await pause(100);
  }
  const [account, contributor, secondContributor] = await wallet.getAddresses();
  // Sepolia's existing public read path batches through canonical Multicall3.
  // Install viem's canonical fixture only on this isolated local Anvil chain.
  const multicallHash = await wallet.deployContract({
    account,
    abi: multicall3Abi,
    bytecode: multicall3Bytecode,
  });
  const multicallReceipt = await client.waitForTransactionReceipt({
    hash: multicallHash,
  });
  const multicallCode = await client.getBytecode({
    address: multicallReceipt.contractAddress,
  });
  await client.request({
    method: "anvil_setCode",
    params: [sepolia.contracts.multicall3.address, multicallCode],
  });
  const deployHash = await wallet.deployContract({
    account,
    abi: artifact.abi,
    bytecode: artifact.bytecode.object,
  });
  const deployed = await client.waitForTransactionReceipt({ hash: deployHash });
  assert.equal(deployed.status, "success");
  const address = deployed.contractAddress;
  assert.ok(address);
  const runtimeCode = await client.getBytecode({ address });
  assert.equal(runtimeCode, artifact.deployedBytecode.object);

  vite = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "--host",
      "127.0.0.1",
      "--port",
      "5175",
      "--strictPort",
    ],
    {
      stdio: "ignore",
      env: {
        ...process.env,
        VITE_CROWDFUND_CONTRACT_ADDRESS: address,
        VITE_SEPOLIA_RPC_URL: rpcUrl,
      },
    },
  );
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(baseUrl)).ok) break;
    } catch {}
    await pause(100);
  }
  browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  let authorized = false;
  const calls = [];
  await context.exposeBinding(
    "anvilWalletRequest",
    async (_source, { method, params }) => {
      calls.push(method);
      if (method === "eth_accounts") return authorized ? [account] : [];
      if (method === "wallet_requestPermissions") {
        authorized = true;
        return [
          {
            parentCapability: "eth_accounts",
            caveats: [{ type: "restrictReturnedAccounts", value: [account] }],
          },
        ];
      }
      if (method === "eth_requestAccounts") {
        authorized = true;
        return [account];
      }
      if (method === "wallet_revokePermissions") {
        authorized = false;
        return null;
      }
      if (!["eth_chainId", "eth_sendTransaction"].includes(method))
        throw new Error(`Unexpected wallet method ${method}`);
      return client.request({ method, params });
    },
  );
  await context.addInitScript(() => {
    const listeners = new Map();
    window.ethereum = {
      isMetaMask: true,
      request: (request) => window.anvilWalletRequest(request),
      on: (event, handler) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event).add(handler);
      },
      removeListener: (event, handler) => listeners.get(event)?.delete(handler),
    };
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseUrl + "/create");
  assert.equal(
    calls.filter((method) =>
      /requestAccounts|requestPermissions|sendTransaction/.test(method),
    ).length,
    0,
  );
  await page
    .getByRole("button", { name: "Connect Wallet", exact: true })
    .click();
  await page.getByRole("button", { name: "Disconnect", exact: true }).waitFor();
  async function create(title, goal) {
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Start a campaign" })
      .click();
    await page.getByLabel("Campaign title", { exact: false }).fill(title);
    await page
      .getByLabel("Your story", { exact: false })
      .fill("Real contract lifecycle on temporary local Anvil.");
    await page.getByLabel("Funding goal (ETH)", { exact: false }).fill(goal);
    await page
      .getByLabel("Campaign duration (days)", { exact: false })
      .fill("1");
    await page
      .getByRole("button", { name: "Disconnect", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Create Campaign", exact: true })
      .click();
    try {
      await page.getByRole("link", { name: /View created campaign/ }).click();
    } catch {
      throw new Error(
        "Local create feedback: " +
          (await page.locator(".transaction-feedback").innerText()),
      );
    }
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
    assert.equal(await page.locator("h1").innerText(), title);
  }
  async function contribute(value) {
    await page.getByLabel("Contribution amount (ETH)").fill(value);
    await page
      .getByRole("button", { name: "Contribute ETH", exact: true })
      .click();
    await page
      .getByText("Transaction confirmed and latest data loaded.", {
        exact: true,
      })
      .waitFor();
  }
  await create("Local Anvil success lifecycle", "0.01");
  await contribute("0.01");
  assert.equal(
    (
      await client.readContract({
        address,
        abi,
        functionName: "getCampaign",
        args: [1n],
      })
    )[0].amountRaised,
    parseEther("0.01"),
  );
  await client.request({ method: "evm_increaseTime", params: [86401] });
  await client.request({ method: "evm_mine", params: [] });
  await page.getByRole("button", { name: "Refresh public data" }).click();
  await page.getByRole("button", { name: "Choose another action" }).click();
  await page
    .getByRole("button", { name: "Withdraw Funds", exact: true })
    .click();
  await page.getByText("Successfully withdrawn", { exact: true }).waitFor();
  let [campaign, status] = await client.readContract({
    address,
    abi,
    functionName: "getCampaign",
    args: [1n],
  });
  assert.equal(campaign.withdrawn, true);
  assert.equal(campaign.amountRaised, parseEther("0.01"));
  assert.equal(status, 1);
  results.push(
    "UI create → contribute exact goal → advance local time → successful creator withdrawal; historical raised preserved",
  );
  await mkdir("../docs/iteration-5/screenshots", { recursive: true });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: "../docs/iteration-5/screenshots/anvil-withdrawn-desktop.png",
    fullPage: true,
  });
  await create("Local Anvil cancellation and refund", "0.02");
  await contribute("0.005");
  await page.getByRole("button", { name: "Choose another action" }).click();
  await page
    .getByRole("button", { name: "Cancel Campaign", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm cancellation", exact: true })
    .click();
  await page
    .getByText("Transaction confirmed and latest data loaded.", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Choose another action" }).click();
  await page.getByRole("button", { name: "Claim Refund", exact: true }).click();
  await page
    .getByText(
      "Refund confirmed. Eligibility comes from your refreshed contribution record.",
    )
    .waitFor();
  [campaign, status] = await client.readContract({
    address,
    abi,
    functionName: "getCampaign",
    args: [2n],
  });
  assert.equal(status, 3);
  assert.equal(campaign.amountRaised, parseEther("0.005"));
  assert.equal(
    await client.readContract({
      address,
      abi,
      functionName: "contributions",
      args: [2n, account],
    }),
    0n,
  );
  assert.equal(
    await page.locator(".wallet-contribution strong").innerText(),
    "0 ETH",
  );
  assert.equal(await client.getBalance({ address }), 0n);
  assert.equal(
    await client.readContract({ address, abi, functionName: "campaignCount" }),
    2n,
  );
  assert.equal(
    calls.filter((method) => method === "eth_sendTransaction").length,
    7,
  );
  assert.equal(
    calls.filter((method) =>
      /wallet_switch|personal_sign|eth_sign/.test(method),
    ).length,
    0,
  );
  assert.equal(
    calls.filter((method) =>
      /eth_requestAccounts|wallet_requestPermissions/.test(method),
    ).length,
    1,
  );
  assert.deepEqual(errors, []);
  results.push(
    "UI create → partial contribution → explicit cancellation → individual refund; authoritative wallet contribution zero, historical raised preserved",
  );
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: "../docs/iteration-5/screenshots/anvil-refunded-mobile.png",
    fullPage: true,
  });
  // Focused multi-wallet RPC lifecycle supplements the two complete UI flows.
  // All signers are temporary unlocked Anvil accounts, never public wallets.
  async function localWrite(sender, functionName, args, value) {
    const hash = await wallet.writeContract({
      account: sender, address, abi, functionName, args,
      ...(value ? { value } : {}),
    });
    const receipt = await client.waitForTransactionReceipt({ hash });
    assert.equal(receipt.status, "success");
  }
  await assert.rejects(
    client.simulateContract({
      account: contributor, address, abi,
      functionName: "withdrawFunds", args: [1n],
    }),
    /NotCreator/,
  );
  await localWrite(account, "createCampaign", [
    "Multi-wallet failed campaign", "Local verification only", parseEther("1"), 60n,
  ]);
  await localWrite(contributor, "contribute", [3n], parseEther("0.002"));
  await localWrite(secondContributor, "contribute", [3n], parseEther("0.003"));
  await client.request({ method: "evm_increaseTime", params: [61] });
  await client.request({ method: "evm_mine", params: [] });
  await assert.rejects(
    client.simulateContract({
      account, address, abi, functionName: "claimRefund", args: [3n],
    }),
    /NoContribution/,
  );
  const contributionOf = (walletAddress) => client.readContract({
    address, abi, functionName: "contributions", args: [3n, walletAddress],
  });
  assert.equal(await contributionOf(contributor), parseEther("0.002"));
  await localWrite(contributor, "claimRefund", [3n]);
  assert.equal(await contributionOf(contributor), 0n);
  assert.equal(await contributionOf(secondContributor), parseEther("0.003"));
  await localWrite(secondContributor, "claimRefund", [3n]);
  [campaign, status] = await client.readContract({
    address, abi, functionName: "getCampaign", args: [3n],
  });
  assert.equal(status, 2);
  assert.equal(campaign.amountRaised, parseEther("0.005"));
  assert.equal(await contributionOf(secondContributor), 0n);
  assert.equal(await client.getBalance({ address }), 0n);
  results.push(
    "Multi-wallet failed campaign: distinct creator/two contributors; unauthorized withdrawal and creator refund simulations rejected; independent refunds preserve other wallet balance and historical raised",
  );
  const report = {
    network: "temporary localhost Anvil, chain ID 11155111",
    publicChainDeployment: false,
    deploymentReceipt: deployed.status,
    lifecycleScenariosPassed: 3,
    uiLifecycles: 2,
    multiWalletRpcLifecycles: 1,
    abiMatches: true,
    runtimeBytecodeMatches: true,
    creationBytecodeBytes: (artifact.bytecode.object.length - 2) / 2,
    runtimeBytecodeBytes: (runtimeCode.length - 2) / 2,
    creationBytecodeKeccak256: keccak256(artifact.bytecode.object),
    runtimeBytecodeKeccak256: keccak256(runtimeCode),
    contractWriteTransactions: 12,
    uiWriteTransactions: 7,
    supplementalRpcWriteTransactions: 5,
    rejectedAuthorizationSimulations: 2,
    results,
    pageErrors: errors,
  };
  await mkdir("../docs/iteration-6", { recursive: true });
  await writeFile(
    "../docs/iteration-6/anvil-results.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  vite?.kill("SIGTERM");
  anvil.kill("SIGTERM");
}
