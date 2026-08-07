import { createConfig, http, fallback } from "wagmi";
import { bsc } from "wagmi/chains";
import { createStorage } from "wagmi";
import { createSessionStorageAdapter } from "@/lib/web3/session-storage";
import { botChain, PRESALE_NETWORKS } from "@/lib/constants/presale-networks";

export const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

const bscNetwork = PRESALE_NETWORKS.bsc;
const botNetwork = PRESALE_NETWORKS.bot;

export const config = createConfig({
  chains: [bsc, botChain],
  ssr: false,
  storage: createStorage({
    storage: createSessionStorageAdapter(),
  }),
  transports: {
    [bsc.id]: fallback([
      http(bscNetwork.rpcUrl),
      http("https://bsc-dataseed1.binance.org"),
      http("https://bsc-dataseed2.binance.org"),
    ]),
    [botChain.id]: fallback([
      http(botNetwork.rpcUrl),
      http("https://rpc.botchain.ai"),
    ]),
  },
});

export { bsc, botChain };
