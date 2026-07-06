import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Code2,
  Compass,
  CreditCard,
  Layers,
  Rocket,
  Wallet,
} from "lucide-react";

export type EcosystemModule = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: "live" | "building" | "planned";
  href?: string;
};

export const ECOSYSTEM_MODULES: EcosystemModule[] = [
  {
    id: "wallet",
    title: "Nexar Wallet",
    description: "Self-custody wallet for NXR and multi-chain assets with seamless dApp connectivity.",
    icon: Wallet,
    status: "building",
  },
  {
    id: "pay",
    title: "Nexar Pay",
    description: "Merchant payment gateway for accepting NXR and stablecoins with instant settlement.",
    icon: CreditCard,
    status: "building",
  },
  {
    id: "explorer",
    title: "Explorer",
    description: "Real-time blockchain explorer for transactions, contracts, and network analytics.",
    icon: Compass,
    status: "planned",
  },
  {
    id: "bridge",
    title: "Bridge",
    description: "Cross-chain asset bridge connecting BSC to future Nexar Chain infrastructure.",
    icon: ArrowLeftRight,
    status: "planned",
  },
  {
    id: "launchpad",
    title: "Launchpad",
    description: "Curated token launch platform for vetted projects within the Nexar ecosystem.",
    icon: Rocket,
    status: "planned",
  },
  {
    id: "api",
    title: "Developer API",
    description: "REST and SDK access for payments, wallet integration, and on-chain data queries.",
    icon: Code2,
    status: "planned",
  },
  {
    id: "chain",
    title: "Future Chain",
    description: "Sovereign Nexar Chain — purpose-built L1 for global decentralized payment infrastructure.",
    icon: Layers,
    status: "planned",
  },
];
