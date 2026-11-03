import { describe, expect, it } from "vitest";
import {
  encodeAbiParameters,
  encodeErrorResult,
  encodeEventTopics,
  ContractFunctionRevertedError,
  type TransactionReceipt,
  type Address,
} from "viem";
import { crowdfundingAbi as abi } from "./abi";
import {
  affectsQuery,
  createdCampaignId,
  parseDays,
  parsePositiveEth,
  submissionError,
  type Submission,
} from "./transaction-model";
const address = "0x1111111111111111111111111111111111111111" as Address;
const wallet = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Address;
const context: Submission = {
  account: wallet,
  chainId: 11155111,
  contract: address,
  operation: {
    kind: "createCampaign",
    title: "Title",
    description: "Description",
    goal: 20n,
    duration: 86400n,
  },
};
function createdLog(contract = address, creator = wallet) {
  return {
    address: contract,
    data: encodeAbiParameters(
      [{ type: "uint256" }, { type: "uint256" }],
      [20n, 1900000000n],
    ),
    topics: encodeEventTopics({
      abi,
      eventName: "CampaignCreated",
      args: { campaignId: 9n, creator },
    }),
  } as TransactionReceipt["logs"][number];
}
describe("validated transaction amounts", () => {
  it("parses exact wei and integer day conversion", () => {
    expect(parsePositiveEth("0.000000000000000001")).toBe(1n);
    expect(parsePositiveEth("1.000000000000000001")).toBe(1000000000000000001n);
    expect(parseDays("30")).toBe(2592000n);
  });
  it.each([
    "0",
    "-1",
    "1e-3",
    "0.0000000000000000001",
    "NaN",
    "",
    (2n ** 256n).toString(),
  ])("rejects invalid ETH %s", (value) =>
    expect(() => parsePositiveEth(value)).toThrow(),
  );
  it.each(["0", "31", "1.5", "-1", "abc"])(
    "rejects invalid duration %s",
    (value) => expect(() => parseDays(value)).toThrow(),
  );
});
describe("confirmed creation receipt identity", () => {
  it("extracts the matching event ID, not campaignCount", () =>
    expect(createdCampaignId({ logs: [createdLog()] }, context)).toBe(9n));
  it("ignores events from another contract", () =>
    expect(
      createdCampaignId({ logs: [createdLog(wallet)] }, context),
    ).toBeUndefined());
  it("ignores events for another creator", () =>
    expect(
      createdCampaignId({ logs: [createdLog(address, address)] }, context),
    ).toBeUndefined());
  it("does not guess missing or ambiguous IDs", () => {
    expect(createdCampaignId({ logs: [] }, context)).toBeUndefined();
    expect(
      createdCampaignId({ logs: [createdLog(), createdLog()] }, context),
    ).toBeUndefined();
  });
  it("does not decode an event as a different operation", () =>
    expect(
      createdCampaignId(
        { logs: [createdLog()] },
        {
          ...context,
          operation: { kind: "contribute", campaignId: 1n, value: 1n },
        },
      ),
    ).toBeUndefined());
});
describe("targeted authoritative reconciliation", () => {
  const query = (
    functionName: string,
    args: unknown[] = [],
    chainId = context.chainId,
    contract = address,
  ) =>
    [
      "readContract",
      { address: contract, chainId, functionName, args },
    ] as const;
  const contribution: Submission = {
    ...context,
    operation: { kind: "contribute", campaignId: 1n, value: 1n },
  };
  it("refreshes only the original wallet contribution", () => {
    expect(
      affectsQuery(query("contributions", [1n, wallet]), contribution),
    ).toBe(true);
    expect(
      affectsQuery(query("contributions", [1n, address]), contribution),
    ).toBe(false);
  });
  it("isolates contract, campaign and chain", () => {
    expect(affectsQuery(query("getCampaign", [1n]), contribution)).toBe(true);
    expect(affectsQuery(query("getCampaign", [2n]), contribution)).toBe(false);
    expect(affectsQuery(query("getCampaign", [1n], 1), contribution)).toBe(
      false,
    );
    expect(
      affectsQuery(
        query("getCampaign", [1n], context.chainId, wallet),
        contribution,
      ),
    ).toBe(false);
  });
  it("refreshes count/new ID for create but not unrelated queries", () => {
    expect(affectsQuery(query("campaignCount"), context, 9n)).toBe(true);
    expect(affectsQuery(query("getCampaign", [9n]), context, 9n)).toBe(true);
    expect(affectsQuery(query("getCampaign", [1n]), context, 9n)).toBe(false);
    expect(affectsQuery(["public-rpc-chain", 11155111], context)).toBe(false);
  });
  it("refreshes affected list queries for contribution and cancellation", () => {
    const list = [
      "readContracts",
      {
        contracts: [
          {
            address,
            chainId: context.chainId,
            functionName: "getCampaign",
            args: [1n],
          },
        ],
      },
    ];
    expect(affectsQuery(list, contribution)).toBe(true);
    expect(
      affectsQuery(list, {
        ...context,
        operation: { kind: "cancelCampaign", campaignId: 1n },
      }),
    ).toBe(true);
    expect(
      affectsQuery(list, {
        ...context,
        operation: { kind: "withdrawFunds", campaignId: 1n },
      }),
    ).toBe(false);
  });
  it.each(["withdrawFunds", "claimRefund", "cancelCampaign"] as const)(
    "refreshes campaign detail for %s",
    (kind) =>
      expect(
        affectsQuery(query("getCampaign", [1n]), {
          ...context,
          operation: { kind, campaignId: 1n },
        }),
      ).toBe(true),
  );
});
describe("neutral and decoded failure feedback", () => {
  it("recognizes nested wallet rejection", () =>
    expect(submissionError({ cause: { code: 4001 } }).phase).toBe("rejected"));
  it("decodes a known custom revert", () => {
    const error = new ContractFunctionRevertedError({
      abi,
      functionName: "contribute",
      data: encodeErrorResult({ abi, errorName: "FundingGoalExceeded" }),
    });
    expect(submissionError(error).phase).toBe("reverted");
    expect(
      submissionError({
        data: {
          originalError: {
            code: 3,
            data: encodeErrorResult({ abi, errorName: "FundingGoalExceeded" }),
          },
        },
      }).message,
    ).toContain("latest remaining goal");
  });
  it("describes insufficient funds without a false confirmation", () =>
    expect(
      submissionError({ name: "InsufficientFundsError" }).message,
    ).toContain("network gas"));
  it("exposes exactly five writes and their real payable type", () => {
    expect(
      abi
        .filter(
          (entry) =>
            entry.type === "function" && entry.stateMutability !== "view",
        )
        .map((entry) => entry.name)
        .sort(),
    ).toEqual([
      "cancelCampaign",
      "claimRefund",
      "contribute",
      "createCampaign",
      "withdrawFunds",
    ]);
    expect(
      abi.find(
        (entry) => entry.type === "function" && entry.name === "contribute",
      ),
    ).toMatchObject({ stateMutability: "payable" });
  });
});
