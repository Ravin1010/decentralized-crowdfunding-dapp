import { useState } from "react";
import {
  useConnection,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { WalletIcon } from "./Icons";

export const shortAddress = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;
export function Wallet() {
  const { address, chainId, isConnected } = useConnection();
  const { connectors, connectAsync, isPending, error, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const {
    switchChain,
    isPending: switching,
    error: switchError,
  } = useSwitchChain();
  const [unavailable, setUnavailable] = useState(false);
  async function connect() {
    reset();
    const connector = connectors[0];
    try {
      if (!connector || !(await connector.getProvider())) {
        setUnavailable(true);
        return;
      }
    } catch {
      setUnavailable(true);
      return;
    }
    setUnavailable(false);
    try {
      await connectAsync({ connector });
    } catch {
      /* Mutation error is shown below. */
    }
  }
  return (
    <div className="wallet-control">
      {isConnected && address ? (
        <>
          <span className="wallet-address">
            <code>{shortAddress(address)}</code> ·{" "}
            {chainId === sepolia.id ? "Sepolia" : "Wrong network"}
          </span>
          {chainId !== sepolia.id && (
            <button
              className="button wallet-button"
              disabled={switching}
              onClick={() => switchChain({ chainId: sepolia.id })}
            >
              {switching ? "Switching…" : "Switch to Sepolia"}
            </button>
          )}
          <button className="button wallet-button" onClick={() => disconnect()}>
            Disconnect
          </button>
        </>
      ) : (
        <button
          className="button wallet-button"
          disabled={isPending}
          onClick={() => void connect()}
        >
          <WalletIcon /> {isPending ? "Connecting…" : "Connect Wallet"}
        </button>
      )}
      {unavailable && (
        <p role="status">
          MetaMask is unavailable. Install or enable the extension. Public
          browsing stays open.
        </p>
      )}
      {error && !isConnected && (
        <p role="alert">
          Connection rejected or could not be completed. Try again when ready.
        </p>
      )}
      {switchError && isConnected && chainId !== sepolia.id && (
        <p role="alert">
          Network switch rejected or unavailable. Public browsing remains on
          Sepolia.
        </p>
      )}
      {isConnected && chainId !== sepolia.id && (
        <p role="status">
          Wrong network. Switch explicitly to use wallet-specific reads.
        </p>
      )}
    </div>
  );
}
