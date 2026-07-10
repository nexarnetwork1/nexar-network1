import { getDefaultConfig } from "@rainbow-me/rainbowkit";

import {
  metaMaskWallet,
  trustWallet,
  coinbaseWallet,
  walletConnectWallet,
  okxWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";

import { bsc } from "wagmi/chains";

export const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

export const config = getDefaultConfig({
  appName: "Nexar Network",

  projectId,

  chains: [bsc],

  ssr: true,

  wallets: [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        trustWallet,
        injectedWallet,
        okxWallet,
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
  ],
});
