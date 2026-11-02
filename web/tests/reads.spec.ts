import { getAddress } from "viem";
import { test, expect } from "@playwright/test";
import {
  mockRpc,
  mockWallet,
  liveUrl,
  demoUrl,
  walletCalls,
  walletEvent,
  accountA,
} from "./mocks";

const forbidden =
  /eth_send|eth_sign|personal_sign|wallet_send|wallet_switch|eth_requestAccounts|wallet_requestPermissions/;
test("demo browsing without MetaMask keeps six labeled fixtures and local form", async ({
  page,
}) => {
  await page.goto(demoUrl + "/campaigns");
  await expect(page.locator(".campaign-card")).toHaveCount(6);
  await expect(
    page.getByText(/Fictional campaigns & sample ETH/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await expect(page.getByText(/MetaMask is unavailable/)).toBeVisible();
  await page.goto(demoUrl + "/create");
  await page.getByRole("button", { name: "Review demo campaign" }).click();
  await expect(page.locator("[aria-invalid=true]")).toHaveCount(3);
});
test("public listing reads actual RPC data, refreshes without duplicates or wallet permissions", async ({
  page,
}) => {
  const rpc = await mockRpc(page);
  await mockWallet(page);
  await page.goto(liveUrl + "/campaigns");
  await expect(page.locator(".campaign-card")).toHaveCount(2);
  await expect(
    page.getByRole("heading", { name: "Verified community project 1" }),
  ).toBeVisible();
  await expect(page.getByText(/Fictional campaigns/)).toHaveCount(0);
  await page.getByRole("button", { name: "Refresh public data" }).click();
  await expect(
    page.getByRole("button", { name: "Refresh public data" }),
  ).toBeEnabled();
  await expect(page.locator(".campaign-card")).toHaveCount(2);
  await page.reload();
  await expect(page.locator(".campaign-card")).toHaveCount(2);
  expect(
    (await walletCalls(page)).filter((method) => forbidden.test(method)),
  ).toEqual([]);
  expect(
    rpc.calls.every((method) =>
      /^(eth_chainId|eth_blockNumber|eth_call|campaignCount|getCampaign)$/.test(
        method,
      ),
    ),
  ).toBe(true);
});
test("live detail displays exact wei, metadata, creator and withdrawal separately", async ({
  page,
}) => {
  await mockRpc(page, { status: 1, withdrawn: true });
  await page.goto(liveUrl + "/campaigns/1");
  await expect(page.locator("h1")).toHaveText("Verified community project 1");
  await expect(page.locator(".raised-large")).toContainText(
    "1.000000000000000001",
  );
  await expect(page.locator(".funding-panel dl")).toContainText(
    "0.999999999999999999 ETH",
  );
  await expect(page.locator(".funding-panel dl")).toContainText("Successful");
  await expect(page.locator(".funding-panel dl")).toContainText("Completed");
  await expect(page.locator(".creator strong")).toHaveText(
    getAddress(accountA),
  );
  await expect(page.getByText("What the funding makes possible")).toHaveCount(
    0,
  );
  await expect(page.locator(".funding-panel > button")).toBeDisabled();
});
test("fully funded is Active awaiting deadline and cannot overstate percentage", async ({
  page,
}) => {
  await mockRpc(page, { full: true, status: 0 });
  await page.goto(liveUrl + "/campaigns/1");
  await expect(page.locator(".outcome strong")).toHaveText("Fully funded — awaiting deadline");
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
  await expect(page.locator(".funding-panel dl")).toContainText("Active");
});
test("invalid and unallocated campaign IDs fail gracefully", async ({
  page,
}) => {
  const rpc = await mockRpc(page);
  await page.goto(liveUrl + "/campaigns/0");
  await expect(
    page.getByRole("heading", { name: "Invalid campaign ID" }),
  ).toBeVisible();
  expect(rpc.calls).toEqual([]);
  await page.goto(liveUrl + "/campaigns/999");
  await expect(page.getByRole("alert")).toContainText("Could not read");
  await expect(page.locator(".funding-panel")).toHaveCount(0);
});
test("zero campaigns is genuinely empty", async ({ page }) => {
  await mockRpc(page, { count: 0 });
  await page.goto(liveUrl + "/campaigns");
  await expect(page.getByText(/No campaigns yet/)).toBeVisible();
  await expect(page.locator(".campaign-card")).toHaveCount(0);
});
test("RPC errors never fall back to samples or zero balances", async ({
  page,
}) => {
  const rpc = await mockRpc(page);
  rpc.fail = true;
  await page.goto(liveUrl + "/campaigns");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByText(/No campaigns yet/)).toHaveCount(0);
  await expect(page.locator(".campaign-card")).toHaveCount(0);
  await expect(page.getByText(/Little Library/)).toHaveCount(0);
});
test("RPC chain mismatch is rejected before any campaign call", async ({
  page,
}) => {
  const rpc = await mockRpc(page, { rpcChain: "0x1" });
  await page.goto(liveUrl + "/campaigns");
  await expect(page.getByRole("alert")).toContainText(
    "RPC must serve Ethereum Sepolia",
  );
  await page.getByRole("button", { name: "Refresh public data" }).click();
  await expect(
    page.getByRole("button", { name: "Refresh public data" }),
  ).toBeEnabled();
  expect(rpc.calls.filter((method) => method === "eth_call")).toEqual([]);
});
test("failed refresh retains labeled stale data", async ({ page }) => {
  const rpc = await mockRpc(page);
  await page.goto(liveUrl + "/campaigns");
  await expect(page.locator(".campaign-card")).toHaveCount(2);
  rpc.fail = true;
  await page.getByRole("button", { name: "Refresh public data" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Previous data shown — stale",
  );
  await expect(page.locator(".campaign-card")).toHaveCount(2);
});
test("explicit connection, account change and disconnect isolate contribution data", async ({
  page,
}) => {
  const rpc = await mockRpc(page);
  await mockWallet(page, { delay: 300 });
  await page.goto(liveUrl + "/campaigns/1");
  await expect(page.locator("h1")).toHaveText("Verified community project 1");
  expect(
    (await walletCalls(page)).filter((method) => forbidden.test(method)),
  ).toEqual([]);
  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await expect(
    page.getByRole("button", { name: "Connecting…" }),
  ).toBeDisabled();
  await expect(page.locator(".wallet-contribution strong")).toHaveText(
    "0.25 ETH",
  );
  await walletEvent(page, "changeAccount");
  await expect(page.locator(".wallet-contribution strong")).toHaveText(
    "0.75 ETH",
  );
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(page.locator(".wallet-contribution strong")).toHaveCount(0);
  await expect(page.getByText(/Connect your wallet to read/)).toBeVisible();
  expect(rpc.calls).toContain("contributions");
  expect(
    (await walletCalls(page)).filter((method) =>
      /eth_send|eth_sign|personal_sign|wallet_send/.test(method),
    ),
  ).toEqual([]);
});
test("connection rejection is recoverable and public browsing stays open", async ({
  page,
}) => {
  await mockWallet(page, { reject: true });
  await mockRpc(page);
  await page.goto(liveUrl + "/campaigns");
  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await expect(page.getByRole("alert")).toContainText("Connection rejected");
  await expect(page.locator(".campaign-card")).toHaveCount(2);
});
test("wrong network never switches automatically; explicit switch enables wallet read", async ({
  page,
}) => {
  await mockWallet(page, { chain: "0x1" });
  await mockRpc(page);
  await page.goto(liveUrl + "/campaigns/1");
  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await expect(
    page.getByRole("button", { name: "Switch to Sepolia" }),
  ).toBeVisible();
  expect(await walletCalls(page)).not.toContain("wallet_switchEthereumChain");
  await expect(page.locator(".wallet-contribution strong")).toHaveCount(0);
  await page.getByRole("button", { name: "Switch to Sepolia" }).click();
  await expect(page.locator(".wallet-contribution strong")).toHaveText(
    "0.25 ETH",
  );
  await walletEvent(page, "changeChain", "0x1");
  await expect(page.locator(".wallet-contribution strong")).toHaveCount(0);
});
test("network switch rejection remains recoverable", async ({ page }) => {
  await mockWallet(page, { chain: "0x1", rejectSwitch: true });
  await mockRpc(page);
  await page.goto(liveUrl + "/campaigns/1");
  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await page.getByRole("button", { name: "Switch to Sepolia" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Network switch rejected",
  );
});
test("contribution RPC failure hides unconfirmed cached balance", async ({
  page,
}) => {
  const rpc = await mockRpc(page);
  await mockWallet(page);
  await page.goto(liveUrl + "/campaigns/1");
  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await expect(page.locator(".wallet-contribution strong")).toHaveText(
    "0.25 ETH",
  );
  rpc.contributionFail = true;
  await page.getByRole("button", { name: "Refresh your contribution" }).click();
  await expect(page.locator(".wallet-contribution [role=alert]")).toBeVisible();
  await expect(page.locator(".wallet-contribution strong")).toHaveCount(0);
});
test("polling and deadline expiry are read-only", async ({ page }) => {
  await page.clock.install();
  const rpc = await mockRpc(page);
  await mockWallet(page);
  await page.goto(liveUrl + "/campaigns/1");
  await expect(page.locator("h1")).toHaveText("Verified community project 1");
  const before = rpc.calls.length;
  await page.clock.fastForward(16_000);
  await expect.poll(() => rpc.calls.length).toBeGreaterThan(before);
  await expect(page.locator(".funding-panel dl")).toContainText("Active"); // Only contract response changes status.
  expect(
    (await walletCalls(page)).filter((method) => forbidden.test(method)),
  ).toEqual([]);
  expect(
    rpc.calls.every((method) =>
      /^(eth_chainId|eth_blockNumber|eth_call|getCampaign)$/.test(method),
    ),
  ).toBe(true);
});
test("external wallet disconnect hides contribution immediately", async ({
  page,
}) => {
  await mockWallet(page);
  await mockRpc(page);
  await page.goto(liveUrl + "/campaigns/1");
  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await expect(page.locator(".wallet-contribution strong")).toBeVisible();
  await walletEvent(page, "disconnect");
  await expect(page.locator(".wallet-contribution strong")).toHaveCount(0);
});
test("background tabs pause polling until visible", async ({ page }) => {
  await page.clock.install();
  const rpc = await mockRpc(page);
  await page.goto(liveUrl + "/campaigns");
  await expect(page.locator(".campaign-card")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Refresh public data" }),
  ).toBeEnabled();
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
  });
  const before = rpc.calls.length;
  await page.clock.fastForward(31_000);
  expect(rpc.calls.length).toBe(before);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
  });
  await expect.poll(() => rpc.calls.length).toBeGreaterThan(before);
});
test("paginated reads use deterministic IDs with no duplicate cards", async ({
  page,
}) => {
  await mockRpc(page, { count: 14 });
  await page.goto(liveUrl + "/campaigns");
  await expect(page.locator(".campaign-card")).toHaveCount(12);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator(".campaign-card")).toHaveCount(2);
  await expect(page.locator(".campaign-card h3").first()).toHaveText(
    "Verified community project 13",
  );
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.locator(".campaign-card")).toHaveCount(12);
});
test("responsive demo and live pages preserve layout, keyboard access, and screenshots", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mockRpc(page);
  await mockWallet(page);
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
    for (const route of ["/", "/campaigns", "/campaigns/1", "/create"]) {
      await page.goto(demoUrl + route);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `demo ${route} at ${width}px`,
      ).toBe(true);
    }
    await page.goto(demoUrl + "/");
    await page.screenshot({
      path: `../docs/iteration-4/screenshots/demo-home-${width}.png`,
      fullPage: true,
    });
    await page.goto(liveUrl + "/campaigns");
    await expect(page.locator(".campaign-card")).toHaveCount(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `live list at ${width}px`,
    ).toBe(true);
    await page.screenshot({
      path: `../docs/iteration-4/screenshots/live-list-disconnected-${width}.png`,
      fullPage: true,
    });
    await page.goto(liveUrl + "/campaigns/1");
    await page.getByRole("button", { name: "Connect Wallet" }).click();
    await expect(page.locator(".wallet-contribution strong")).toHaveText(
      "0.25 ETH",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `live connected detail at ${width}px`,
    ).toBe(true);
    await page.screenshot({
      path: `../docs/iteration-4/screenshots/live-detail-connected-${width}.png`,
      fullPage: true,
    });
    await walletEvent(page, "changeChain", "0x1");
    await expect(
      page.getByRole("button", { name: "Switch to Sepolia" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `wrong network at ${width}px`,
    ).toBe(true);
    await page.screenshot({
      path: `../docs/iteration-4/screenshots/wrong-network-${width}.png`,
      fullPage: true,
    });
  }
  await page.goto(demoUrl + "/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".button")
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration),
  ).toBe("0s");
  expect(errors).toEqual([]);
});
test("capture genuine empty and error UI evidence using mocked RPC", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const rpc = await mockRpc(page, { count: 0 });
  await page.goto(liveUrl + "/campaigns");
  await expect(page.getByText(/No campaigns yet/)).toBeVisible();
  await page.screenshot({
    path: "../docs/iteration-4/screenshots/live-empty.png",
    fullPage: true,
  });
  rpc.fail = true;
  await page.reload();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.screenshot({
    path: "../docs/iteration-4/screenshots/live-error.png",
    fullPage: true,
  });
});
test("late responses from the previous account cannot overwrite the current wallet", async ({
  page,
}) => {
  const rpc = await mockRpc(page);
  rpc.delayWalletA = 1000;
  await mockWallet(page);
  await page.goto(liveUrl + "/campaigns/1");
  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await expect.poll(() => rpc.pendingWalletA).toBe(true);
  await walletEvent(page, "changeAccount");
  await expect(page.locator(".wallet-contribution strong")).toHaveText(
    "0.75 ETH",
  );
  await page.waitForTimeout(1100); // Intentionally await the old delayed RPC response.
  await expect(page.locator(".wallet-contribution strong")).toHaveText(
    "0.75 ETH",
  );
});
