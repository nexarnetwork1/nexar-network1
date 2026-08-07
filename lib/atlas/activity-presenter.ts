import type { NetworkActivity, NetworkActivityType } from "@/modules/atlas-network/types";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";

export type PresentedNetworkActivity = {
  id: string;
  activityType: NetworkActivityType;
  label: string;
  href: string | null;
  createdAt: string;
  actorProfileId: string | null;
  actorSlug: string | null;
  actorName: string | null;
  businessId: string | null;
  businessSlug: string | null;
};

const ACTIVITY_LABELS: Record<NetworkActivityType, string> = {
  post_created: "Published a post",
  product_created: "Published a product",
  partner_added: "Added a partner",
  employee_hired: "Hired a team member",
  store_created: "Opened a store",
  event_created: "Created an event",
  job_posted: "Posted a job",
  investment_made: "Made an investment",
  connection_accepted: "Connected with someone",
  follow: "Followed a profile",
  share: "Shared a post",
  reaction: "Reacted to a post",
  comment: "Commented on a post",
};

type ProfileLookup = Map<string, { slug: string; displayName: string }>;
type BusinessLookup = Map<string, { slug: string; displayName: string }>;

function payloadString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function resolveActivityHref(
  activity: NetworkActivity,
  lookups: { profiles?: ProfileLookup; businesses?: BusinessLookup } = {},
): string | null {
  const payload = activity.payload ?? {};
  const profiles = lookups.profiles ?? new Map();
  const businesses = lookups.businesses ?? new Map();

  switch (activity.activity_type) {
    case "job_posted": {
      const postId = payloadString(payload, "postId") ?? activity.target_id;
      return postId ? `/atlas/jobs/${postId}` : "/atlas/jobs";
    }
    case "event_created": {
      const eventId = payloadString(payload, "eventId");
      return eventId ? `/atlas/events/${eventId}` : "/atlas/events";
    }
    case "product_created": {
      const slug = payloadString(payload, "productSlug");
      if (slug) return MARKETPLACE_ROUTES.product(slug);
      const listingId = payloadString(payload, "listingId");
      if (listingId) return `${MARKETPLACE_ROUTES.root}?listing=${listingId}`;
      if (activity.business_id) {
        const company = businesses.get(activity.business_id);
        if (company) return `/atlas/network/${company.slug}?tab=products`;
      }
      return "/atlas/marketplace";
    }
    case "store_created": {
      const storeSlug = payloadString(payload, "storeSlug") ?? payloadString(payload, "slug");
      if (storeSlug) return MARKETPLACE_ROUTES.store(storeSlug);
      return "/atlas/marketplace";
    }
    case "post_created": {
      const postId = activity.target_id ?? payloadString(payload, "postId");
      const postType = payloadString(payload, "postType");
      if (postType === "job" && postId) return `/atlas/jobs/${postId}`;
      if (postType === "event" && postId) return `/atlas/events/${postId}`;
      return postId ? `/atlas#post-${postId}` : "/atlas";
    }
    case "follow":
    case "connection_accepted": {
      if (activity.target_type === "profile" && activity.target_id) {
        const profile = profiles.get(activity.target_id);
        if (profile) return `/atlas/network/${profile.slug}`;
      }
      return "/atlas/network";
    }
    case "comment":
    case "reaction":
    case "share": {
      const postId = activity.target_id ?? payloadString(payload, "postId");
      return postId ? `/atlas#post-${postId}` : "/atlas";
    }
    case "employee_hired":
    case "partner_added":
    case "investment_made": {
      if (activity.business_id) {
        const company = businesses.get(activity.business_id);
        if (company) return `/atlas/network/${company.slug}`;
      }
      return null;
    }
    default:
      return null;
  }
}

export function presentNetworkActivity(
  activity: NetworkActivity,
  lookups: { profiles?: ProfileLookup; businesses?: BusinessLookup } = {},
): PresentedNetworkActivity {
  const profiles = lookups.profiles ?? new Map();
  const businesses = lookups.businesses ?? new Map();
  const actor =
    activity.actor_profile_id != null ? profiles.get(activity.actor_profile_id) : undefined;
  const business =
    activity.business_id != null ? businesses.get(activity.business_id) : undefined;

  return {
    id: activity.id,
    activityType: activity.activity_type,
    label: ACTIVITY_LABELS[activity.activity_type] ?? activity.activity_type.replace(/_/g, " "),
    href: resolveActivityHref(activity, lookups),
    createdAt: activity.created_at,
    actorProfileId: activity.actor_profile_id,
    actorSlug: actor?.slug ?? null,
    actorName: actor?.displayName ?? business?.displayName ?? null,
    businessId: activity.business_id,
    businessSlug: business?.slug ?? null,
  };
}

export function presentNetworkActivities(
  activities: NetworkActivity[],
  lookups: { profiles?: ProfileLookup; businesses?: BusinessLookup } = {},
): PresentedNetworkActivity[] {
  return activities.map((activity) => presentNetworkActivity(activity, lookups));
}
