import {
  BaseError,
  ContractFunctionRevertedError,
  decodeEventLog,
  decodeErrorResult,
  parseEther,
  type Address,
  type Hash,
  type TransactionReceipt,
} from "viem";
import { crowdfundingAbi } from "./abi";

export type Operation =
  | {
      kind: "createCampaign";
      title: string;
      description: string;
      goal: bigint;
      duration: bigint;
    }
  | { kind: "contribute"; campaignId: bigint; value: bigint }
  | {
      kind: "withdrawFunds" | "claimRefund" | "cancelCampaign";
      campaignId: bigint;
    };
export type Submission = {
  account: Address;
  chainId: number;
  contract: Address;
  operation: Operation;
  hash?: Hash;
};
export type Phase =
  | "idle"
  | "awaiting_signature"
  | "pending_confirmation"
  | "confirmed"
  | "rejected"
  | "reverted"
  | "error";
export type TransactionState = {
  phase: Phase;
  context?: Submission;
  message?: string;
  createdId?: bigint;
  eventMissing?: boolean;
  refreshed?: boolean;
  refreshing?: boolean;
};

export function parsePositiveEth(value: string): bigint {
  if (!/^\d+(\.\d{1,18})?$/.test(value))
    throw new Error(
      "Enter a positive ETH amount with at most 18 decimal places.",
    );
  const wei = parseEther(value);
  if (wei <= 0n || wei >= 2n ** 256n)
    throw new Error("Enter a positive ETH amount within the contract limit.");
  return wei;
}
export function parseDays(value: string): bigint {
  if (!/^\d+$/.test(value) || BigInt(value) < 1n || BigInt(value) > 30n)
    throw new Error("Choose 1–30 whole days.");
  return BigInt(value) * 86400n;
}
export function createdCampaignId(
  receipt: Pick<TransactionReceipt, "logs">,
  context: Submission,
): bigint | undefined {
  const found: bigint[] = [];
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== context.contract.toLowerCase()) continue;
    try {
      const event = decodeEventLog({
        abi: crowdfundingAbi,
        eventName: "CampaignCreated",
        data: log.data,
        topics: log.topics,
      });
      if (
        event.args.creator.toLowerCase() === context.account.toLowerCase() &&
        event.args.campaignId > 0n &&
        context.operation.kind === "createCampaign" &&
        event.args.goal === context.operation.goal
      )
        found.push(event.args.campaignId);
    } catch {
      /* Other/malformed events cannot identify the new campaign. */
    }
  }
  return found.length === 1 ? found[0] : undefined;
}
const reasons: Record<string, string> = {
  InvalidCampaign: "This campaign does not exist.",
  CampaignNotActive:
    "The campaign is no longer Active. Refresh its latest state.",
  FundingGoalExceeded:
    "The amount exceeds the latest remaining goal. Refresh before trying again.",
  NotCreator: "Only the campaign creator can perform this action.",
  CampaignNotSuccessful: "This campaign is not eligible for withdrawal.",
  AlreadyWithdrawn: "Funds have already been withdrawn.",
  RefundUnavailable: "This campaign is not eligible for refunds.",
  NoContribution: "This wallet has no recorded contribution to refund.",
  TransferFailed: "The receiving wallet could not accept ETH.",
  EmptyTitle: "Enter a campaign title.",
  EmptyDescription: "Enter a campaign description.",
  InvalidGoal: "Enter a positive funding goal.",
  InvalidDuration: "Campaign duration is outside the allowed range.",
  ZeroContribution: "Enter a positive contribution.",
};
export function submissionError(error: unknown): {
  phase: "rejected" | "reverted" | "error";
  message: string;
} {
  const nodes: object[] = [];
  const queue: unknown[] = [error];
  const seen = new Set<object>();
  // MetaMask may wrap the original RPC error under data.originalError.
  while (queue.length && nodes.length < 32) {
    const node = queue.shift();
    if (!node || typeof node !== "object" || seen.has(node)) continue;
    seen.add(node);
    nodes.push(node);
    for (const key of ["cause", "data", "originalError", "error"]) {
      if (key in node) queue.push((node as Record<string, unknown>)[key]);
    }
  }
  if (
    nodes.some(
      (e) =>
        typeof e === "object" &&
        e &&
        (("code" in e && e.code === 4001) ||
          ("name" in e && e.name === "UserRejectedRequestError")),
    )
  )
    return {
      phase: "rejected",
      message:
        "Transaction request cancelled in your wallet. No financial values were changed.",
    };
  for (const node of nodes) {
    if (
      node &&
      typeof node === "object" &&
      "data" in node &&
      typeof node.data === "string" &&
      node.data.startsWith("0x")
    ) {
      try {
        const decoded = decodeErrorResult({
          abi: crowdfundingAbi,
          data: node.data as `0x${string}`,
        });
        return {
          phase: "reverted",
          message:
            reasons[decoded.errorName] ||
            "The contract rejected this transaction.",
        };
      } catch {
        /* Not a decodable contract error. */
      }
    }
  }
  const revert =
    error instanceof BaseError
      ? error.walk((e) => e instanceof ContractFunctionRevertedError)
      : undefined;
  if (revert instanceof ContractFunctionRevertedError)
    return {
      phase: "reverted",
      message:
        reasons[revert.data?.errorName || ""] ||
        "The contract rejected this transaction. Refresh its latest state before trying again.",
    };
  if (
    nodes.some(
      (e) =>
        typeof e === "object" &&
        e &&
        "name" in e &&
        (e.name === "InsufficientFundsError" ||
          ("message" in e &&
            typeof e.message === "string" &&
            /insufficient funds|insufficient balance/i.test(e.message))),
    )
  )
    return {
      phase: "error",
      message: "You need sufficient ETH for the amount and network gas.",
    };
  return {
    phase: "error",
    message:
      error instanceof Error && !(error instanceof BaseError)
        ? error.message
        : "The transaction request could not be completed. Check your wallet and connection.",
  };
}
// Match only this deployment's affected wagmi queries, never every cached query.
export function affectsQuery(
  key: readonly unknown[],
  context: Submission,
  createdId?: bigint,
): boolean {
  const [kind, parameters] = key;
  if (!parameters || typeof parameters !== "object") return false;
  const p = parameters as {
    address?: string;
    chainId?: number;
    functionName?: string;
    args?: readonly unknown[];
    contracts?: {
      address?: string;
      chainId?: number;
      functionName?: string;
      args?: readonly unknown[];
    }[];
  };
  const op = context.operation;
  const matches = (r: typeof p) =>
    r.address?.toLowerCase() === context.contract.toLowerCase() &&
    r.chainId === context.chainId;
  const id = op.kind === "createCampaign" ? createdId : op.campaignId;
  if (kind === "readContracts")
    return (
      ["createCampaign", "contribute", "cancelCampaign"].includes(op.kind) &&
      !!p.contracts?.some(
        (r) =>
          matches(r) &&
          r.functionName === "getCampaign" &&
          (op.kind === "createCampaign" || r.args?.[0] === id),
      )
    );
  if (kind !== "readContract" || !matches(p)) return false;
  if (p.functionName === "campaignCount") return op.kind === "createCampaign";
  if (
    p.functionName === "getCampaign" ||
    p.functionName === "getCampaignStatus"
  )
    return p.args?.[0] === id;
  return (
    p.functionName === "contributions" &&
    ["contribute", "claimRefund"].includes(op.kind) &&
    p.args?.[0] === id &&
    typeof p.args?.[1] === "string" &&
    p.args[1].toLowerCase() === context.account.toLowerCase()
  );
}
