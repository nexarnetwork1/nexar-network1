"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bookmark, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { NetworkFeedPost } from "@/modules/atlas-network/types";
import { fetchJobsAction } from "@/modules/atlas-network/actions";
import { JobCard } from "./JobCard";
import { JOB_CATEGORIES } from "@/lib/atlas/job-categories";
import { getSavedPostIds, toggleSavedPost } from "@/components/atlas/app/feed/feed-utils";

type JobsBrowseClientProps = {
  initialFeatured: NetworkFeedPost[];
  initialLatest: NetworkFeedPost[];
  initialRecommended: NetworkFeedPost[];
};

const EMPLOYMENT_TYPES = [
  { id: "full_time", label: "Full time" },
  { id: "part_time", label: "Part time" },
  { id: "contract", label: "Contract" },
  { id: "internship", label: "Internship" },
  { id: "remote", label: "Remote" },
] as const;

export function JobsBrowseClient({
  initialFeatured,
  initialLatest,
  initialRecommended,
}: JobsBrowseClientProps) {
  const [featured, setFeatured] = useState(initialFeatured);
  const [latest, setLatest] = useState(initialLatest);
  const [recommended, setRecommended] = useState(initialRecommended);
  const [query, setQuery] = useState("");
  const [employmentType, setEmploymentType] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [savedIds, setSavedIds] = useState<string[]>(() => getSavedPostIds());
  const [pending, startTransition] = useTransition();

  const runSearch = () => {
    startTransition(async () => {
      try {
        const result = await fetchJobsAction({
          query: query.trim() || undefined,
          employmentType: (employmentType || undefined) as
            | "full_time"
            | "part_time"
            | "contract"
            | "internship"
            | "remote"
            | undefined,
          category: (category || undefined) as
            | "engineering"
            | "design"
            | "marketing"
            | "sales"
            | "operations"
            | "finance"
            | "hr"
            | "other"
            | undefined,
          limit: 30,
        });
        setLatest(result.jobs);
        setFeatured(result.jobs.filter((j) => (j.metadata as Record<string, unknown>)?.is_featured));
        setRecommended(result.jobs);
      } catch {
        /* keep current */
      }
    });
  };

  const toggleSave = (jobId: string) => {
    const saved = toggleSavedPost(jobId);
    setSavedIds(getSavedPostIds());
    return saved;
  };

  const showSections = !query.trim() && !employmentType && !category;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40"
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />
          <button
            type="button"
            onClick={runSearch}
            disabled={pending}
            className="px-4 py-2.5 rounded-lg bg-gold text-background text-sm font-medium disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm"
          >
            <option value="">All types</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm"
          >
            <option value="">All categories</option>
            {JOB_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <Link
            href="/atlas/jobs/saved"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-sm text-muted hover:text-white"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Saved
          </Link>
          <Link
            href="/atlas/jobs/applications"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-sm text-muted hover:text-white"
          >
            My applications
          </Link>
        </div>
      </div>

      {showSections && featured.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Featured Jobs</h2>
          <div className="space-y-3">
            {featured.map((job) => (
              <JobRow key={job.id} job={job} saved={savedIds.includes(job.id)} onSave={toggleSave} />
            ))}
          </div>
        </section>
      )}

      {showSections && recommended.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Recommended</h2>
          <div className="space-y-3">
            {recommended.slice(0, 6).map((job) => (
              <JobRow key={job.id} job={job} saved={savedIds.includes(job.id)} onSave={toggleSave} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">
          {showSections ? "Latest Jobs" : "Results"}
        </h2>
        {latest.length === 0 ? (
          <p className="text-sm text-muted">No jobs match your filters.</p>
        ) : (
          <div className={cn("space-y-3", pending && "opacity-60")}>
            {latest.map((job) => (
              <JobRow key={job.id} job={job} saved={savedIds.includes(job.id)} onSave={toggleSave} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function JobRow({
  job,
  saved,
  onSave,
}: {
  job: NetworkFeedPost;
  saved: boolean;
  onSave: (id: string) => boolean;
}) {
  return (
    <div className="relative">
      <JobCard job={job} />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onSave(job.id);
        }}
        className={cn(
          "absolute top-3 right-3 p-2 rounded-lg border transition-colors",
          saved
            ? "border-gold/40 bg-gold/10 text-gold"
            : "border-white/10 bg-black/40 text-muted hover:text-white",
        )}
        aria-label={saved ? "Unsave job" : "Save job"}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
      </button>
    </div>
  );
}
