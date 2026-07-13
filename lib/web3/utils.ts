export function isWeb3Configured(): boolean {
  // Check if projectId is configured
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'ed68a1decb1758bdd2fc2c67e65a21f6'
  return Boolean(projectId)
}
