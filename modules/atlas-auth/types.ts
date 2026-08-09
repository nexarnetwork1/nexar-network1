/** Canonical ATLAS Auth intents — preserved across login and post-auth redirects. */
export type AtlasAuthIntent =
  | "atlas"
  | "business-create"
  | "marketplace-sell"
  | "marketplace-checkout"
  | "profile"
  | "settings";

export type OpenAtlasAuthOptions = {
  mode?: "signin" | "register";
  redirect?: string;
  intent?: AtlasAuthIntent;
  message?: string;
};

export type AtlasAuthActionResult = {
  success: boolean;
  error?: string;
  redirectTo?: string;
  needsEmailConfirmation?: boolean;
};

export type WalletConnectionRecord = {
  id: string;
  userId: string;
  walletAddress: string;
  chainId: number;
  provider: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
};
