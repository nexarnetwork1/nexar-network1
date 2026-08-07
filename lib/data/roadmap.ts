export type RoadmapPhase = {
  quarter: string;
  title: string;
  items: string[];
  status: "completed" | "active" | "upcoming";
};

export const ROADMAP: RoadmapPhase[] = [
  {
    quarter: "2026",
    title: "Platform Foundation",
    status: "completed",
    items: [
      "Nexar Network Website & Brand",
      "Official Whitepaper",
      "Dual-Chain NXR Presale (BSC & BOT)",
      "Smart Contract Deployment & Verification",
      "Community & Partner Network",
    ],
  },
  {
    quarter: "2026",
    title: "ATLAS Operating System",
    status: "active",
    items: [
      "ATLAS Unified Identity & Authentication",
      "Social Feed & Network Profiles",
      "Companies, Connections & Search",
      "Jobs & Events",
      "Messaging & Notifications",
      "Marketplace & Commerce Checkout",
      "Business Hub & Store Management",
      "AI Assist Across ATLAS Surfaces",
      "Wallet Integration (MetaMask, Rabby, Coinbase, WalletConnect)",
    ],
  },
  {
    quarter: "2026–2027",
    title: "Commerce & Finance",
    status: "upcoming",
    items: [
      "Merchant & Customer Portals",
      "Invoices & Order Management",
      "Treasury & Platform Analytics",
      "Expanded Payment Rails",
      "Strategic Partnerships",
      "DEX & Market Listings",
    ],
  },
  {
    quarter: "2027+",
    title: "Network Expansion",
    status: "upcoming",
    items: [
      "Developer APIs & SDK",
      "Advanced Search & Discovery",
      "Global Adoption Programs",
      "Ecosystem Grants",
      "Cross-Chain Infrastructure",
    ],
  },
];
