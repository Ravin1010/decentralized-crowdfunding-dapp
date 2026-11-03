import { useState } from "react";
import { useConnection } from "wagmi";
import { eth, remaining, type Campaign } from "./campaigns";
import { shortAddress } from "./Wallet";
import { contractConfig } from "./blockchain/config";
import { useContribution } from "./blockchain/reads";
import { useCrowdfundingTransaction } from "./blockchain/transactions";
import { parsePositiveEth } from "./blockchain/transaction-model";

type Transaction = ReturnType<typeof useCrowdfundingTransaction>;
export function TransactionFeedback({
  transaction: tx,
}: {
  transaction: Transaction;
}) {
  const state = tx.state;
  if (state.phase === "idle") return null;
  const failed = ["error", "reverted"].includes(state.phase);
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(
    contractConfig.rpcUrl,
  );
  return (
    <div className="transaction-feedback" role={failed ? "alert" : "status"}>
      <strong>
        {state.phase === "awaiting_signature"
          ? state.message || "Confirm this transaction in MetaMask."
          : state.phase === "pending_confirmation"
            ? "Transaction submitted. Waiting for confirmation."
            : state.phase === "confirmed"
              ? state.refreshing
                ? "Transaction confirmed. Loading the latest data…"
                : state.refreshed
                  ? "Transaction confirmed and latest data loaded."
                  : "Transaction confirmed, but the latest campaign data could not be loaded."
              : state.message}
      </strong>
      {state.phase === "pending_confirmation" && state.message && (
        <p>{state.message}</p>
      )}
      {state.phase === "pending_confirmation" && (
        <p className="small">
          Save this hash before leaving or reloading. This page does not retain
          pending transactions. Check your wallet or explorer history before
          submitting the same action again.
        </p>
      )}
      {state.context && (
        <p className="small">
          Submission wallet: <code>{shortAddress(state.context.account)}</code>{" "}
          · Sepolia
          {state.context.operation.kind !== "createCampaign" &&
            ` · Campaign #${state.context.operation.campaignId}`}
        </p>
      )}
      {state.context?.hash && (
        <p className="transaction-hash">
          <code>{state.context.hash}</code>
          {!local && (
            <a
              href={`https://sepolia.etherscan.io/tx/${state.context.hash}`}
              target="_blank"
              rel="noreferrer"
            >
              View on Sepolia Etherscan
            </a>
          )}
        </p>
      )}
      {state.phase === "confirmed" &&
        state.context?.operation.kind === "claimRefund" && (
          <p>
            {state.refreshing
              ? "Refund confirmed. Checking the latest contribution record…"
              : state.refreshed
                ? "Refund confirmed. Eligibility comes from your refreshed contribution record."
                : "Refund confirmed, but the latest contribution record could not be loaded."}
          </p>
        )}
      {state.eventMissing && (
        <p>
          The transaction succeeded, but a matching CampaignCreated event could
          not resolve the campaign ID. No ID has been guessed.
        </p>
      )}
      {state.phase === "confirmed" && !state.refreshed && !state.refreshing && (
        <button
          type="button"
          className="button"
          onClick={() => void tx.retryRefresh()}
        >
          Retry data refresh
        </button>
      )}
      {state.phase === "pending_confirmation" && state.message && (
        <button
          type="button"
          className="button"
          onClick={() => void tx.checkConfirmation()}
        >
          Check confirmation
        </button>
      )}
      {state.phase === "confirmed" && state.refreshed && state.createdId && (
        <a className="button primary" href={`/campaigns/${state.createdId}`}>
          View created campaign #{state.createdId.toString()}
        </a>
      )}
    </div>
  );
}
export function CampaignActions({ campaign: c }: { campaign: Campaign }) {
  const wallet = useConnection();
  const contribution = useContribution(BigInt(c.id));
  const tx = useCrowdfundingTransaction();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const ready =
    wallet.status === "connected" && wallet.chainId === contractConfig.chainId;
  const creator =
    ready && wallet.address?.toLowerCase() === c.creator.toLowerCase();
  const active = c.status === "Active";
  function contribute() {
    try {
      const value = parsePositiveEth(amount);
      if (value > remaining(c))
        throw new Error("Amount exceeds the remaining funding goal.");
      setError("");
      void tx.submit({ kind: "contribute", campaignId: BigInt(c.id), value });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Check the contribution amount.",
      );
    }
  }
  return (
    <div className="campaign-actions">
      {!ready && (
        <p className="small">
          {wallet.isConnected
            ? "Switch explicitly to Sepolia before submitting an action."
            : "Connect Wallet first, then submit your chosen action separately."}
        </p>
      )}
      {active && remaining(c) > 0n && (
        <div className="contribution-preview">
          <label htmlFor="contribution">Contribution amount (ETH)</label>
          <input
            id="contribution"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
            disabled={tx.busy}
            aria-describedby="contribution-help"
          />
          <p className="small" id="contribution-help">
            Maximum contribution: {eth(remaining(c))} ETH. Your exact amount is
            revalidated before submission.
          </p>
          <button
            className="button primary full-width"
            disabled={!ready || tx.busy}
            onClick={contribute}
          >
            Contribute ETH
          </button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {creator && c.status === "Successful" && !c.withdrawn && (
        <button
          className="button primary full-width"
          disabled={tx.busy}
          onClick={() =>
            void tx.submit({ kind: "withdrawFunds", campaignId: BigInt(c.id) })
          }
        >
          Withdraw Funds
        </button>
      )}
      {c.status === "Successful" && c.withdrawn && (
        <p role="status">Successfully withdrawn</p>
      )}
      {ready &&
        (c.status === "Failed" || c.status === "Cancelled") &&
        contribution.enabled &&
        !contribution.isError &&
        contribution.data !== undefined &&
        contribution.data > 0n && (
          <button
            className="button primary full-width"
            disabled={tx.busy}
            onClick={() =>
              void tx.submit({ kind: "claimRefund", campaignId: BigInt(c.id) })
            }
          >
            Claim Refund
          </button>
        )}
      {creator && active && (
        <>
          <button
            className="button full-width"
            disabled={tx.busy}
            onClick={() => setConfirmCancel(true)}
          >
            Cancel Campaign
          </button>
          {confirmCancel && (
            <div
              className="cancel-confirmation"
              role="group"
              aria-label="Confirm campaign cancellation"
            >
              <p>
                Cancellation makes recorded contributions individually
                refundable. Contributors must claim their own refunds.
              </p>
              <button
                className="button"
                disabled={tx.busy}
                onClick={() => {
                  setConfirmCancel(false);
                  void tx.submit({
                    kind: "cancelCampaign",
                    campaignId: BigInt(c.id),
                  });
                }}
              >
                Confirm cancellation
              </button>
              <button
                className="button"
                disabled={tx.busy}
                onClick={() => setConfirmCancel(false)}
              >
                Keep campaign
              </button>
            </div>
          )}
        </>
      )}
      <TransactionFeedback transaction={tx} />
      {tx.state.phase === "confirmed" && tx.state.refreshed && (
        <button
          className="button"
          onClick={() => {
            tx.reset();
            setAmount("");
          }}
        >
          Choose another action
        </button>
      )}
    </div>
  );
}
