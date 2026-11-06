import { test, expect, type Locator, type Page } from '@playwright/test';
import { demoUrl, liveUrl, mockRpc, mockWallet, walletCalls } from './mocks';

const normalized = (text: string) => text.replace(/\s+/g, ' ').trim();
const forbidden = /eth_requestAccounts|wallet_requestPermissions|wallet_switch|eth_send|wallet_send|eth_sign|personal_sign/;

async function unclipped(element: Locator) {
  await expect(element).toBeVisible();
  expect(await element.evaluate(e => {
    const r = e.getBoundingClientRect();
    return r.left >= -1 && r.right <= document.documentElement.clientWidth + 1 && e.scrollWidth <= e.clientWidth + 1;
  }), `Unclipped ${await element.textContent()}`).toBe(true);
  await element.scrollIntoViewIfNeeded();
  expect(await element.evaluate(e => {
    const r = e.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && (hit === e || e.contains(hit));
  }), 'Link center is not obstructed').toBe(true);
}

async function ready(page: Page, url: string) {
  if (page.url().startsWith('http')) expect((await walletCalls(page)).filter(method => forbidden.test(method))).toEqual([]);
  await page.goto(url);
  await expect(page.locator('h1')).toHaveCount(1);
  if (url.startsWith(liveUrl) && !url.endsWith('/create')) await expect(page.locator('.read-status')).toContainText('Public data loaded.');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

for (const [mode, base] of [['demo', demoUrl], ['mocked-live', liveUrl]]) {
  for (const width of [1440, 375]) {
    test(`visible link names, keyboard and layout — ${mode} ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const rpc = await mockRpc(page);
      await mockWallet(page);
      await ready(page, base + '/');
      const feature = page.locator('.feature-cover-link');
      await expect(feature).toBeVisible();
      const visibleCover = normalized(await feature.innerText());
      await expect(feature).toHaveRole('link');
      await expect(feature).toHaveAttribute('href', '/campaigns/1');
      await expect(feature).toHaveAccessibleName(visibleCover);
      await expect(feature.locator('.cover')).toHaveAttribute('aria-hidden', 'false');
      await expect(feature.locator('a, button, input, [tabindex]')).toHaveCount(0);
      await expect(page.locator('.hero-feature a')).toHaveCount(3);
      await expect(page.locator('.feature-info h2 a')).toHaveAccessibleName(mode === 'demo' ? 'A little library. A bigger world.' : 'Verified community project 1');
      await expect(page.locator('.circle-link')).toHaveAttribute('href', '/campaigns/1');
      await expect(page.locator('.circle-link')).toHaveAccessibleName(/^View /);
      await unclipped(feature);
      // Follow the actual Tab order without activating wallet or financial controls.
      await ready(page, base + '/');
      await expect(feature).toBeVisible();
      await page.keyboard.press('Tab'); await expect(page.locator('.skip-link')).toBeFocused();
      await page.keyboard.press('Tab'); await expect(page.getByRole('banner').getByRole('link', { name: 'DeCen CROWDFUND', exact: true })).toBeFocused();
      let reachedFeature = false, reachedFooter = false;
      for (let step = 0; step < 30; step++) {
        await page.keyboard.press('Tab');
        reachedFeature ||= await feature.evaluate(e => e === document.activeElement);
        reachedFooter = await page.locator('footer .brand').evaluate(e => e === document.activeElement);
        if (reachedFooter) break;
      }
      expect(reachedFeature, 'Featured cover stays in the keyboard sequence').toBe(true);
      expect(reachedFooter, 'Footer brand is keyboard reachable').toBe(true);
      for (const route of ['/', '/campaigns/1', '/create']) {
        await ready(page, base + route);
        for (const region of ['header', 'footer']) {
          const brand = page.locator(`${region} .brand`);
          const wordmark = normalized(await brand.locator(':scope > span:last-child').innerText());
          expect(wordmark).toBe('DeCen CROWDFUND');
          await expect(brand).toHaveRole('link');
          await expect(brand).toHaveAttribute('href', '/');
          await expect(brand).toHaveAccessibleName(wordmark);
          await expect(brand.locator('.brand-mark')).toHaveAttribute('aria-hidden', 'true');
          await unclipped(brand);
        }
        if (route === '/campaigns/1') await expect(page.locator('.detail-layout .cover')).toHaveAttribute('aria-hidden', 'true');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      }
      expect((await walletCalls(page)).filter(method => forbidden.test(method))).toEqual([]);
      expect(rpc.calls.every(method => /^(eth_chainId|eth_blockNumber|eth_call|campaignCount|getCampaign|getCampaignStatus|contributions)$/.test(method))).toBe(true);
    });
  }
}
