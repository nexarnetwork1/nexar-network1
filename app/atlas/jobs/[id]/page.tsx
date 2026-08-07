import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { MapPin, Building2, Briefcase } from "lucide-react";
import {
  getNetworkPostById,
  getPersonProfileByUserId,
  hasUserAppliedToJob,
} from "@/modules/atlas-network/repository";
import { JobApplyForm } from "@/components/atlas/app/JobApplyForm";
import { jobCategoryLabel } from "@/lib/atlas/job-categories";
import { jobMeta, isJobOpen } from "@/lib/atlas/job-utils";

export default async function AtlasJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getNetworkPostById(id);
  if (!job || job.post_type !== "job") notFound();

  const meta = jobMeta(job);
  const session = await auth();
  let alreadyApplied = false;
  if (session?.user?.id) {
    const person = await getPersonProfileByUserId(session.user.id);
    if (person) {
      alreadyApplied = await hasUserAppliedToJob(id, person.network_profile_id);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <Link href="/atlas/jobs" className="text-sm text-muted hover:text-gold">
        ← Back to Jobs
      </Link>

      <article className="p-6 rounded-xl border border-white/10 bg-white/5">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-gold/10 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-gold" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h1 className="text-2xl font-bold">{job.title ?? "Open Role"}</h1>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  isJobOpen(job)
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-white/5 text-muted"
                }`}
              >
                {isJobOpen(job) ? "Hiring" : "Closed"}
              </span>
            </div>
            {job.business && (
              <Link
                href={`/atlas/network/${job.business.slug}`}
                className="text-muted flex items-center gap-1.5 mt-1 hover:text-gold"
              >
                <Building2 className="h-4 w-4" />
                {job.business.display_name}
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted mb-4">
          {meta.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {meta.location}
            </span>
          )}
          {meta.employment_type && (
            <span className="capitalize px-2 py-1 rounded-lg bg-white/5">
              {meta.employment_type.replace("_", " ")}
            </span>
          )}
          {meta.category && (
            <span className="px-2 py-1 rounded-lg bg-gold/10 text-gold">
              {jobCategoryLabel(meta.category)}
            </span>
          )}
          {meta.salary_range && <span>{meta.salary_range}</span>}
        </div>

        {job.body && (
          <div className="prose prose-invert max-w-none">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{job.body}</p>
          </div>
        )}
      </article>

      <JobApplyForm postId={job.id} initialApplied={alreadyApplied} />
    </div>
  );
}
