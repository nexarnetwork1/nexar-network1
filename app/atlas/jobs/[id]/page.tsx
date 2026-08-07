import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Building2, Briefcase } from "lucide-react";
import { getNetworkPostById } from "@/modules/atlas-network/repository";
import { JobApplyForm } from "@/components/atlas/app/JobApplyForm";

export default async function AtlasJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getNetworkPostById(id);
  if (!job || job.post_type !== "job") notFound();

  const meta = (job.metadata ?? {}) as Record<string, string>;

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
          <div>
            <h1 className="text-2xl font-bold">{job.title ?? "Open Role"}</h1>
            {job.business && (
              <p className="text-muted flex items-center gap-1.5 mt-1">
                <Building2 className="h-4 w-4" />
                {job.business.display_name}
              </p>
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
          {meta.salary_range && <span>{meta.salary_range}</span>}
        </div>

        {job.body && (
          <div className="prose prose-invert max-w-none">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{job.body}</p>
          </div>
        )}
      </article>

      <JobApplyForm postId={job.id} />
    </div>
  );
}
