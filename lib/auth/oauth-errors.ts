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
    case "OAuthAccountNotLinked":
      return "An account with this email already exists. Sign in with your password, then connect Google or GitHub from Settings.";
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
