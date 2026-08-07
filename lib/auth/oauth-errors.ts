/** Maps Auth.js OAuth error codes to user-facing copy. */
export function mapAuthJsError(error: string | null | undefined): string | null {
  if (!error) return null;
  switch (error) {
    case "Configuration":
      return "Sign-in is not configured correctly. Contact support if this persists.";
    case "AccessDenied":
      return "Sign-in was cancelled or access was denied.";
    case "Verification":
      return "The sign-in link expired or was already used. Try again.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
    case "EmailCreateAccount":
    case "Callback":
      return "Social sign-in could not be completed. Try again or use email and password.";
    default:
      return "Sign-in failed. Try again or use email and password.";
  }
}
