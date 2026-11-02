import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: {
    headless: true,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
    viewport: { width: 1440, height: 900 },
  },
  webServer: [
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort",
      url: "http://127.0.0.1:5173",
      env: { VITE_CROWDFUND_CONTRACT_ADDRESS: "", VITE_SEPOLIA_RPC_URL: "" },
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5174 --strictPort",
      url: "http://127.0.0.1:5174",
      env: {
        VITE_CROWDFUND_CONTRACT_ADDRESS:
          "0x1111111111111111111111111111111111111111",
        VITE_SEPOLIA_RPC_URL: "http://127.0.0.1:18545",
      },
    },
  ],
});
