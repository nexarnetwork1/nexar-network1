/**
 * NBOS Shared Kernel — roles & membership.
 * Single RBAC vocabulary for the entire operating system.
 */

export const NBOS_ROLES = [
  "customer",
  "merchant",
  "business",
  "admin",
  "super_admin",
  /** Permanent NEXAR founder — NEXAR HQ. Cannot be demoted/deleted. */
  "platform_owner",
] as const;

export type NbosRole = (typeof NBOS_ROLES)[number];

/**
 * Membership of a User inside a Business.
 * A user may hold platform role AND business membership roles.
 */
export const BUSINESS_MEMBER_ROLES = [
  "owner",
  "admin",
  "manager",
  "staff",
  "viewer",
] as const;

export type BusinessMemberRole = (typeof BUSINESS_MEMBER_ROLES)[number];

export type SoftDeleteMeta = {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
