import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useConfig, usePublicClient } from "wagmi";
import { getConnection, getWalletClient } from "wagmi/actions";
import { hashFn, readContractQueryOptions } from "wagmi/query";
import { encodeFunctionData, toHex, type Hash } from "viem";
import { crowdfundingAbi } from "./abi";
import { contractConfig as deployment } from "./config";
import {
  affectsQuery,
  createdCampaignId,
  submissionError,
  type Operation,
  type Submission,
  type TransactionState,
} from "./transaction-model";

export function useCrowdfundingTransaction() {
  const config = useConfig();
  const client = usePublicClient({ chainId: deployment.chainId });
  const queries = useQueryClient();
  const [state, setState] = useState<TransactionState>({ phase: "idle" });
  const locked = useRef(false);
  const checking = useRef(false);
  const confirmed = useRef<TransactionState | undefined>(undefined);

  async function refresh(context: Submission, id?: bigint) {
    const predicate = (q: { queryKey: readonly unknown[] }) =>
      affectsQuery(q.queryKey, context, id);
    // Cancel older in-flight reads before loading the authoritative post-receipt state.
    await queries.cancelQueries({ predicate });
    await queries.invalidateQueries({ predicate, refetchType: "none" });
    await queries.refetchQueries(
      { predicate, type: "active" },
      { throwOnError: true },
    );
    if (context.operation.kind === "createCampaign") {
      await queries.fetchQuery({
        ...readContractQueryOptions(config, {
          address: context.contract,
          chainId: context.chainId,
          abi: crowdfundingAbi,
          functionName: "campaignCount",
        }),
        staleTime: 0,
        queryKeyHashFn: hashFn,
      });
      if (id)
        await queries.fetchQuery({
          ...readContractQueryOptions(config, {
            address: context.contract,
            chainId: context.chainId,
            abi: crowdfundingAbi,
            functionName: "getCampaign",
            args: [id],
          }),
          staleTime: 0,
          queryKeyHashFn: hashFn,
        });
    }
  }
  async function refreshConfirmed(snapshot = confirmed.current) {
    if (!snapshot?.context || checking.current) return;
    checking.current = true;
    setState({ ...snapshot, refreshing: true });
    try {
      await refresh(snapshot.context, snapshot.createdId);
      confirmed.current = { ...snapshot, refreshed: true, refreshing: false };
    } catch {
      confirmed.current = { ...snapshot, refreshed: false, refreshing: false };
    } finally {
      setState(confirmed.current!);
      checking.current = false;
    }
  }
  async function observe(context: Submission & { hash: Hash }) {
    if (!client || checking.current) return;
    checking.current = true;
    setState({ phase: "pending_confirmation", context });
    try {
      const receipt = await client.waitForTransactionReceipt({
        hash: context.hash,
        confirmations: 1,
        timeout: 30_000,
        pollingInterval: 1000,
      });
      if (
        receipt.transactionHash.toLowerCase() !== context.hash.toLowerCase()
      ) {
        setState({
          phase: "pending_confirmation",
          context,
          message:
            "The transaction was replaced. Review its wallet or explorer history; this page has not confirmed the original crowdfunding action.",
        });
        return;
      }
      if (receipt.status !== "success") {
        setState({
          phase: "reverted",
          context,
          message:
            "The confirmed receipt reports a revert. No successful funding action occurred.",
        });
        locked.current = false;
        return;
      }
      const createdId =
        context.operation.kind === "createCampaign"
          ? createdCampaignId(receipt, context)
          : undefined;
      const snapshot: TransactionState = {
        phase: "confirmed",
        context,
        createdId,
        eventMissing: context.operation.kind === "createCampaign" && !createdId,
        refreshed: false,
      };
      confirmed.current = snapshot;
      setState(snapshot);
      checking.current = false;
      await refreshConfirmed(snapshot);
    } catch {
      // A hash exists: receipt timeout/RPC loss is unresolved, never a failed send.
      setState({
        phase: "pending_confirmation",
        context,
        message:
          "Confirmation is not yet available. Check again without resubmitting the transaction.",
      });
    } finally {
      checking.current = false;
    }
  }
  async function submit(operation: Operation) {
    if (locked.current) return;
    locked.current = true;
    let context: Submission | undefined;
    try {
      if (
        deployment.mode !== "live" ||
        !deployment.address ||
        deployment.error ||
        !client
      )
        throw new Error(
          "A valid live Sepolia contract and public RPC are required.",
        );
      const wallet = getConnection(config);
      if (wallet.status !== "connected" || !wallet.address)
        throw new Error(
          "Connect your wallet, then submit this action separately.",
        );
      if (wallet.chainId !== deployment.chainId)
        throw new Error(
          "Sepolia is required. Use the explicit Switch to Sepolia control first.",
        );
      context = {
        account: wallet.address,
        chainId: deployment.chainId,
        contract: deployment.address,
        operation,
      };
      setState({
        phase: "awaiting_signature",
        context,
        message: "Checking the latest contract state…",
      });
      if ((await client.getChainId()) !== context.chainId)
        throw new Error("The public RPC must serve Sepolia.");
      if (operation.kind !== "createCampaign") {
        const [campaign, status] = await client.readContract({
          address: context.contract,
          abi: crowdfundingAbi,
          functionName: "getCampaign",
          args: [operation.campaignId],
        });
        const block = await client.getBlock();
        if (
          operation.kind === "contribute" ||
          operation.kind === "cancelCampaign"
        ) {
          if (status !== 0 || block.timestamp >= campaign.deadline)
            throw new Error(
              "The campaign is no longer Active before its deadline. Refresh before trying again.",
            );
        }
        if (
          operation.kind === "contribute" &&
          (operation.value <= 0n ||
            operation.value > campaign.goal - campaign.amountRaised)
        )
          throw new Error(
            "Enter a positive contribution no greater than the latest remaining goal.",
          );
        if (
          ["withdrawFunds", "cancelCampaign"].includes(operation.kind) &&
          campaign.creator.toLowerCase() !== context.account.toLowerCase()
        )
          throw new Error("Only the campaign creator can perform this action.");
        if (
          operation.kind === "withdrawFunds" &&
          (status !== 1 || campaign.withdrawn)
        )
          throw new Error("This campaign is not eligible for withdrawal.");
        if (operation.kind === "claimRefund") {
          if (status !== 2 && status !== 3)
            throw new Error("Refunds require a Failed or Cancelled campaign.");
          const amount = await client.readContract({
            address: context.contract,
            abi: crowdfundingAbi,
            functionName: "contributions",
            args: [operation.campaignId, context.account],
          });
          if (amount === 0n)
            throw new Error(
              "This wallet has no recorded contribution to refund.",
            );
        }
      } else if (
        !operation.title.trim() ||
        !operation.description.trim() ||
        operation.goal <= 0n ||
        operation.duration < 60n ||
        operation.duration > 2592000n
      )
        throw new Error(
          "Check the campaign title, description, goal and duration.",
        );
      if (operation.kind === "createCampaign") {
        // Validate the configured deployment before asking the wallet to pay gas.
        // This count is never used to infer the newly created campaign ID.
        await client.readContract({
          address: context.contract,
          abi: crowdfundingAbi,
          functionName: "campaignCount",
        });
      }
      const current = getConnection(config);
      if (
        current.status !== "connected" ||
        current.address !== context.account ||
        current.chainId !== context.chainId
      )
        throw new Error(
          "Your wallet changed during validation. Review the action and submit again explicitly.",
        );
      setState({ phase: "awaiting_signature", context });
      // Use one standard wallet request, with transport retries disabled. viem's
      // convenience send can fall back to a second wallet namespace after -32000.
      let data: `0x${string}`;
      switch (operation.kind) {
        case "createCampaign":
          data = encodeFunctionData({
            abi: crowdfundingAbi,
            functionName: "createCampaign",
            args: [
              operation.title,
              operation.description,
              operation.goal,
              operation.duration,
            ],
          });
          break;
        case "contribute":
          data = encodeFunctionData({
            abi: crowdfundingAbi,
            functionName: "contribute",
            args: [operation.campaignId],
          });
          break;
        case "withdrawFunds":
          data = encodeFunctionData({
            abi: crowdfundingAbi,
            functionName: "withdrawFunds",
            args: [operation.campaignId],
          });
          break;
        case "claimRefund":
          data = encodeFunctionData({
            abi: crowdfundingAbi,
            functionName: "claimRefund",
            args: [operation.campaignId],
          });
          break;
        case "cancelCampaign":
          data = encodeFunctionData({
            abi: crowdfundingAbi,
            functionName: "cancelCampaign",
            args: [operation.campaignId],
          });
          break;
      }
      const walletClient = await getWalletClient(config, {
        account: context.account,
        chainId: context.chainId,
      });
      if ((await walletClient.getChainId()) !== context.chainId)
        throw new Error(
          "Your wallet changed networks. Switch explicitly to Sepolia before submitting.",
        );
      const hash = await walletClient.request(
        {
          method: "eth_sendTransaction",
          params: [
            {
              from: context.account,
              to: context.contract,
              chainId: toHex(context.chainId),
              data,
              ...(operation.kind === "contribute"
                ? { value: toHex(operation.value) }
                : {}),
            },
          ],
        },
        { retryCount: 0 },
      );
      await observe({ ...context, hash });
    } catch (error) {
      setState({ ...submissionError(error), context });
      locked.current = false;
    }
  }
  return {
    state,
    submit,
    busy:
      state.phase === "awaiting_signature" ||
      state.phase === "pending_confirmation" ||
      state.phase === "confirmed",
    retryRefresh: () => refreshConfirmed(),
    checkConfirmation: () =>
      state.context?.hash &&
      observe({ ...state.context, hash: state.context.hash }),
    reset: () => {
      if (state.phase === "confirmed" && state.refreshed) {
        confirmed.current = undefined;
        locked.current = false;
        setState({ phase: "idle" });
      }
    },
  };
}
