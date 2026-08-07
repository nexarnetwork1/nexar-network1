"use client";

import Link from "next/link";
import { Briefcase, Building2, MapPin } from "lucide-react";
import type { NetworkFeedPost } from "@/modules/atlas-network/types";
import { jobCategoryLabel } from "@/lib/atlas/job-categories";
import { isJobOpen, jobMeta } from "@/lib/atlas/job-utils";
import { cn } from "@/lib/utils/cn";

type JobCardProps = {
  job: NetworkFeedPost;
  compact?: boolean;
};

export function JobCard({ job, compact }: JobCardProps) {
  const meta = jobMeta(job);
  const open = isJobOpen(job);

  return (
    <Link
      href={`/atlas/jobs/${job.id}`}
      className={cn(
        "block rounded-xl border border-white/10 bg-white/5 hover:border-gold/25 transition-colors",
        compact ? "p-3" : "p-4",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className={cn("font-semibold line-clamp-2", compact ? "text-sm" : "text-lg")}>
            {job.title ?? "Open Role"}
          </h3>
          {job.business && (
            <p className="text-sm text-muted flex items-center gap-1.5 mt-1">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{job.business.display_name}</span>
            </p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 px-2 py-0.5 rounded text-[10px] font-medium",
            open ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-muted",
          )}
        >
          {open ? "Hiring" : "Closed"}
        </span>
      </div>

      {!compact && job.body && (
        <p className="text-sm text-white/80 mt-2 line-clamp-2">{job.body}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted">
        {meta.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {meta.location}
          </span>
        )}
        {meta.employment_type && (
          <span className="capitalize px-2 py-0.5 rounded bg-white/5">
            {meta.employment_type.replace("_", " ")}
          </span>
        )}
        {meta.category && (
          <span className="px-2 py-0.5 rounded bg-gold/10 text-gold">
            {jobCategoryLabel(meta.category)}
          </span>
        )}
        {meta.salary_range && <span>{meta.salary_range}</span>}
        {meta.is_featured && (
          <span className="inline-flex items-center gap-1 text-gold">
            <Briefcase className="h-3 w-3" />
            Featured
          </span>
        )}
      </div>
    </Link>
  );
}
