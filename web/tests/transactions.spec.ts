import { test, expect } from "@playwright/test";
import { decodeFunctionData, parseEther } from "viem";
import { crowdfundingAbi } from "../src/blockchain/abi";
import { liveUrl, accountB, walletEvent, walletCalls } from "./mocks";
import { transactionFixture } from "./transaction-mocks";

async function connect(page: import("@playwright/test").Page) {
  await page
    .getByRole("button", { name: "Connect Wallet", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Disconnect", exact: true }),
  ).toBeVisible();
}
async function fillCreate(page: import("@playwright/test").Page) {
  await page
    .getByLabel("Campaign title", { exact: false })
    .fill("A confirmed community room");
  await page
    .getByLabel("Your story", { exact: false })
    .fill("A real on-chain description.");
  await page
    .getByLabel("Funding goal (ETH)", { exact: false })
    .fill("2.000000000000000001");
  await page
    .getByLabel("Campaign duration (days)", { exact: false })
    .fill("14");
}

test("exact final contribution stays unchanged until confirmation, then refetches once", async ({
  page,
}) => {
  const { state, mine } = await transactionFixture(page);
  state.signatureDelay = 600;
  await page.goto(liveUrl + "/campaigns/1");
  await connect(page);
  await page.getByLabel("Contribution amount (ETH)").fill("1");
  await page
    .getByRole("button", { name: "Contribute ETH", exact: true })
    .dblclick();
  await expect(
    page.getByText("Confirm this transaction in MetaMask.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Transaction submitted. Waiting for confirmation.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(state.submitted).toHaveLength(1);
  expect(BigInt(state.submitted[0].value!)).toBe(parseEther("1"));
  await expect(page.locator(".raised-large")).toContainText("1 ETH");
  mine();
  await expect(
    page.getByText("Transaction confirmed and latest data loaded.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".raised-large")).toContainText("2 ETH");
  await expect(page.locator(".wallet-contribution strong")).toHaveText(
    "1.25 ETH",
  );
  await expect(page.locator(".outcome strong")).toHaveText(
    "Fully funded — awaiting deadline",
  );
  expect(state.submitted).toHaveLength(1);
});
test("creation derives ID from the configured contract event and displays one authoritative card", async ({
  page,
}) => {
  const { state, mine } = await transactionFixture(page);
  await page.goto(liveUrl + "/create");
  await fillCreate(page);
  await connect(page);
  await page
    .getByRole("button", { name: "Create Campaign", exact: true })
    .click();
  await expect(
    page.getByText("Transaction submitted. Waiting for confirmation.", {
      exact: true,
    }),
  ).toBeVisible();
  const call = decodeFunctionData({
    abi: crowdfundingAbi,
    data: state.submitted[0].data,
  });
  expect(call.functionName).toBe("createCampaign");
  if (call.functionName === "createCampaign") {
    expect(call.args[2]).toBe(parseEther("2.000000000000000001"));
    expect(call.args[3]).toBe(14n * 86400n);
  }
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: `../docs/iteration-5/screenshots/simulated-create-pending-${width}.png`,
      fullPage: true,
    });
  }
  mine();
  await page
    .getByRole("link", { name: "View created campaign #2", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("A confirmed community room");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Explore campaigns" })
    .click();
  await expect(page.locator(".campaign-card")).toHaveCount(2);
  await expect(
    page
      .locator(".campaign-card h3")
      .filter({ hasText: "A confirmed community room" }),
  ).toHaveCount(1);
});

test("invalid create inputs never open a wallet transaction", async ({
  page,
}) => {
  const { state } = await transactionFixture(page);
  await page.goto(liveUrl + "/create");
  await page
    .getByRole("button", { name: "Create Campaign", exact: true })
    .click();
  await expect(page.locator("[aria-invalid=true]")).toHaveCount(3);
  await fillCreate(page);
  await page
    .getByLabel("Funding goal (ETH)", { exact: false })
    .fill("0.0000000000000000001");
  await page
    .getByLabel("Campaign duration (days)", { exact: false })
    .fill("31");
  await page
    .getByRole("button", { name: "Create Campaign", exact: true })
    .click();
  await expect(page.locator("#goal")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#duration")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(state.submitted).toHaveLength(0);
  expect(
    (await walletCalls(page)).filter((method) =>
      /eth_requestAccounts|wallet_requestPermissions|eth_sendTransaction/.test(
        method,
      ),
    ),
  ).toEqual([]);
});
test("disconnected create requires connection then a separate explicit submit", async ({
  page,
}) => {
  const { state } = await transactionFixture(page);
  await page.goto(liveUrl + "/create");
  await fillCreate(page);
  await page
    .getByRole("button", { name: "Create Campaign", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Connect your wallet");
  await connect(page);
  expect(state.submitted).toHaveLength(0);
  await page
    .getByRole("button", { name: "Create Campaign", exact: true })
    .click();
  await expect(
    page.getByText("Transaction submitted. Waiting for confirmation.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(state.submitted).toHaveLength(1);
});
for (const eventMode of ["missing", "foreign"] as const) {
  test(`successful create with ${eventMode} event never guesses its ID`, async ({
    page,
  }) => {
    const { state, mine } = await transactionFixture(page);
    state.eventMode = eventMode;
    await page.goto(liveUrl + "/create");
    await fillCreate(page);
    await connect(page);
    await page
      .getByRole("button", { name: "Create Campaign", exact: true })
      .click();
    await expect(
      page.getByText("Transaction submitted. Waiting for confirmation.", {
        exact: true,
      }),
    ).toBeVisible();
    mine();
    await expect(
      page.getByText("Transaction confirmed and latest data loaded.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText(/No ID has been guessed/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /View created campaign/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Create Campaign", exact: true }),
    ).toBeDisabled();
  });
}
test("invalid contribution amounts and newly filled goals do not open MetaMask", async ({
  page,
}) => {
  const { state } = await transactionFixture(page);
  await page.goto(liveUrl + "/campaigns/1");
  await connect(page);
  for (const value of ["0", "1.1", "0.0000000000000000001"]) {
    await page.getByLabel("Contribution amount (ETH)").fill(value);
    await page
      .getByRole("button", { name: "Contribute ETH", exact: true })
      .click();
    await expect(page.locator(".campaign-actions [role=alert]")).toBeVisible();
  }
  await page.getByLabel("Contribution amount (ETH)").fill("0.5");
  state.raised = state.goal;
  await page
    .getByRole("button", { name: "Contribute ETH", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("latest remaining goal");
  expect(state.submitted).toHaveLength(0);
});
test("deadline preflight rejects stale Active state before wallet submission", async ({
  page,
}) => {
  const { state } = await transactionFixture(page, { expired: true });
  await page.goto(liveUrl + "/campaigns/1");
  await connect(page);
  await page.getByLabel("Contribution amount (ETH)").fill("0.5");
  await page
    .getByRole("button", { name: "Contribute ETH", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("before its deadline");
  await page
    .getByRole("button", { name: "Cancel Campaign", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm cancellation", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("before its deadline");
  expect(state.submitted).toHaveLength(0);
});
for (const kind of ["create", "contribute"] as const) {
  test(`rejected ${kind} signature does not change funds or retry`, async ({
    page,
  }) => {
    const { state } = await transactionFixture(page);
    state.reject = true;
    await page.goto(liveUrl + (kind === "create" ? "/create" : "/campaigns/1"));
    await connect(page);
    if (kind === "create") await fillCreate(page);
    else await page.getByLabel("Contribution amount (ETH)").fill("0.5");
    await page
      .getByRole("button", {
        name: kind === "create" ? "Create Campaign" : "Contribute ETH",
        exact: true,
      })
      .click();
    await expect(
      page.getByText(/Transaction request cancelled in your wallet/),
    ).toBeVisible();
    expect(state.raised).toBe(parseEther("1"));
    expect(state.submitted).toHaveLength(1);
  });
}
for (const failure of ["insufficient", "customRevert"] as const) {
  test(`wallet ${failure} is explained without financial success`, async ({
    page,
  }) => {
    const { state } = await transactionFixture(page);
    state[failure] = true;
    await page.goto(liveUrl + "/campaigns/1");
    await connect(page);
    await page.getByLabel("Contribution amount (ETH)").fill("0.5");
    await page
      .getByRole("button", { name: "Contribute ETH", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText(
      failure === "insufficient" ? "network gas" : "latest remaining goal",
    );
    await expect(page.locator(".raised-large")).toContainText("1 ETH");
    expect(state.submitted).toHaveLength(1);
  });
}
test("reverted receipt is distinct from successful confirmation", async ({
  page,
}) => {
  const { state, mine } = await transactionFixture(page);
  state.reverted = true;
  await page.goto(liveUrl + "/campaigns/1");
  await connect(page);
  await page.getByLabel("Contribution amount (ETH)").fill("0.5");
  await page
    .getByRole("button", { name: "Contribute ETH", exact: true })
    .click();
  await expect(
    page.getByText("Transaction submitted. Waiting for confirmation.", {
      exact: true,
    }),
  ).toBeVisible();
  mine();
  await expect(page.getByRole("alert")).toContainText(
    "receipt reports a revert",
  );
  await expect(page.locator(".raised-large")).toContainText("1 ETH");
});
for (const action of ["create", "contribute"] as const) {
  test(`confirmed ${action} refresh failure has read-only retry without resubmission`, async ({
    page,
  }) => {
    const { state, mine } = await transactionFixture(page);
    await page.goto(
      liveUrl + (action === "create" ? "/create" : "/campaigns/1"),
    );
    await connect(page);
    if (action === "create") await fillCreate(page);
    else await page.getByLabel("Contribution amount (ETH)").fill("0.5");
    await page
      .getByRole("button", {
        name: action === "create" ? "Create Campaign" : "Contribute ETH",
        exact: true,
      })
      .click();
    await expect(
      page.getByText("Transaction submitted. Waiting for confirmation.", {
        exact: true,
      }),
    ).toBeVisible();
    state.refreshFails = true;
    mine();
    await expect(
      page.getByText(
        "Transaction confirmed, but the latest campaign data could not be loaded.",
        { exact: true },
      ),
    ).toBeVisible();
    expect(state.submitted).toHaveLength(1);
    if (action === "contribute") {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.evaluate(() =>
        window.scrollTo({ top: 0, behavior: "instant" }),
      );
      await page.screenshot({
        path: "../docs/iteration-5/screenshots/simulated-confirmed-refresh-error-mobile.png",
        fullPage: true,
      });
    }
    state.refreshFails = false;
    await page
      .getByRole("button", { name: "Retry data refresh", exact: true })
      .click();
    await expect(
      page.getByText("Transaction confirmed and latest data loaded.", {
        exact: true,
      }),
    ).toBeVisible();
    expect(state.submitted).toHaveLength(1);
  });
}
test("creator withdraws once and preserves historical raised funds", async ({
  page,
}) => {
  const { state, mine } = await transactionFixture(page, {
    status: 1,
    full: true,
  });
  await page.goto(liveUrl + "/campaigns/1");
  await connect(page);
  await page
    .getByRole("button", { name: "Withdraw Funds", exact: true })
    .dblclick();
  await expect(
    page.getByText("Transaction submitted. Waiting for confirmation.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(state.withdrawn).toBe(false);
  mine();
  await expect(
    page.getByText("Successfully withdrawn", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Withdraw Funds", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".raised-large")).toContainText("2 ETH");
  expect(state.submitted).toHaveLength(1);
});
for (const scenario of [
  { status: 0 },
  { status: 2 },
  { status: 3 },
  { status: 1, creator: accountB },
  { status: 1, withdrawn: true },
]) {
  test(`withdraw restriction ${JSON.stringify(scenario)}`, async ({ page }) => {
    const { state } = await transactionFixture(page, scenario);
    await page.goto(liveUrl + "/campaigns/1");
    await connect(page);
    await expect(
      page.getByRole("button", { name: "Withdraw Funds", exact: true }),
    ).toHaveCount(0);
    expect(state.submitted).toHaveLength(0);
  });
}
for (const status of [2, 3]) {
  test(`status ${status} contributor refund confirms zero without erasing history`, async ({
    page,
  }) => {
    const { state, mine } = await transactionFixture(page, { status });
    await page.goto(liveUrl + "/campaigns/1");
    await connect(page);
    await page
      .getByRole("button", { name: "Claim Refund", exact: true })
      .dblclick();
    await expect(
      page.getByText("Transaction submitted. Waiting for confirmation.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator(".wallet-contribution strong")).toHaveText(
      "0.25 ETH",
    );
    mine();
    await expect(page.locator(".wallet-contribution strong")).toHaveText(
      "0 ETH",
    );
    await expect(
      page.getByRole("button", { name: "Claim Refund", exact: true }),
    ).toHaveCount(0);
    await expect(page.locator(".raised-large")).toContainText("1 ETH");
    expect(state.submitted).toHaveLength(1);
  });
}
for (const scenario of [
  { status: 2, contribution: 0n },
  { status: 1, contribution: parseEther("0.25") },
]) {
  test(`refund restriction status ${scenario.status} contribution ${scenario.contribution}`, async ({
    page,
  }) => {
    const { state } = await transactionFixture(page, scenario);
    await page.goto(liveUrl + "/campaigns/1");
    await connect(page);
    await expect(
      page.getByRole("button", { name: "Claim Refund", exact: true }),
    ).toHaveCount(0);
    expect(state.submitted).toHaveLength(0);
  });
}
for (const full of [false, true]) {
  test(`creator cancellation requires explicit confirmation (fully funded: ${full})`, async ({
    page,
  }) => {
    const { state, mine } = await transactionFixture(page, { full });
    await page.goto(liveUrl + "/campaigns/1");
    await connect(page);
    await page
      .getByRole("button", { name: "Cancel Campaign", exact: true })
      .click();
    expect(state.submitted).toHaveLength(0);
    await expect(
      page.getByText(/Contributors must claim their own refunds/),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Confirm cancellation", exact: true })
      .click();
    await expect(
      page.getByText("Transaction submitted. Waiting for confirmation.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator(".funding-panel dl")).toContainText("Active");
    mine();
    await expect(page.locator(".funding-panel dl")).toContainText("Cancelled");
    await expect(
      page.getByRole("button", { name: "Claim Refund", exact: true }),
    ).toBeVisible();
    expect(state.contributionA).toBe(parseEther("0.25"));
  });
}
test("non-creator cannot cancel", async ({ page }) => {
  await transactionFixture(page, { creator: accountB });
  await page.goto(liveUrl + "/campaigns/1");
  await connect(page);
  await expect(
    page.getByRole("button", { name: "Cancel Campaign", exact: true }),
  ).toHaveCount(0);
});
for (const change of ["changeAccount", "changeChain", "disconnect"] as const) {
  test(`${change} during confirmation preserves original submission identity`, async ({
    page,
  }) => {
    const { state, mine } = await transactionFixture(page);
    await page.goto(liveUrl + "/campaigns/1");
    await connect(page);
    await page.getByLabel("Contribution amount (ETH)").fill("0.5");
    await page
      .getByRole("button", { name: "Contribute ETH", exact: true })
      .click();
    await expect(
      page.getByText("Transaction submitted. Waiting for confirmation.", {
        exact: true,
      }),
    ).toBeVisible();
    await walletEvent(page, change, change === "changeChain" ? "0x1" : "");
    await expect(page.locator(".transaction-feedback")).toContainText(
      "0xaAaA…aaAa",
    );
    if (change === "changeAccount")
      await expect(page.locator(".wallet-contribution strong")).toHaveText(
        "0.75 ETH",
      );
    else
      await expect(page.locator(".wallet-contribution strong")).toHaveCount(0);
    mine();
    await expect(
      page.getByText("Transaction confirmed and latest data loaded.", {
        exact: true,
      }),
    ).toBeVisible();
    expect(state.submitted).toHaveLength(1);
    if (change === "changeAccount")
      await expect(page.locator(".wallet-contribution strong")).toHaveText(
        "0.75 ETH",
      );
  });
}
test("wrong network requires explicit switching and never resumes a queued write", async ({
  page,
}) => {
  const { state } = await transactionFixture(page, { chain: "0x1" });
  await page.goto(liveUrl + "/campaigns/1");
  await connect(page);
  await expect(
    page.getByRole("button", { name: "Contribute ETH", exact: true }),
  ).toBeDisabled();
  expect(await walletCalls(page)).not.toContain("wallet_switchEthereumChain");
  await page
    .getByRole("button", { name: "Switch to Sepolia", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Contribute ETH", exact: true }),
  ).toBeEnabled();
  expect(state.submitted).toHaveLength(0);
});
test("temporarily unobservable receipt remains pending and checking never resubmits", async ({
  page,
}) => {
  await page.clock.install();
  const { state, mine } = await transactionFixture(page);
  state.receiptUnavailable = true;
  await page.goto(liveUrl + "/campaigns/1");
  await connect(page);
  await page.getByLabel("Contribution amount (ETH)").fill("0.5");
  await page
    .getByRole("button", { name: "Contribute ETH", exact: true })
    .click();
  await expect(
    page.getByText("Transaction submitted. Waiting for confirmation.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect.poll(() => state.receiptReads).toBeGreaterThan(0);
  await page.clock.fastForward(31_000);
  await expect(
    page.getByText(/Confirmation is not yet available/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Contribute ETH", exact: true }),
  ).toBeDisabled();
  state.receiptUnavailable = false;
  mine();
  await page
    .getByRole("button", { name: "Check confirmation", exact: true })
    .click();
  await expect(
    page.getByText("Transaction confirmed and latest data loaded.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(state.submitted).toHaveLength(1);
});
test("simulated transaction controls and feedback fit desktop tablet and mobile", async ({
  page,
}) => {
  const { state, mine } = await transactionFixture(page);
  await page.goto(liveUrl + "/campaigns/1");
  await connect(page);
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
    await page.getByLabel("Contribution amount (ETH)").fill("0.1");
    await page
      .getByRole("button", { name: "Contribute ETH", exact: true })
      .click();
    await expect(
      page.getByText("Transaction submitted. Waiting for confirmation.", {
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: `../docs/iteration-5/screenshots/simulated-pending-${width}.png`,
      fullPage: true,
    });
    mine();
    await expect(
      page.getByText("Transaction confirmed and latest data loaded.", {
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: `../docs/iteration-5/screenshots/simulated-confirmed-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Choose another action", exact: true })
      .click();
  }
  expect(state.submitted).toHaveLength(3);
});
test("unreadable configured deployment blocks creation before a wallet write", async ({
  page,
}) => {
  const { state } = await transactionFixture(page);
  state.contractUnavailable = true;
  await page.goto(liveUrl + "/create");
  await fillCreate(page);
  await connect(page);
  await page
    .getByRole("button", { name: "Create Campaign", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  expect(state.submitted).toHaveLength(0);
});

test("create another resets only after confirmation and refresh and requires a fresh submit", async ({
  page,
}) => {
  const { state, mine } = await transactionFixture(page);
  await page.goto(liveUrl + "/create");
  await page
    .getByRole("button", { name: "Create Campaign", exact: true })
    .click();
  await expect(page.locator("[aria-invalid=true]")).toHaveCount(3);
  await fillCreate(page);
  await page.locator("#duration").fill("7");
  await connect(page);
  await page
    .getByRole("button", { name: "Create Campaign", exact: true })
    .dblclick();
  await expect(
    page.getByText("Transaction submitted. Waiting for confirmation.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create another campaign", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Create Campaign", exact: true }),
  ).toBeDisabled();
  expect(state.submitted).toHaveLength(1);
  state.refreshDelay = 800;
  mine();
  await expect(
    page.getByText("Transaction confirmed. Loading the latest data…", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create another campaign", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "View created campaign #2", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#title")).toHaveValue(
    "A confirmed community room",
  );
  await page
    .getByRole("button", { name: "Create another campaign", exact: true })
    .click();
  await expect(page.locator("#title")).toHaveValue("");
  await expect(page.locator("#description")).toHaveValue("");
  await expect(page.locator("#goal")).toHaveValue("");
  await expect(page.locator("#duration")).toHaveValue("14");
  await expect(page.locator("#title")).toBeFocused();
  await expect(page.locator("[aria-invalid=true]")).toHaveCount(0);
  await expect(page.locator(".field-error")).toHaveCount(0);
  await expect(page.locator(".transaction-feedback")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /View created campaign/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Create Campaign", exact: true }),
  ).toBeEnabled();
  expect(state.submitted).toHaveLength(1);
  await fillCreate(page);
  await page.locator("#title").fill("A separately submitted second campaign");
  expect(state.submitted).toHaveLength(1);
  await page
    .getByRole("button", { name: "Create Campaign", exact: true })
    .dblclick();
  await expect(
    page.getByText("Transaction submitted. Waiting for confirmation.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(state.submitted).toHaveLength(2);
});

test("create another stays unavailable when a confirmed creation refresh fails", async ({
  page,
}) => {
  const { state, mine } = await transactionFixture(page);
  await page.goto(liveUrl + "/create");
  await fillCreate(page);
  await connect(page);
  await page
    .getByRole("button", { name: "Create Campaign", exact: true })
    .click();
  await expect(
    page.getByText("Transaction submitted. Waiting for confirmation.", {
      exact: true,
    }),
  ).toBeVisible();
  state.refreshFails = true;
  mine();
  await expect(
    page.getByText(
      "Transaction confirmed, but the latest campaign data could not be loaded.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create another campaign", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Create Campaign", exact: true }),
  ).toBeDisabled();
  expect(state.submitted).toHaveLength(1);
  state.refreshFails = false;
  await page
    .getByRole("button", { name: "Retry data refresh", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Create another campaign", exact: true }),
  ).toBeVisible();
  expect(state.submitted).toHaveLength(1);
});

test("refund confirmation distinguishes refresh progress failure and verified success", async ({
  page,
}) => {
  const { state, mine } = await transactionFixture(page, { status: 2 });
  await page.goto(liveUrl + "/campaigns/1");
  await connect(page);
  await page.getByRole("button", { name: "Claim Refund", exact: true }).click();
  await expect(
    page.getByText("Transaction submitted. Waiting for confirmation.", {
      exact: true,
    }),
  ).toBeVisible();
  state.refreshDelay = 800;
  state.refreshFails = true;
  mine();
  const feedback = page.locator(".transaction-feedback");
  await expect(feedback).toContainText(
    "Refund confirmed. Checking the latest contribution record…",
  );
  await expect(feedback).not.toContainText(
    "your refreshed contribution record",
  );
  await expect(feedback).toContainText(
    "Refund confirmed, but the latest contribution record could not be loaded.",
  );
  await expect(feedback).not.toContainText(
    "your refreshed contribution record",
  );
  expect(state.submitted).toHaveLength(1);
  state.refreshFails = false;
  await page
    .getByRole("button", { name: "Retry data refresh", exact: true })
    .click();
  await expect(feedback).toContainText(
    "Checking the latest contribution record…",
  );
  await expect(feedback).not.toContainText(
    "your refreshed contribution record",
  );
  await expect(feedback).toContainText(
    "Refund confirmed. Eligibility comes from your refreshed contribution record.",
  );
  await expect(page.locator(".wallet-contribution strong")).toHaveText("0 ETH");
  expect(state.submitted).toHaveLength(1);
});
