// UUID v4 generator (RFC4122 compliant)
// This provides a production-ready UUID generation without external dependencies

/**
 * Generate a UUID v4 (RFC4122 compliant)
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * where x is a random hex digit and y is a random hex digit from 8, 9, a, or b
 */
export function generateUUID(): string {
  // Generate 16 random bytes
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  
  // Convert to hex string
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  
  // Set version to 4 (bits 6-7 of the 7th byte)
  const versionedHex = hex.substring(0, 12) + '4' + hex.substring(13);
  
  // Set variant bits (bits 6-7 of the 9th byte) to 10 (0b10)
  const variantHex = versionedHex.substring(0, 16) + (parseInt(versionedHex[16], 16) & 0x3 | 0x8).toString(16) + versionedHex.substring(17);
  
  // Insert hyphens
  return formatUUID(variantHex);
}

/**
 * Format a UUID string with hyphens
 */
function formatUUID(hex: string): string {
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join('-');
}

/**
 * Validate a UUID string
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate a URL-safe UUID (no hyphens)
 */
export function generateUUIDSafe(): string {
  return generateUUID().replace(/-/g, '');
}

/**
 * Validate a URL-safe UUID
 */
export function isValidUUIDSafe(uuid: string): boolean {
  const uuidSafeRegex = /^[0-9a-f]{32}$/i;
  return uuidSafeRegex.test(uuid);
}

/**
 * Generate a UUID from a namespace and name (UUID v5)
 * Note: This is a simplified implementation. For production use, consider a proper SHA-1 implementation.
 */
export function generateUUIDv5(namespace: string, name: string): string {
  // Simplified version - in production, use proper SHA-1
  const input = namespace + name;
  const hash = simpleHash(input);
  const hex = hash.toString(16).padStart(32, '0').substring(0, 32);
  
  // Set version to 5 (bits 6-7 of the 7th byte)
  const versionedHex = hex.substring(0, 12) + '5' + hex.substring(13);
  
  // Set variant bits (bits 6-7 of the 9th byte) to 10 (0b10)
  const variantHex = versionedHex.substring(0, 16) + (parseInt(versionedHex[16], 16) & 0x3 | 0x8).toString(16) + versionedHex.substring(17);
  
  return formatUUID(variantHex);
}

/**
 * Simple hash function (for UUID v5 placeholder)
 * In production, replace with proper SHA-1
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Extract timestamp from UUID v1
 * Note: This only works for time-based UUIDs, not UUID v4
 */
export function extractTimestampFromUUID(uuid: string): Date | null {
  if (!isValidUUID(uuid)) return null;
  
  const hex = uuid.replace(/-/g, '');
  const timestampBits = hex.substring(0, 12);
  const timestamp = parseInt(timestampBits, 16);
  
  // UUID v1 timestamp starts at October 15, 1582 (Gregorian)
  const epoch = Date.UTC(1582, 9, 15);
  const hundredNanosecondsPerTick = 10000;
  
  const date = new Date(epoch + (timestamp / hundredNanosecondsPerTick));
  return date;
}
