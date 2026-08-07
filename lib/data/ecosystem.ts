import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BarChart3,
  Bot,
  Building2,
  Compass,
  CreditCard,
  Layers,
  ShoppingBag,
  Store,
  Users,
  Vault,
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
    title: "Wallet",
    description: "Self-custody wallet for NXR and multi-chain assets with seamless dApp connectivity.",
    icon: Wallet,
    status: "building",
  },
  {
    id: "pay",
    title: "Pay",
    description: "Merchant payment gateway for accepting NXR and stablecoins with instant settlement.",
    icon: CreditCard,
    status: "building",
  },
  {
    id: "commerce",
    title: "Commerce",
    description: "Business commerce hub for products, orders, and storefront operations inside ATLAS.",
    icon: ShoppingBag,
    status: "building",
  },
  {
    id: "marketplace",
    title: "Marketplace",
    description: "Enterprise marketplace channel for merchants, buyers, and verified product discovery.",
    icon: Store,
    status: "live",
    href: "/marketplace",
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
    description: "Cross-chain asset bridge connecting BSC, BOT Chain, and future Nexar Chain infrastructure.",
    icon: ArrowLeftRight,
    status: "planned",
  },
  {
    id: "ai",
    title: "AI",
    description: "Intelligent workspace assistant for commerce, analytics, and operational guidance.",
    icon: Bot,
    status: "building",
  },
  {
    id: "merchant",
    title: "Merchant",
    description: "Merchant onboarding, verification, and business profile management.",
    icon: Building2,
    status: "building",
  },
  {
    id: "customer",
    title: "Customer",
    description: "Unified customer identity, orders, and relationship management across channels.",
    icon: Users,
    status: "building",
  },
  {
    id: "treasury",
    title: "Treasury",
    description: "Treasury operations, reserves, and multi-chain settlement controls.",
    icon: Vault,
    status: "planned",
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Enterprise KPIs, revenue analytics, and operational intelligence dashboards.",
    icon: BarChart3,
    status: "building",
  },
  {
    id: "bot-chain",
    title: "BOT Chain",
    description: "Multi-chain infrastructure layer powering cross-network settlement and expansion.",
    icon: Layers,
    status: "building",
  },
];
