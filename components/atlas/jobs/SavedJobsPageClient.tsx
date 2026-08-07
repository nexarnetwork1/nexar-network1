"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { getSavedPostIds } from "@/components/atlas/app/feed/feed-utils";
import { fetchJobsAction } from "@/modules/atlas-network/actions";
import { JobCard } from "@/components/atlas/jobs/JobCard";
import type { NetworkFeedPost } from "@/modules/atlas-network/types";

export function SavedJobsPageClient() {
  const [jobs, setJobs] = useState<NetworkFeedPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const ids = getSavedPostIds();
    if (ids.length === 0) {
      setLoaded(true);
      return;
    }
    fetchJobsAction({ limit: 50 })
      .then((result) => {
        setJobs(result.jobs.filter((j) => ids.includes(j.id)));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Bookmark className="h-6 w-6 text-gold" />
        <div>
          <h1 className="text-2xl font-bold">Saved Jobs</h1>
          <p className="text-sm text-muted">Jobs you bookmarked on ATLAS</p>
        </div>
      </div>
      <Link href="/atlas/jobs" className="text-sm text-gold hover:underline mb-4 inline-block">
        ← Browse all jobs
      </Link>
      {!loaded ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : jobs.length === 0 ? (
        <div className="p-10 rounded-xl border border-white/10 bg-white/5 text-center">
          <p className="text-muted">No saved jobs yet.</p>
          <Link href="/atlas/jobs" className="text-gold text-sm mt-2 inline-block hover:underline">
            Explore jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
