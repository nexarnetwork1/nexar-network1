export const loyaltyConfig = {
  enabled: false,
  features: {
    rewardPoints: true,
    cashback: true,
    referralRewards: true,
    vipLevels: true,
    campaigns: true,
  },
  defaultVipLevel: "standard",
} as const;
