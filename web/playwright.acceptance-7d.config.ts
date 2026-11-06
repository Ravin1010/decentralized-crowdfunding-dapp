import { defineConfig } from '@playwright/test';

// Only the environment surface used here; no additional Node typings dependency.
declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  testDir: './acceptance',
  testMatch: 'automated-7d.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  outputDir: 'test-results/acceptance-7d/artifacts',
  reporter: [['line'], ['json', { outputFile: 'test-results/acceptance-7d/results.json' }]],
  use: {
    baseURL: 'https://decentralized-crowdfunding-dapp.vercel.app',
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Use the managed environment's proxy when present; never bypass its policy.
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
  },
  projects: [
    { name: 'windows-chrome', grep: /@production|@keyboard/, use: { channel: 'chrome' } },
    { name: 'linux-chromium', grep: /@axe|@reflow|@touch|@keyboard|@motion/,
      use: { launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {} } },
  ],
});
