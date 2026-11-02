import { getAddress, isAddress, zeroAddress } from "viem";
import { sepolia } from "wagmi/chains";

export function readConfiguration(address = "", rpc = "") {
  const validAddress =
    isAddress(address, { strict: true }) &&
    address.toLowerCase() !== zeroAddress;
  const rpcUrl = rpc || "https://ethereum-sepolia-rpc.publicnode.com";
  let error: string | undefined;
  try {
    const url = new URL(rpcUrl);
    if (
      url.username ||
      url.password ||
      (url.protocol !== "https:" &&
        !(
          url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname)
        ))
    ) {
      throw new Error("Unsupported RPC URL");
    }
  } catch {
    error =
      "Invalid public RPC URL. Use HTTPS, or HTTP on localhost for verification.";
  }
  return {
    mode: validAddress ? ("live" as const) : ("demo" as const),
    address: validAddress ? getAddress(address) : undefined,
    rpcUrl,
    chainId: sepolia.id,
    error: validAddress ? error : undefined,
    demoReason: address
      ? "No valid contract address is configured. Showing samples."
      : "No contract is configured or deployed by this application. Showing samples.",
  };
}
export const contractConfig = readConfiguration(
  import.meta.env.VITE_CROWDFUND_CONTRACT_ADDRESS?.trim(),
  import.meta.env.VITE_SEPOLIA_RPC_URL?.trim(),
);
