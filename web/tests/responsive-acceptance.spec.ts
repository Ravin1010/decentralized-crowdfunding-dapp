import { test, expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import { getAddress } from "viem";
import { accountA, liveUrl, mockRpc, mockWallet } from "./mocks";

const widths = [320, 375, 390, 700, 768, 869, 981, 1100, 1280, 1440];
const routes = ["/", "/campaigns", "/campaigns/1", "/campaigns/2", "/create"];
const forbidden = /eth_requestAccounts|wallet_requestPermissions|eth_send|wallet_send|eth_sign|personal_sign|wallet_switch/;

test.beforeEach(async ({ page }) => {
  // An available but disconnected provider lets us detect unsolicited requests.
  await mockWallet(page);
});
test.afterEach(async ({ page }) => {
  if (page.isClosed()) return;
  const calls = await page.evaluate(() =>
    (window as unknown as { walletMock?: { calls: string[] } }).walletMock?.calls ?? [],
  );
  expect(calls.filter((method) => forbidden.test(method)), "No permissions, signing, switching or writes").toEqual([]);
});

async function settle(page: Page, route: string) {
  await expect(page.locator("h1")).toHaveCount(1);
  if (route !== "/create") {
    await expect(page.locator(".read-status")).toContainText("Public data loaded.");
    await expect(page.getByRole("button", { name: "Refresh public data" })).toBeEnabled();
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  // Require repeated identical layout samples; never assert against a loading screenshot.
  let previous = "";
  await expect.poll(async () => {
    const sample = await page.locator("main").evaluate((main) => {
      const r = main.getBoundingClientRect();
      return JSON.stringify([r.width, r.height, document.documentElement.scrollWidth]);
    });
    const stable = sample === previous;
    previous = sample;
    return stable;
  }).toBe(true);
}

async function measurement(locator: Locator) {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      tag: element.tagName, class: element.className, text: element.textContent?.trim().slice(0, 90),
      x: rect.x, y: rect.y + scrollY, width: rect.width, height: rect.height,
      right: rect.right, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth,
      overflowX: style.overflowX, overflowY: style.overflowY,
      whiteSpace: style.whiteSpace, overflowWrap: style.overflowWrap,
    };
  });
}

async function readable(locator: Locator) {
  await expect(locator).toBeVisible();
  const problems = await locator.evaluate((element) => {
    const tolerance = 1.5;
    const issues: string[] = [];
    const r = element.getBoundingClientRect();
    for (let parent: Element | null = element; parent; parent = parent.parentElement) {
      if (Number(getComputedStyle(parent).opacity) === 0)
        issues.push(`transparent ancestor ${parent.tagName}.${parent.className}`);
    }
    if (r.left < -tolerance || r.right > document.documentElement.clientWidth + tolerance)
      issues.push(`element horizontal bounds ${r.left}..${r.right}, viewport ${document.documentElement.clientWidth}`);
    // Text line rectangles detect clipping inside cards/panels even if root overflow is hidden.
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const line of Array.from(range.getClientRects())) {
        if (!line.width || !line.height) continue;
        if (line.left < r.left - tolerance || line.right > r.right + tolerance)
          issues.push(`text outside its essential element: ${line.left}..${line.right}, element ${r.left}..${r.right}`);
        if (line.left < -tolerance || line.right > document.documentElement.clientWidth + tolerance)
          issues.push(`text ${node.textContent.slice(0, 30)} at ${line.left}..${line.right}`);
        for (let parent = node.parentElement; parent && !["BODY", "HTML"].includes(parent.tagName); parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          const box = parent.getBoundingClientRect();
          const left = box.left + parent.clientLeft, top = box.top + parent.clientTop;
          if (/hidden|clip|auto|scroll/.test(style.overflowX) &&
              (line.left < left - tolerance || line.right > left + parent.clientWidth + tolerance))
            issues.push(`horizontal text clipping by ${parent.tagName}.${parent.className}`);
          if (/hidden|clip|auto|scroll/.test(style.overflowY) &&
              (line.top < top - tolerance || line.bottom > top + parent.clientHeight + tolerance))
            issues.push(`vertical text clipping by ${parent.tagName}.${parent.className}`);
        }
      }
    }
    return [...new Set(issues)];
  });
  expect(problems, JSON.stringify(await measurement(locator))).toEqual([]);
}

async function controlIsUnobscured(control: Locator) {
  await expect(control).toBeVisible();
  await control.scrollIntoViewIfNeeded();
  expect(await control.evaluate((element) => {
    const r = element.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && (hit === element || element.contains(hit));
  }), `Control is not obscured: ${await control.textContent()}`).toBe(true);
}

async function artifact(page: Page, info: TestInfo, route: string, width: number) {
  const metrics = {
    browser: info.project.use.browserName ?? "chromium", route, viewport: page.viewportSize(),
    document: await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth })),
    panels: await Promise.all(await page.locator(".funding-panel, .campaign-card, .creator strong").all().then((items) => items.map(measurement))),
  };
  await info.attach("layout-measurements", { body: JSON.stringify(metrics, null, 2), contentType: "application/json" });
  // Runtime artifacts only: no new tracked screenshots or production evidence is invented.
  if ((width === 869 && route === "/campaigns/2") ||
      (width === 981 && route === "/campaigns") ||
      (width === 375 && route === "/create")) {
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await info.attach("mocked-responsive-page", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  }
}

for (const width of widths) {
  for (const route of routes) {
    test(`public responsive ${route} at ${width}px`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 });
      const rpc = await mockRpc(page, route === "/campaigns/2"
        ? { status: 1, withdrawn: true, full: true } : {});
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(liveUrl + route);
      await settle(page, route);
      await artifact(page, info, route, width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
        "No document-wide horizontal scrolling").toBe(true);
      for (const control of await page.locator("header nav a, header .wallet-button").all()) {
        await expect(control).toBeEnabled();
        await readable(control);
        await controlIsUnobscured(control);
      }
      if (route === "/" || route === "/campaigns") {
        await expect(page.locator(".campaign-card")).toHaveCount(2);
        for (const [index, card] of (await page.locator(".campaign-card").all()).entries()) {
          await expect(card.locator("h3")).toHaveText(`Verified community project ${index + 1}`);
          await expect(card.locator(".badge")).toContainText("Active");
          await expect(card.locator(".funding-top")).toContainText("1.000000000000000001 ETH");
          for (const essential of await card.locator("h3, .badge, .funding-top, .funding-bottom, [role=progressbar]").all())
            await readable(essential);
          await controlIsUnobscured(card.locator("h3 a"));
        }
        await page.getByRole("button", { name: "Refresh public data" }).click();
        await settle(page, route);
        await expect(page.locator(".campaign-card")).toHaveCount(2);
        for (const card of await page.locator(".campaign-card").all()) await readable(card.locator(".card-content"));
      }
      if (route.startsWith("/campaigns/")) {
        const panel = page.getByRole("complementary", { name: "Campaign funding" });
        await expect(page.locator(".creator strong")).toHaveText(getAddress(accountA));
        for (const essential of await page.locator(".detail-heading h1, .detail-heading .badge, .creator strong, .funding-panel .raised-large, .funding-panel .funding, .funding-panel dl, .funding-panel .outcome").all())
          await readable(essential);
        await expect(panel).toContainText("Goal 2 ETH");
        await expect(panel).toContainText(route.endsWith("/2") ? "Successful" : "Active");
        if (route.endsWith("/2")) {
          await expect(page.locator(".raised-large")).toHaveText("2 ETH");
          await expect(page.getByText("Successfully withdrawn", { exact: true })).toBeVisible();
          await expect(page.getByRole("button", { name: "Withdraw Funds", exact: true })).toHaveCount(0);
        } else await expect(page.locator(".raised-large")).toContainText("1.000000000000000001");
      }
      if (route === "/create") {
        for (const essential of await page.locator(".create-form label, .create-form input, .create-form textarea, .field-help, .form-submit button, .form-submit .small").all())
          await readable(essential);
        for (const control of await page.locator(".create-form input, .create-form textarea, .form-submit button").all())
          await controlIsUnobscured(control);
      }
      // Layout overlap is independent of scroll position; below-the-fold is allowed.
      const overlaps = await page.locator("header a, header button, main input, main textarea, main button").evaluateAll((controls) => {
        const visible = controls.filter((e) => e.getBoundingClientRect().width && getComputedStyle(e).visibility !== "hidden");
        return visible.flatMap((a, i) => visible.slice(i + 1).flatMap((b) => {
          const x = a.getBoundingClientRect(), y = b.getBoundingClientRect();
          return Math.min(x.right, y.right) - Math.max(x.left, y.left) > 2 &&
            Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 2
            ? [`${a.tagName}:${a.textContent?.trim()} overlaps ${b.tagName}:${b.textContent?.trim()}`] : [];
        }));
      });
      expect(overlaps).toEqual([]);
      expect(errors).toEqual([]);
      expect(rpc.calls.every((method) => /^(eth_chainId|eth_blockNumber|eth_call|campaignCount|getCampaign|getCampaignStatus|contributions)$/.test(method))).toBe(true);
    });
  }
}

for (const width of [375, 869, 1440]) {
  test(`keyboard skip target and essential tab order at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockRpc(page);
    await page.goto(liveUrl + "/create");
    await settle(page, "/create");
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await expect(page.locator(".skip-link")).toBeInViewport();
    expect(await page.locator(".skip-link").evaluate((e) => {
      const s = getComputedStyle(e); return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2;
    })).toBe(true);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
    await expect(page.locator("main#main")).toHaveCount(1);
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.querySelector("main")?.contains(document.activeElement))).toBe(true);
    await page.goto(liveUrl + "/create");
    await settle(page, "/create");
    for (const target of [page.locator(".skip-link"), page.getByRole("banner").getByRole("link", { name: "DeCen CROWDFUND" }),
      page.getByRole("navigation").getByRole("link", { name: "Explore campaigns" }),
      page.getByRole("navigation").getByRole("link", { name: "Start a campaign" }), page.getByRole("button", { name: "Connect Wallet", exact: true })]) {
      await page.keyboard.press("Tab");
      await expect(target).toBeFocused();
      await controlIsUnobscured(target);
    }
    // Activate navigation, never Connect Wallet.
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(liveUrl + "/campaigns");
    await settle(page, "/campaigns");
  });
}

test("create labels, descriptions, required errors and keyboard focus are accessible without a wallet", async ({ page }) => {
  await mockRpc(page);
  await page.goto(liveUrl + "/create");
  await settle(page, "/create");
  for (const [id, name] of [["title", "Campaign title"], ["description", "Your story"], ["goal", "Funding goal (ETH)"], ["duration", "Campaign duration (days)"]]) {
    const field = page.getByLabel(name, { exact: false });
    await expect(field).toHaveAttribute("id", id);
    await expect(field).toHaveAttribute("required", "");
    await expect(field).toHaveAccessibleName(new RegExp(name.replace(/[()]/g, "\\$&")));
    await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
    await expect(page.locator(`#${id}-help`)).not.toBeEmpty();
    await expect(field).toHaveAttribute("aria-describedby", `${id}-help`);
    await expect(field).toHaveAttribute("aria-invalid", "false");
  }
  await page.locator("#duration").fill("");
  await page.getByRole("button", { name: "Create Campaign", exact: true }).click();
  await expect(page.locator("[aria-invalid=true]")).toHaveCount(4);
  await expect(page.locator("#title")).toBeFocused();
  for (const id of ["title", "description", "goal", "duration"]) {
    await expect(page.locator(`#${id}`)).toHaveAttribute("aria-describedby", `${id}-help ${id}-error`);
    await expect(page.locator(`#${id}-error`)).toBeVisible();
  }
  await page.keyboard.press("Tab");
  await expect(page.locator("#description")).toBeFocused();
  expect(await page.locator("#description").evaluate((e) => {
    const s = getComputedStyle(e); return s.outlineStyle === "solid" && parseFloat(s.outlineWidth) >= 2;
  })).toBe(true);
  for (const selector of ["#goal", "#duration", ".form-submit button"]) {
    await page.keyboard.press("Tab");
    await expect(page.locator(selector)).toBeFocused();
  }
  await page.locator("#title").fill("A local validation check");
  await page.getByRole("button", { name: "Create Campaign", exact: true }).click();
  await expect(page.locator("#title")).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("[aria-invalid=true]")).toHaveCount(3);
  await expect(page.locator(".transaction-feedback")).toHaveCount(0);
});

test("public errors and empty status use announcement semantics, with read-only recovery", async ({ page }) => {
  const rpc = await mockRpc(page, { count: 0 });
  await page.goto(liveUrl + "/campaigns");
  await expect(page.getByRole("status")).toContainText("No campaigns yet");
  await expect(page.locator(".read-status")).toHaveAttribute("aria-live", "polite");
  rpc.fail = true;
  await page.getByRole("button", { name: "Refresh public data" }).click();
  await expect(page.getByRole("alert")).toContainText("Could not read the Sepolia contract");
  await expect(page.getByRole("status")).toHaveCount(0);
  rpc.fail = false;
  await page.getByRole("button", { name: "Refresh public data" }).click();
  await expect(page.getByRole("status")).toContainText("No campaigns yet");
});

test("funding progress has names, bounded values and exact amount text", async ({ page }) => {
  await mockRpc(page);
  await page.goto(liveUrl + "/campaigns");
  await settle(page, "/campaigns");
  const progress = page.getByRole("progressbar");
  await expect(progress).toHaveCount(2);
  for (const [index, bar] of (await progress.all()).entries()) {
    await expect(bar).toHaveAccessibleName(`Verified community project ${index + 1} funding`);
    await expect(bar).toHaveAttribute("aria-valuemin", "0");
    await expect(bar).toHaveAttribute("aria-valuemax", "100");
    const value = Number(await bar.getAttribute("aria-valuenow"));
    expect(value).toBeGreaterThanOrEqual(0); expect(value).toBeLessThanOrEqual(100);
    await expect(bar).toHaveAttribute("aria-valuetext", "1.000000000000000001 of 2 ETH");
  }
});

test("reduced motion disables transitions and hover displacement", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockRpc(page);
  await page.goto(liveUrl + "/campaigns");
  await settle(page, "/campaigns");
  const card = page.locator(".campaign-card").first();
  await card.hover();
  expect(await card.evaluate((e) => getComputedStyle(e).transform)).toBe("none");
  for (const selector of [".campaign-card", ".button", "header a"]) {
    expect(await page.locator(selector).first().evaluate((e) => getComputedStyle(e).transitionDuration)).toBe("0s");
  }
});
