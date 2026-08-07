export type TrustedPartner = {
  id: string;
  name: string;
  logoSrc: string;
  href: string;
  logoClassName?: string;
};

export const TRUSTED_PARTNERS: TrustedPartner[] = [
  {
    id: "blockspot",
    name: "Blockspot",
    logoSrc: "/partners/blockspot-logo.png",
    href: "https://blockspot.io/coin/nexar-network-nxr/",
  },
  {
    id: "bot-chain",
    name: "BOT Chain",
    logoSrc: "/partners/botchain-logo.png",
    href: process.env.NEXT_PUBLIC_BOT_EXPLORER_COIN_URL ?? "https://scan.botchain.ai",
    logoClassName: "h-8 w-auto max-w-[140px] object-contain",
  },
];
