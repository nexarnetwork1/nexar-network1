import Link from "next/link";
import { Briefcase, MapPin, Building2 } from "lucide-react";
import { getNetworkPosts } from "@/modules/atlas-network/repository";

export default async function AtlasJobsPage() {
  const jobs = await getNetworkPosts({ postType: "job", limit: 50 });

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

      {jobs.length === 0 ? (
        <div className="p-10 rounded-xl border border-white/10 bg-white/5 text-center">
          <Briefcase className="h-10 w-10 text-gold/50 mx-auto mb-3" />
          <p className="text-muted mb-4">No job posts yet</p>
          <Link href="/atlas/create-post" className="text-gold hover:underline text-sm">
            Be the first to post a role
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const meta = (job.metadata ?? {}) as Record<string, string>;
            return (
              <Link
                key={job.id}
                href={`/atlas/jobs/${job.id}`}
                className="block p-4 rounded-xl border border-white/10 bg-white/5 hover:border-gold/25 transition-colors"
              >
                <h2 className="font-semibold text-lg">{job.title ?? "Open Role"}</h2>
                {job.business && (
                  <p className="text-sm text-muted flex items-center gap-1.5 mt-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {job.business.name}
                  </p>
                )}
                {job.body && <p className="text-sm text-white/80 mt-2 line-clamp-2">{job.body}</p>}
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted">
                  {meta.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {meta.location}
                    </span>
                  )}
                  {meta.employment_type && (
                    <span className="capitalize px-2 py-0.5 rounded bg-white/5">
                      {meta.employment_type.replace("_", " ")}
                    </span>
                  )}
                  {meta.salary_range && <span>{meta.salary_range}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
