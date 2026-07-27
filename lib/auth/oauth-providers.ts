export type OAuthProviderId = "google" | "apple";

export function isOAuthProviderEnabled(provider: OAuthProviderId): boolean {
  if (provider === "google") {
    return process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED === "true";
  }
  return process.env.NEXT_PUBLIC_OAUTH_APPLE_ENABLED === "true";
}

export function getEnabledOAuthProviders(): OAuthProviderId[] {
  const providers: OAuthProviderId[] = [];
  if (isOAuthProviderEnabled("google")) providers.push("google");
  if (isOAuthProviderEnabled("apple")) providers.push("apple");
  return providers;
}
