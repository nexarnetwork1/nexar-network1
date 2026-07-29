import { createConfig, http, fallback } from "wagmi";
import { bsc } from "wagmi/chains";
import { createStorage } from "wagmi";
import { createSessionStorageAdapter } from "@/lib/web3/session-storage";

export const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

const bscRpcUrl =
  process.env.NEXT_PUBLIC_BSC_RPC_URL ?? "https://bsc-dataseed.binance.org";

export const config = createConfig({
  chains: [bsc],
  ssr: false,
  storage: createStorage({
    storage: createSessionStorageAdapter(),
  }),
  transports: {
    [bsc.id]: fallback([
      http(bscRpcUrl),
      http("https://bsc-dataseed1.binance.org"),
      http("https://bsc-dataseed2.binance.org"),
    ]),
  },
});
