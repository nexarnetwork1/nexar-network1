export type TokenAllocation = {
  title: string;
  value: number;
  percent: number;
  vesting?: string;
  color: string;
};

/** Gold-scale chart palette — no brown/bronze tones. */
export const TOKENOMICS: TokenAllocation[] = [
  { title: "Liquidity", value: 150_000_000, percent: 30, color: "#FFD15C" },
  { title: "Ecosystem", value: 100_000_000, percent: 20, color: "#FFE082" },
  { title: "Presale", value: 100_000_000, percent: 20, color: "#E6BC52" },
  { title: "Marketing", value: 50_000_000, percent: 10, color: "#CCAA48" },
  {
    title: "Team",
    value: 75_000_000,
    percent: 15,
    vesting: "50M locked with gradual vesting after 1 year",
    color: "#B8983E",
  },
  { title: "Rewards", value: 25_000_000, percent: 5, color: "#9A8534" },
];

export const MAX_SUPPLY = 500_000_000;
