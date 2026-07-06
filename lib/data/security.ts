import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Eye,
  LockKeyhole,
  Users,
} from "lucide-react";

export type SecurityItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const SECURITY_ITEMS: SecurityItem[] = [
  {
    title: "Verified Contract",
    description:
      "Token and presale contracts verified on BscScan with source code publicly available for independent review.",
    icon: BadgeCheck,
  },
  {
    title: "Transparent Allocation",
    description:
      "Full tokenomics published with on-chain verifiable supply. Mint function permanently disabled.",
    icon: Eye,
  },
  {
    title: "Secure Vesting",
    description:
      "Team allocation locked with gradual vesting after one year. No hidden unlocks or surprise emissions.",
    icon: LockKeyhole,
  },
  {
    title: "Community Trust",
    description:
      "Founder-led development with public roadmap, open communication, and long-term ecosystem commitment.",
    icon: Users,
  },
];
