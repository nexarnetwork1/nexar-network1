export type RoadmapPhase = {
  quarter: string;
  title: string;
  items: string[];
  status: "completed" | "active" | "upcoming";
};

export const ROADMAP: RoadmapPhase[] = [
  {
    quarter: "Q3 2026",
    title: "Foundation",
    status: "active",
    items: [
      "Website Launch",
      "Whitepaper",
      "Community Growth",
      "Presale Launch",
    ],
  },
  {
    quarter: "Q4 2026",
    title: "Expansion",
    status: "upcoming",
    items: [
      "DEX Listing",
      "CoinGecko Listing",
      "CoinMarketCap Listing",
      "Marketing Campaign",
      "Marketplace Beta",
      "Merchant Registration",
    ],
  },
  {
    quarter: "Q1 2027",
    title: "Utility",
    status: "upcoming",
    items: [
      "Nexar Wallet",
      "Merchant Payments",
      "Staking",
      "Strategic Partnerships",
      "Public Marketplace",
      "Merchant Dashboard",
      "Customer Dashboard",
      "Product Listings",
      "Order Management",
    ],
  },
  {
    quarter: "Q2 2027",
    title: "Nexar Chain",
    status: "upcoming",
    items: [
      "Testnet",
      "Explorer",
      "Developer SDK",
      "Mainnet Preparation",
      "Marketplace Expansion",
    ],
  },
];
