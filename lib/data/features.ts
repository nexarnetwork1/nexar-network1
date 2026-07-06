import type { LucideIcon } from "lucide-react";
import {
  Globe,
  Layers,
  Lock,
  Rocket,
  Shield,
  Zap,
} from "lucide-react";

export type Feature = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  layout: "wide" | "tall" | "standard";
};

export const FEATURES: Feature[] = [
  {
    id: "payments",
    title: "Global Payment Rails",
    description:
      "Enterprise-grade payment infrastructure designed for cross-border settlement with sub-second finality on BNB Smart Chain.",
    icon: Globe,
    accent: "from-gold/20 to-transparent",
    layout: "wide",
  },
  {
    id: "security",
    title: "Verified Security",
    description:
      "Mint permanently disabled. Smart contracts verified on BscScan with transparent allocation and auditable vesting schedules.",
    icon: Shield,
    accent: "from-emerald-500/10 to-transparent",
    layout: "tall",
  },
  {
    id: "speed",
    title: "Instant Settlement",
    description:
      "Built on BSC for high throughput and low fees — optimized for real-world merchant and consumer payment flows.",
    icon: Zap,
    accent: "from-amber-400/15 to-transparent",
    layout: "standard",
  },
  {
    id: "ecosystem",
    title: "Full-Stack Ecosystem",
    description:
      "Wallet, Pay, Explorer, Bridge, and Launchpad modules forming a cohesive network for developers and enterprises.",
    icon: Layers,
    accent: "from-violet-500/10 to-transparent",
    layout: "standard",
  },
  {
    id: "sovereign",
    title: "Sovereign Chain Vision",
    description:
      "Evolving from BEP20 to a purpose-built Nexar Chain — sovereign infrastructure for global decentralized payments.",
    icon: Rocket,
    accent: "from-sky-500/10 to-transparent",
    layout: "wide",
  },
  {
    id: "trust",
    title: "Community Trust",
    description:
      "Transparent tokenomics, locked team allocation, and founder-led development with long-term commitment to the ecosystem.",
    icon: Lock,
    accent: "from-rose-500/10 to-transparent",
    layout: "tall",
  },
];
