import type { Page } from "@playwright/test";
import {
  decodeFunctionData,
  encodeFunctionResult,
  encodeAbiParameters,
  encodeEventTopics,
  encodeErrorResult,
  multicall3Abi,
  parseEther,
  toHex,
  type Hex,
  type Address,
} from "viem";
import { crowdfundingAbi as abi } from "../src/blockchain/abi";
import { accountA, accountB, mockWallet } from "./mocks";

export const contract = "0x1111111111111111111111111111111111111111" as Address;
export const txHash = `0x${"ab".repeat(32)}` as Hex;
const blockHash = `0x${"cd".repeat(32)}` as Hex;
const zeroHash = `0x${"00".repeat(32)}` as Hex;
export function rpcBlock(number: bigint, timestamp: bigint) {
  return {
    number: toHex(number),
    hash: blockHash,
    parentHash: zeroHash,
    timestamp: toHex(timestamp),
    nonce: "0x0000000000000000",
    sha3Uncles: zeroHash,
    logsBloom: `0x${"00".repeat(256)}`,
    transactionsRoot: zeroHash,
    stateRoot: zeroHash,
    receiptsRoot: zeroHash,
    miner: accountA,
    difficulty: "0x0",
    totalDifficulty: "0x0",
    extraData: "0x",
    size: "0x100",
    gasLimit: "0x1c9c380",
    gasUsed: "0x10000",
    baseFeePerGas: "0x1",
    uncles: [],
    transactions: [],
  };
}
export async function transactionFixture(
  page: Page,
  options: {
    status?: number;
    full?: boolean;
    creator?: Address;
    withdrawn?: boolean;
    contribution?: bigint;
    expired?: boolean;
    chain?: string;
  } = {},
) {
  const state = {
    status: options.status ?? 0,
    raised: options.full ? parseEther("2") : parseEther("1"),
    goal: parseEther("2"),
    withdrawn: options.withdrawn ?? false,
    creator: options.creator ?? (accountA as Address),
    contributionA: options.contribution ?? parseEther("0.25"),
    contributionB: parseEther("0.75"),
    count: 1n,
    block: 256n,
    now: BigInt(Math.floor(Date.now() / 1000)),
    deadline:
      BigInt(Math.floor(Date.now() / 1000)) + (options.expired ? -1n : 86400n),
    submitted: [] as { from: Address; to: Address; data: Hex; value?: Hex }[],
    mined: false,
    reverted: false,
    applied: false,
    receiptUnavailable: false,
    refreshFails: false,
    refreshDelay: 0,
    contractUnavailable: false,
    signatureDelay: 0,
    reject: false,
    insufficient: false,
    customRevert: false,
    eventMode: "matching" as "matching" | "missing" | "foreign",
    createdTitle: "",
    createdDescription: "",
    createdGoal: 0n,
    reads: [] as string[],
    receiptReads: 0,
  };
  const mine = () => {
    state.mined = true;
    state.block++;
  };
  await mockWallet(page, { chain: options.chain });
  await page.exposeFunction(
    "testSendTransaction",
    async (transaction: (typeof state.submitted)[number]) => {
      state.submitted.push(transaction);
      state.mined = false;
      state.applied = false;
      if (state.signatureDelay)
        await new Promise((resolve) =>
          setTimeout(resolve, state.signatureDelay),
        );
      if (state.reject)
        return { error: { code: 4001, message: "User rejected request" } };
      if (state.insufficient)
        return {
          error: {
            code: -32000,
            message: "insufficient funds for gas * price + value",
          },
        };
      if (state.customRevert)
        return {
          error: {
            code: 3,
            message: "execution reverted",
            data: encodeErrorResult({ abi, errorName: "FundingGoalExceeded" }),
          },
        };
      return { hash: txHash };
    },
  );
  function apply() {
    if (!state.mined || state.applied || state.reverted) return;
    const sent = state.submitted.at(-1)!;
    const decoded = decodeFunctionData({ abi, data: sent.data });
    switch (decoded.functionName) {
      case "createCampaign":
        state.count++;
        state.createdTitle = decoded.args[0];
        state.createdDescription = decoded.args[1];
        state.createdGoal = decoded.args[2];
        break;
      case "contribute": {
        const value = BigInt(sent.value || "0x0");
        state.raised += value;
        if (sent.from.toLowerCase() === accountA) state.contributionA += value;
        else state.contributionB += value;
        break;
      }
      case "withdrawFunds":
        state.withdrawn = true;
        break;
      case "claimRefund":
        if (sent.from.toLowerCase() === accountA) state.contributionA = 0n;
        else state.contributionB = 0n;
        break;
      case "cancelCampaign":
        state.status = 3;
        break;
    }
    state.applied = true;
  }
  function call(data: Hex): Hex {
    const decoded = decodeFunctionData({ abi, data });
    state.reads.push(decoded.functionName);
    if (state.contractUnavailable || (state.applied && state.refreshFails))
      throw new Error("Post-receipt RPC unavailable");
    switch (decoded.functionName) {
      case "campaignCount":
        return encodeFunctionResult({
          abi,
          functionName: "campaignCount",
          result: state.count,
        });
      case "getCampaign": {
        const id = decoded.args[0];
        if (id > state.count) throw new Error("InvalidCampaign");
        return encodeFunctionResult({
          abi,
          functionName: "getCampaign",
          result: [
            {
              creator: state.creator,
              title:
                id === 1n ? "Confirmed community project" : state.createdTitle,
              description:
                id === 1n
                  ? "A contract-backed community idea."
                  : state.createdDescription,
              goal: id === 1n ? state.goal : state.createdGoal,
              amountRaised: id === 1n ? state.raised : 0n,
              deadline: state.deadline,
              cancelled: state.status === 3,
              withdrawn: state.withdrawn,
            },
            state.status,
          ],
        });
      }
      case "getCampaignStatus":
        return encodeFunctionResult({
          abi,
          functionName: "getCampaignStatus",
          result: state.status,
        });
      case "contributions":
        return encodeFunctionResult({
          abi,
          functionName: "contributions",
          result:
            decoded.args[1].toLowerCase() === accountA
              ? state.contributionA
              : state.contributionB,
        });
      default:
        throw new Error("Only reads are accepted by the public call path");
    }
  }
  function logs() {
    if (state.eventMode === "missing" || !state.createdTitle) return [];
    return [
      {
        address: state.eventMode === "foreign" ? accountB : contract,
        blockHash,
        blockNumber: toHex(state.block),
        transactionHash: txHash,
        transactionIndex: "0x0",
        logIndex: "0x0",
        removed: false,
        topics: encodeEventTopics({
          abi,
          eventName: "CampaignCreated",
          args: {
            campaignId: state.count,
            creator: state.submitted.at(-1)!.from,
          },
        }),
        data: encodeAbiParameters(
          [{ type: "uint256" }, { type: "uint256" }],
          [state.createdGoal, state.deadline],
        ),
      },
    ];
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
    const respond = async (request: {
      id: number;
      method: string;
      params: unknown[];
    }) => {
      try {
        let result: unknown;
        if (request.method === "eth_chainId") result = "0xaa36a7";
        else if (request.method === "eth_blockNumber")
          result = toHex(state.block);
        else if (request.method === "eth_getBlockByNumber")
          result = rpcBlock(state.block, state.now);
        else if (request.method === "eth_call") {
          apply();
          if (state.applied && state.refreshDelay)
            await new Promise((resolve) =>
              setTimeout(resolve, state.refreshDelay),
            );
          const { data } = request.params[0] as { data: Hex };
          if (data.startsWith("0x82ad56cb")) {
            const decoded = decodeFunctionData({ abi: multicall3Abi, data });
            if (decoded.functionName !== "aggregate3")
              throw new Error("Unexpected multicall");
            result = encodeFunctionResult({
              abi: multicall3Abi,
              functionName: "aggregate3",
              result: decoded.args[0].map((c) => ({
                success: true,
                returnData: call(c.callData),
              })),
            });
          } else result = call(data);
        } else if (request.method === "eth_getTransactionReceipt") {
          state.receiptReads++;
          if (state.receiptUnavailable)
            throw new Error("Receipt temporarily unavailable");
          apply();
          result = state.mined
            ? {
                transactionHash: txHash,
                transactionIndex: "0x0",
                blockHash,
                blockNumber: toHex(state.block),
                from: state.submitted.at(-1)?.from || accountA,
                to: contract,
                cumulativeGasUsed: "0x10000",
                gasUsed: "0x10000",
                effectiveGasPrice: "0x1",
                contractAddress: null,
                logs: logs(),
                logsBloom: `0x${"00".repeat(256)}`,
                status: state.reverted ? "0x0" : "0x1",
                type: "0x2",
              }
            : null;
        } else if (request.method === "eth_getTransactionByHash")
          result = {
            hash: txHash,
            from: accountA,
            to: contract,
            value: "0x0",
            input: state.submitted.at(-1)?.data || "0x",
            nonce: "0x0",
            gas: "0x10000",
            gasPrice: "0x1",
            blockHash: state.mined ? blockHash : null,
            blockNumber: state.mined ? toHex(state.block) : null,
            transactionIndex: state.mined ? "0x0" : null,
            type: "0x2",
            chainId: "0xaa36a7",
            v: "0x1",
            r: zeroHash,
            s: zeroHash,
            maxFeePerGas: "0x1",
            maxPriorityFeePerGas: "0x1",
            accessList: [],
          };
        else throw new Error(`Unexpected public RPC ${request.method}`);
        return { jsonrpc: "2.0", id: request.id, result };
      } catch (error) {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: { code: -32000, message: String(error) },
        };
      }
    };
    const payload = route.request().postDataJSON();
    await route.fulfill({
      json: Array.isArray(payload)
        ? await Promise.all(payload.map(respond))
        : await respond(payload),
      headers: { "access-control-allow-origin": "*" },
    });
  });
  return { state, mine };
}
