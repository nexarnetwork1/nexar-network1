import { posConfig } from "@/config/pos";

/**
 * POS architecture — inactive until posConfig.enabled is true.
 * Tables: pos_devices, pos_sessions
 */
export { posConfig };

export type PosCapability = keyof typeof posConfig.capabilities;

export function isPosEnabled(): boolean {
  return posConfig.enabled;
}
