/**
 * Bootstrap credential resolution.
 * Plaintext passwords are NEVER stored — only bcrypt hashes.
 * There is NO hardcoded bootstrap password.
 * First install must use the Platform Owner Wizard (/admin/setup).
 */

import { PLATFORM_OWNER_EMAIL } from "./types";

export function resolveBootstrapOwnerEmail(): string {
  return (
    process.env.NEXAR_PLATFORM_OWNER_EMAIL?.trim().toLowerCase() ||
    PLATFORM_OWNER_EMAIL
  );
}

/**
 * Bootstrap password must be supplied by the Wizard (or env for CI only).
 * Returns null when unset — callers must fail closed.
 */
export function resolveBootstrapPasswordPlaintext(): string | null {
  const fromEnv = process.env.NEXAR_PLATFORM_OWNER_BOOTSTRAP_PASSWORD?.trim();
  return fromEnv && fromEnv.length >= 12 ? fromEnv : null;
}

export const BCRYPT_ROUNDS_HQ = 12;
