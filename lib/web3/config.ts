import { bsc } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { cookieStorage, createStorage } from "@wagmi/core";
import { SITE } from "@/lib/constants/site";

export const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

export const bscChain = bsc;

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks: [bsc],
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

export const appKitMetadata = {
  name: SITE.name,
  description: SITE.description,
  url: SITE.url,
  icons: [`${SITE.url}/icon-512`],
};
