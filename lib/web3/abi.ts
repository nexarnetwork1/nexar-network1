/** Verified NexarPresale ABI — BscScan exact match @ 0x9B3674dfE84b908B88BAf7285c8744531d678c9c */
export const PRESALE_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "nxrAmount", type: "uint256" },
    ],
    name: "Claimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "bnbAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "nxrAmount", type: "uint256" },
    ],
    name: "PurchasedWithBnb",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "usdtAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "nxrAmount", type: "uint256" },
    ],
    name: "PurchasedWithUsdt",
    type: "event",
  },
  { inputs: [], name: "HARD_CAP", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "MAX_PURCHASE", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "MIN_PURCHASE", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "PRICE_DENOMINATOR", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "PRICE_NUMERATOR", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "bnbPriceFeed", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "buyWithBnb", outputs: [], stateMutability: "payable", type: "function" },
  {
    inputs: [{ name: "usdtAmount", type: "uint256" }],
    name: "buyWithUsdt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [], name: "claim", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [{ name: "buyer", type: "address" }],
    name: "claimableOf",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "claimed",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "presaleEnd", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "presaleStart", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  {
    inputs: [{ name: "", type: "address" }],
    name: "purchased",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "totalClaimed", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSold", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "usdtToken", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "nxrToken", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
] as const;

export const CHAINLINK_AGGREGATOR_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
