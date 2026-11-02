import type { Page } from "@playwright/test";
import {
  decodeFunctionData,
  encodeFunctionResult,
  multicall3Abi,
  parseEther,
  type Hex,
} from "viem";
import { crowdfundingAbi } from "../src/blockchain/abi";

export const accountA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
export const accountB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
export const demoUrl = "http://127.0.0.1:5173";
export const liveUrl = "http://127.0.0.1:5174";
export async function mockRpc(
  page: Page,
  options: {
    count?: number;
    status?: number;
    withdrawn?: boolean;
    full?: boolean;
    rpcChain?: string;
  } = {},
) {
  const state = {
    fail: false,
    contributionFail: false,
    delayWalletA: 0,
    pendingWalletA: false,
    count: options.count ?? 2,
    calls: [] as string[],
    campaignCalls: [] as bigint[],
  };
  function contractResult(data: Hex): Hex {
    const decoded = decodeFunctionData({ abi: crowdfundingAbi, data });
    state.calls.push(decoded.functionName);
    switch (decoded.functionName) {
      case "campaignCount":
        return encodeFunctionResult({
          abi: crowdfundingAbi,
          functionName: "campaignCount",
          result: BigInt(state.count),
        });
      case "getCampaignStatus":
        return encodeFunctionResult({
          abi: crowdfundingAbi,
          functionName: "getCampaignStatus",
          result: options.status ?? 0,
        });
      case "contributions": {
        if (state.contributionFail)
          throw new Error("Contribution RPC unavailable");
        const wallet = decoded.args[1].toLowerCase();
        return encodeFunctionResult({
          abi: crowdfundingAbi,
          functionName: "contributions",
          result: wallet === accountA ? parseEther("0.25") : parseEther("0.75"),
        });
      }
      case "getCampaign": {
        const id = decoded.args[0];
        state.campaignCalls.push(id);
        if (id > BigInt(state.count)) throw new Error("InvalidCampaign");
        return encodeFunctionResult({
          abi: crowdfundingAbi,
          functionName: "getCampaign",
          result: [
            {
              creator: accountA,
              title: `Verified community project ${id}`,
              description:
                "Description stored in the contract. No invented story or funding plan.",
              goal: parseEther("2"),
              amountRaised: options.full
                ? parseEther("2")
                : parseEther("1.000000000000000001"),
              deadline: BigInt(Math.floor(Date.now() / 1000) + 10),
              cancelled: options.status === 3,
              withdrawn: options.withdrawn ?? false,
            },
            options.status ?? 0,
          ],
        });
      }
    }
  }
  await page.route("http://127.0.0.1:18545/**", async (route) => {
    if (route.request().method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "content-type",
        },
      });
    const payload = route.request().postDataJSON();
    async function respond(request: {
      id: number;
      method: string;
      params?: [{ data: Hex }];
    }) {
      state.calls.push(request.method);
      try {
        if (state.fail) throw new Error("RPC unavailable");
        let result: unknown;
        if (request.method === "eth_chainId")
          result = options.rpcChain ?? "0xaa36a7";
        else if (request.method === "eth_blockNumber") result = "0x100";
        else if (request.method === "eth_call") {
          const data = request.params![0].data;
          // viem may batch contribution reads through Multicall3; delay either form.
          if (
            state.delayWalletA &&
            data.toLowerCase().includes(accountA.slice(2))
          ) {
            state.pendingWalletA = true;
            await new Promise((resolve) =>
              setTimeout(resolve, state.delayWalletA),
            );
          }
          if (data.startsWith("0x82ad56cb")) {
            const call = decodeFunctionData({ abi: multicall3Abi, data });
            if (call.functionName !== "aggregate3")
              throw new Error("Unexpected multicall");
            result = encodeFunctionResult({
              abi: multicall3Abi,
              functionName: "aggregate3",
              result: call.args[0].map((c) => ({
                success: true,
                returnData: contractResult(c.callData),
              })),
            });
          } else {
            result = contractResult(data);
          }
        } else throw new Error(`Unexpected RPC ${request.method}`);
        return { jsonrpc: "2.0", id: request.id, result };
      } catch (error) {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: { code: -32000, message: String(error) },
        };
      }
    }
    await route.fulfill({
      json: Array.isArray(payload)
        ? await Promise.all(payload.map(respond))
        : await respond(payload),
      headers: { "access-control-allow-origin": "*" },
    });
  });
  return state;
}
export async function mockWallet(
  page: Page,
  {
    chain = "0xaa36a7",
    reject = false,
    rejectSwitch = false,
    delay = 0,
    revokeUnsupported = false,
  } = {},
) {
  await page.addInitScript(
    ({
      chain,
      reject,
      rejectSwitch,
      delay,
      revokeUnsupported,
      accountA,
      accountB,
    }) => {
      const listeners = new Map<string, Set<(arg: unknown) => void>>();
      // Test-only extension state, not app state or financial data. MetaMask
      // retains site authorization, selected account and network across reloads.
      const key = "test:metamask-extension";
      const stored = JSON.parse(sessionStorage.getItem(key) || "null");
      let current = stored?.current ?? accountA;
      let authorized = stored?.authorized ?? false;
      let network = stored?.network ?? chain;
      let silentUnavailable = stored?.silentUnavailable ?? false;
      const calls: string[] = stored?.calls ?? [];
      const persist = () =>
        sessionStorage.setItem(
          key,
          JSON.stringify({
            current,
            authorized,
            network,
            silentUnavailable,
            calls,
          }),
        );
      const emit = (event: string, value: unknown) =>
        listeners.get(event)?.forEach((callback) => callback(value));
      const provider = {
        isMetaMask: true,
        on(event: string, callback: (arg: unknown) => void) {
          if (!listeners.has(event)) listeners.set(event, new Set());
          listeners.get(event)!.add(callback);
          return provider;
        },
        removeListener(event: string, callback: (arg: unknown) => void) {
          listeners.get(event)?.delete(callback);
          return provider;
        },
        async request({
          method,
          params,
        }: {
          method: string;
          params?: [{ chainId: string }];
        }) {
          calls.push(method);
          persist();
          if (method === "eth_accounts") {
            if (silentUnavailable)
              throw Object.assign(new Error("Wallet unavailable"), {
                code: 4900,
              });
            return authorized ? [current] : [];
          }
          if (method === "eth_chainId") return network;
          if (
            method === "wallet_requestPermissions" ||
            method === "eth_requestAccounts"
          ) {
            if (delay)
              await new Promise((resolve) => setTimeout(resolve, delay));
            if (reject)
              throw Object.assign(new Error("User rejected request"), {
                code: 4001,
              });
            authorized = true;
            persist();
            return method === "eth_requestAccounts"
              ? [current]
              : [
                  {
                    parentCapability: "eth_accounts",
                    caveats: [
                      { type: "restrictReturnedAccounts", value: [current] },
                    ],
                  },
                ];
          }
          if (method === "wallet_getPermissions")
            return authorized ? [{ parentCapability: "eth_accounts" }] : [];
          if (method === "wallet_revokePermissions") {
            if (revokeUnsupported)
              throw Object.assign(new Error("Method unsupported"), {
                code: 4200,
              });
            authorized = false;
            persist();
            return null;
          }
          if (method === "wallet_switchEthereumChain") {
            if (rejectSwitch)
              throw Object.assign(new Error("User rejected switch"), {
                code: 4001,
              });
            network = params![0].chainId;
            persist();
            emit("chainChanged", network);
            return null;
          }
          throw new Error(`Unexpected wallet request: ${method}`);
        },
      };
      Object.assign(window, {
        ethereum: provider,
        walletMock: {
          calls,
          setSilentUnavailable: (value: string) => {
            silentUnavailable = value === "true";
            persist();
          },
          changeAccount: () => {
            current = accountB;
            persist();
            emit("accountsChanged", [current]);
          },
          changeChain: (id: string) => {
            network = id;
            persist();
            emit("chainChanged", id);
          },
          disconnect: () => {
            authorized = false;
            persist();
            emit("accountsChanged", []);
          },
        },
      });
    },
    {
      chain,
      reject,
      rejectSwitch,
      delay,
      revokeUnsupported,
      accountA,
      accountB,
    },
  );
}
export async function walletCalls(page: Page): Promise<string[]> {
  return page.evaluate(
    () =>
      (window as unknown as { walletMock: { calls: string[] } }).walletMock
        .calls,
  );
}
export async function walletEvent(
  page: Page,
  method:
    | "changeAccount"
    | "disconnect"
    | "changeChain"
    | "setSilentUnavailable",
  value = "",
) {
  await page.evaluate(
    ({ method, value }) =>
      (
        window as unknown as {
          walletMock: Record<string, (value: string) => void>;
        }
      ).walletMock[method](value),
    { method, value },
  );
}
