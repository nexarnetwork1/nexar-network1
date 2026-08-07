import Link from "next/link";
import { Briefcase } from "lucide-react";
import { getJobPostsFiltered } from "@/modules/atlas-network/repository";
import { JobsBrowseClient } from "@/components/atlas/jobs/JobsBrowseClient";

export default async function AtlasJobsPage() {
  const [featured, latest, recommended] = await Promise.all([
    getJobPostsFiltered({ filter: "featured", limit: 8 }),
    getJobPostsFiltered({ filter: "latest", limit: 30 }),
    getJobPostsFiltered({ filter: "recommended", limit: 8 }),
  ]);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-muted mt-1">Company opportunities on ATLAS Network</p>
        </div>
        <Link
          href="/atlas/jobs/new"
          className="px-4 py-2 rounded-lg bg-gold text-background text-sm font-medium hover:bg-gold-secondary"
        >
          Post a Job
        </Link>
      </div>

      {featured.length === 0 && latest.length === 0 ? (
        <div className="p-10 rounded-xl border border-white/10 bg-white/5 text-center">
          <Briefcase className="h-10 w-10 text-gold/50 mx-auto mb-3" />
          <p className="text-muted mb-4">No job posts yet</p>
          <Link href="/atlas/jobs/new" className="text-gold hover:underline text-sm">
            Post the first role
          </Link>
        </div>
      ) : (
        <JobsBrowseClient
          initialFeatured={featured}
          initialLatest={latest}
          initialRecommended={recommended}
        />
      )}
    </div>
  );
}
