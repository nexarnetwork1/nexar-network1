import type { BusinessStatus } from "./types";

/** Valid status transitions for Business lifecycle. */
export const BUSINESS_STATUS_TRANSITIONS: Record<
  BusinessStatus,
  BusinessStatus[]
> = {
  draft: ["pending", "closed"],
  pending: ["active", "suspended", "closed", "draft"],
  active: ["suspended", "closed"],
  suspended: ["active", "closed"],
  closed: [],
};

export function canTransitionBusinessStatus(
  from: BusinessStatus,
  to: BusinessStatus,
): boolean {
  if (from === to) return true;
  return BUSINESS_STATUS_TRANSITIONS[from].includes(to);
}
