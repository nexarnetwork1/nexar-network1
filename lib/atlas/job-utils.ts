import type { NetworkFeedPost } from "@/modules/atlas-network/types";

export type JobMetadata = {
  location?: string | null;
  employment_type?: string | null;
  salary_range?: string | null;
  category?: string | null;
  hiring_status?: "open" | "closed" | null;
  is_featured?: boolean;
  applications?: Array<{
    profile_id: string;
    user_id: string;
    message: string;
    applied_at: string;
    status?: string;
    updated_at?: string;
  }>;
};

export function jobMeta(post: NetworkFeedPost): JobMetadata {
  return (post.metadata ?? {}) as JobMetadata;
}

export function isJobOpen(post: NetworkFeedPost): boolean {
  return jobMeta(post).hiring_status !== "closed";
}

export function isJobFeatured(post: NetworkFeedPost): boolean {
  return Boolean(jobMeta(post).is_featured);
}

export function applicationCount(post: NetworkFeedPost): number {
  return jobMeta(post).applications?.length ?? 0;
}

export type JobApplicationStatus =
  | "pending"
  | "reviewed"
  | "interview_invited"
  | "accepted"
  | "rejected";

export const APPLICATION_STATUS_LABELS: Record<JobApplicationStatus, string> = {
  pending: "Pending",
  reviewed: "Under review",
  interview_invited: "Interview invited",
  accepted: "Accepted",
  rejected: "Not selected",
};
