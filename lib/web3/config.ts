import { createConfig, http } from "wagmi";
import { bsc } from "wagmi/chains";
import { cookieStorage, createStorage } from "wagmi";

export const privyAppId =
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

export const config = createConfig({
  chains: [bsc],

  ssr: false,

  storage: createStorage({
    storage: cookieStorage,
  }),

  transports: {
    [bsc.id]: http(),
  },
});
