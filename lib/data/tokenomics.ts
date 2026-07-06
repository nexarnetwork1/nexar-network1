export type TokenAllocation = {
  title: string;
  value: number;
  percent: number;
  vesting?: string;
  color: string;
};

export const TOKENOMICS: TokenAllocation[] = [
  { title: "Liquidity", value: 150_000_000, percent: 30, color: "#D4AF37" },
  { title: "Ecosystem", value: 100_000_000, percent: 20, color: "#F5E39E" },
  { title: "Presale", value: 100_000_000, percent: 20, color: "#C9A227" },
  { title: "Marketing", value: 50_000_000, percent: 10, color: "#B8941F" },
  {
    title: "Team",
    value: 75_000_000,
    percent: 15,
    vesting: "50M locked with gradual vesting after 1 year",
    color: "#A67C00",
  },
  { title: "Rewards", value: 25_000_000, percent: 5, color: "#8B6914" },
];

export const MAX_SUPPLY = 500_000_000;
