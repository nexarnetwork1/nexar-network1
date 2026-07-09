import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { bsc } from "wagmi/chains";

export const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

export const config = getDefaultConfig({
  appName: "Nexar Network",
  projectId,
  chains: [bsc],
  ssr: true,
});
