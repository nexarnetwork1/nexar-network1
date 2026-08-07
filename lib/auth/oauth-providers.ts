export type OAuthProviderId = "google" | "github" | "apple";

export function isOAuthProviderEnabled(provider: OAuthProviderId): boolean {
  if (provider === "google") {
    return process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED === "true";
  }
  if (provider === "github") {
    return process.env.NEXT_PUBLIC_OAUTH_GITHUB_ENABLED === "true";
  }
  return process.env.NEXT_PUBLIC_OAUTH_APPLE_ENABLED === "true";
}

/** Server-only: providers with credentials configured in auth.ts. */
export function getConfiguredOAuthProviders(): OAuthProviderId[] {
  const providers: OAuthProviderId[] = [];
  const googleConfigured =
    Boolean(process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) &&
    Boolean(process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET);
  const githubConfigured =
    Boolean(process.env.AUTH_GITHUB_ID || process.env.GITHUB_CLIENT_ID) &&
    Boolean(process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET);
  if (googleConfigured) providers.push("google");
  if (githubConfigured) providers.push("github");
  return providers;
}

export function getEnabledOAuthProviders(): OAuthProviderId[] {
  const providers: OAuthProviderId[] = [];
  if (isOAuthProviderEnabled("google")) providers.push("google");
  if (isOAuthProviderEnabled("github")) providers.push("github");
  if (isOAuthProviderEnabled("apple")) providers.push("apple");
  return providers;
}
