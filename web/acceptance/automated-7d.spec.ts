import { test, expect, type Page, type Locator, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createPublicClient, http, formatEther } from 'viem';
import { sepolia } from 'viem/chains';
import { crowdfundingAbi } from '../src/blockchain/abi';

const routes = ['/', '/campaigns', '/campaigns/1', '/campaigns/2', '/create'];
const widths = [320, 375, 390, 700, 768, 869, 981, 1100, 1280, 1440];
const address = '0x8627ffb5768CF5E47965E55F6855f8910b474A25' as const;
const forbidden = /^(eth_requestAccounts|wallet_requestPermissions|wallet_switchEthereumChain|wallet_addEthereumChain|eth_send.*|wallet_send.*|eth_sign.*|personal_sign|wallet_grantPermissions)$/;
const safety = new WeakMap<Page, { methods: string[]; errors: string[]; network: string[] }>();

async function attach(info: TestInfo, name: string, value: unknown) {
  await info.attach(name, { body: JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2), contentType: 'application/json' });
}

test.beforeEach(async ({ page, context }) => {
  const state = { methods: [] as string[], errors: [] as string[], network: [] as string[] };
  safety.set(page, state);
  page.on('pageerror', e => state.errors.push(e.message));
  page.on('requestfailed', r => state.network.push(`${new URL(r.url()).origin}: ${r.failure()?.errorText}`));
  await page.exposeFunction('acceptanceWalletMethod', (method: string) => state.methods.push(method));
  // Disconnected sentinel only: records/blocks requests, never talks to a real extension.
  await page.addInitScript(() => {
    const w = window as unknown as { acceptanceWalletMethod: (m: string) => Promise<void>; ethereum: unknown };
    w.ethereum = {
      on() {}, removeListener() {},
      async request({ method }: { method: string }) {
        await w.acceptanceWalletMethod(method);
        if (method === 'eth_accounts') return [];
        if (method === 'eth_chainId') return '0xaa36a7';
        throw new Error('Wallet interaction is forbidden in read-only acceptance');
      },
    };
  });
  // Observe actual production traffic; never replace read responses with fixtures.
  await context.route('**/*', async route => {
    let payload: unknown;
    try { payload = route.request().postDataJSON(); } catch { /* Non-JSON asset/navigation. */ }
    const requests = Array.isArray(payload) ? payload : [payload];
    const methods = requests.flatMap(r => r && typeof r === 'object' && 'method' in r && typeof r.method === 'string' ? [r.method] : []);
    state.methods.push(...methods);
    if (methods.some(m => forbidden.test(m))) await route.abort('blockedbyclient');
    else await route.continue();
  });
});

test.afterEach(async ({ page, browser }, info) => {
  const state = safety.get(page)!;
  await attach(info, 'environment-and-safety', { browser: browser.version(), project: info.project.name,
    url: page.url(), viewport: page.viewportSize(), ...state });
  expect(state.methods.filter(m => forbidden.test(m)), 'No wallet permission/signing/network switch or write RPC').toEqual([]);
  expect(state.errors, 'No uncaught application errors').toEqual([]);
  if (!page.isClosed()) await page.screenshot({ path: info.outputPath('render.png'), fullPage: true });
});

async function open(page: Page, route: string) {
  const response = await page.goto(route, { waitUntil: 'load' });
  expect(response?.ok(), `Production document ${route}`).toBe(true);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  if (route === '/create') await expect(page.locator('.create-form .demo-label')).toHaveText('SEPOLIA CAMPAIGN');
  else {
    await expect(page.locator('.live-context')).toContainText('Chain 11155111');
    await expect(page.locator('.live-context code')).toHaveText(address);
  }
  if (route !== '/create') {
    // Actual public RPC failures remain failures, never mock/demo/zero fallbacks.
    await expect(page.locator('.read-status')).toContainText('Public data loaded.');
    await expect(page.getByRole('button', { name: 'Refresh public data' })).toBeEnabled();
    await expect(page.locator('.read-status')).toHaveAttribute('aria-live', 'polite');
    expect(await page.getByRole('progressbar').count()).toBeGreaterThan(0);
  }
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Connect Wallet', exact: true })).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  });
  let previous = '';
  await expect.poll(async () => {
    const value = await page.locator('main').evaluate(e => JSON.stringify([e.getBoundingClientRect().width, e.getBoundingClientRect().height, document.documentElement.scrollWidth]));
    const stable = value === previous; previous = value; return stable;
  }).toBe(true);
}

async function readable(locator: Locator) {
  await expect(locator).toBeVisible();
  expect(await locator.evaluate(e => {
    const problems: string[] = [];
    const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    let text: Node | null;
    while ((text = walker.nextNode())) {
      if (!text.textContent?.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(text);
      for (const r of range.getClientRects()) {
        if (!r.width || !r.height) continue;
        if (r.left < -1.5 || r.right > document.documentElement.clientWidth + 1.5) problems.push(`text outside viewport: ${r.left}..${r.right}`);
        for (let p = text.parentElement; p && p.tagName !== 'BODY'; p = p.parentElement) {
          const s = getComputedStyle(p), b = p.getBoundingClientRect();
          if (/hidden|clip|auto|scroll/.test(s.overflowX) && (r.left < b.left + p.clientLeft - 1.5 || r.right > b.left + p.clientLeft + p.clientWidth + 1.5)) problems.push(`clipped by ${p.tagName}.${p.className}`);
        }
      }
    }
    return [...new Set(problems)];
  }), `Readable text: ${await locator.textContent()}`).toEqual([]);
}

async function layout(page: Page, info: TestInfo) {
  const bounds = await page.evaluate(() => ({ viewport: innerWidth, client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
  await attach(info, 'document-bounds', bounds);
  expect(bounds.scroll).toBeLessThanOrEqual(bounds.client + 1);
  for (const locator of ['h1', '.campaign-card h3', '.campaign-card .badge', '.funding-top', '.funding-bottom', '.creator strong', '.funding-panel dd', '.raised-large', 'label', '.field-help']) {
    for (const element of await page.locator(locator).all()) await readable(element);
  }
  for (const control of await page.locator('header a, header button, main button:enabled, main input, main textarea, main .back-link').all()) {
    await control.scrollIntoViewIfNeeded();
    await expect(control).toBeVisible();
    expect(await control.evaluate(e => {
      const r = e.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!hit && (hit === e || e.contains(hit));
    }), `Control obstruction: ${await control.getAttribute('aria-label') || await control.textContent()}`).toBe(true);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  expect(await page.evaluate(() => scrollY > 0 || document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  for (const bar of await page.getByRole('progressbar').all()) {
    await expect(bar).toHaveAccessibleName(/funding/);
    await expect(bar).toHaveAttribute('aria-valuemin', '0');
    await expect(bar).toHaveAttribute('aria-valuemax', '100');
    const value = Number(await bar.getAttribute('aria-valuenow'));
    expect(value).toBeGreaterThanOrEqual(0); expect(value).toBeLessThanOrEqual(100);
    await expect(bar).toHaveAttribute('aria-valuetext', / of .* ETH/);
  }
}

for (const route of routes) test(`@production public route ${route}`, async ({ page }, info) => {
  await open(page, route); await layout(page, info);
  await page.keyboard.press('Tab'); await expect(page.locator('.skip-link')).toBeFocused();
  await expect(page.locator('.skip-link')).toBeInViewport();
  if (route === '/campaigns') {
    const links = await page.locator('.campaign-card h3 a').evaluateAll(es => es.map(e => e.getAttribute('href')));
    expect(links.length).toBeGreaterThan(0); expect(new Set(links).size).toBe(links.length);
    await page.getByRole('navigation').getByRole('link', { name: 'Start a campaign' }).click();
    await expect(page).toHaveURL(/\/create$/); await expect(page.locator('#title')).toBeVisible();
  }
  if (route === '/campaigns/1' || route === '/campaigns/2') {
    const client = createPublicClient({ chain: sepolia, transport: http('https://ethereum-sepolia-rpc.publicnode.com', { retryCount: 0, timeout: 15_000 }) });
    expect(await client.getChainId()).toBe(11155111);
    const id = BigInt(route.split('/').at(-1)!);
    const [campaign, status] = await client.readContract({ address, abi: crowdfundingAbi, functionName: 'getCampaign', args: [id] });
    await attach(info, 'independent-public-contract-read', { id, campaign, status });
    await expect(page.locator('h1')).toHaveText(campaign.title);
    await expect(page.locator('.creator strong')).toHaveText(campaign.creator);
    await expect(page.locator('dt').filter({ hasText: /^Campaign status$/ }).locator('..').locator('dd')).toHaveText(['Active', 'Successful', 'Failed', 'Cancelled'][status]);
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', `${formatEther(campaign.amountRaised)} of ${formatEther(campaign.goal)} ETH`);
    await expect(page.locator('dt').filter({ hasText: /^Remaining to goal$/ }).locator('..').locator('dd')).toHaveText(`${formatEther(campaign.goal > campaign.amountRaised ? campaign.goal - campaign.amountRaised : 0n)} ETH`);
    if (id === 2n) {
      expect(campaign.withdrawn).toBe(true); expect(status).toBe(1);
      await expect(page.getByText('Successfully withdrawn', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Withdraw Funds', exact: true })).toHaveCount(0);
    }
  }
});

async function axe(page: Page, info: TestInfo) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  await attach(info, 'axe-full-results', result);
  const contrast = [...result.violations, ...result.passes, ...result.incomplete].filter(r => r.id === 'color-contrast');
  await attach(info, 'contrast-results', contrast);
  console.log('AXE_RESULT ' + JSON.stringify({ route: page.url(), violations: result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary, checks: n.any.map(c => c.data) })) })), incomplete: result.incomplete.map(v => v.id), contrast: contrast.map(v => ({ id: v.id, nodes: v.nodes.slice(0, 5).map(n => ({ target: n.target, checks: n.any.map(c => c.data) })) })) }));
  expect(result.violations, 'All detected WCAG A/AA violations remain actionable').toEqual([]);
}
for (const route of routes) test(`@axe WCAG A/AA ${route}`, async ({ page }, info) => {
  await open(page, route); await axe(page, info);
});

test('@axe invalid form labels, descriptions and recovery', async ({ page }, info) => {
  await open(page, '/create');
  for (const id of ['title', 'description', 'goal', 'duration']) {
    await expect(page.locator(`#${id}`)).toHaveAccessibleName(/.+/);
    await expect(page.locator(`#${id}`)).toHaveAttribute('aria-describedby', `${id}-help`);
  }
  await page.locator('#duration').fill('');
  await page.getByRole('button', { name: 'Create Campaign', exact: true }).click();
  await expect(page.locator('[aria-invalid=true]')).toHaveCount(4);
  await expect(page.locator('#title')).toBeFocused();
  await page.locator('#title').fill('Invalid-only automation; never publish');
  await page.getByRole('button', { name: 'Create Campaign', exact: true }).click();
  await expect(page.locator('#title')).toHaveAttribute('aria-invalid', 'false');
  await expect(page.locator('[aria-invalid=true]')).toHaveCount(3);
  await expect(page.locator('.transaction-feedback')).toHaveCount(0);
  await axe(page, info);
});

for (const width of widths) test(`@reflow production narrow/zoom-equivalent ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  for (const route of ['/campaigns', '/campaigns/2', '/create']) {
    await open(page, route); await layout(page, info);
  }
});
for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test.describe(`touch ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true });
    test('@touch production navigation/detail/form', async ({ page }, info) => {
      for (const route of ['/campaigns', '/campaigns/2', '/create']) { await open(page, route); await layout(page, info); }
      await page.getByRole('navigation').getByRole('link', { name: 'Explore campaigns' }).tap();
      await expect(page).toHaveURL(/\/campaigns$/);
      expect(await page.evaluate(() => navigator.maxTouchPoints)).toBeGreaterThan(0);
    });
  });
}

test('@keyboard production skip link and header/form focus', async ({ page }) => {
  await open(page, '/create');
  for (const control of [page.locator('.skip-link'), page.getByRole('banner').getByRole('link', { name: 'DeCen CROWDFUND' }), page.getByRole('navigation').getByRole('link', { name: 'Explore campaigns' }), page.getByRole('navigation').getByRole('link', { name: 'Start a campaign' }), page.getByRole('button', { name: 'Connect Wallet', exact: true })]) {
    await page.keyboard.press('Tab'); await expect(control).toBeFocused();
    expect(await control.evaluate(e => { const s = getComputedStyle(e); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2; })).toBe(true);
  }
  await page.goto('/create'); await expect(page.locator('main#main')).toBeAttached(); await expect(page.locator('.skip-link')).toBeAttached();
  await page.keyboard.press('Tab'); await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page).toHaveURL(/#main$/);
  await page.keyboard.press('Tab'); await expect(page.locator('main .back-link')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('#title')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('#description')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(page.locator('#title')).toBeFocused();
});

test('@motion production reduced-motion preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page, '/campaigns');
  await page.locator('.campaign-card').first().hover();
  expect(await page.locator('.campaign-card').first().evaluate(e => getComputedStyle(e).transform)).toBe('none');
  expect(await page.locator('header a').first().evaluate(e => getComputedStyle(e).transitionDuration)).toBe('0s');
});
