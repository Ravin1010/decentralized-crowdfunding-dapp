import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { sepolia } from "wagmi/chains";
import { contractConfig } from "./config";

export const walletConfig = createConfig({
  chains: [sepolia],
  connectors: [injected({ target: "metaMask" })],
  transports: {
    [sepolia.id]: http(
      contractConfig.error ? undefined : contractConfig.rpcUrl,
    ),
  },
  // Discovery never requests accounts; connection is initiated only by the button.
  multiInjectedProviderDiscovery: false,
});
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});
export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={walletConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
