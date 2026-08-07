import Link from "next/link";
import { auth } from "@/auth";
import { getUserJobApplications } from "@/modules/atlas-network/repository";
import { getPersonProfileByUserId } from "@/modules/atlas-network/repository";
import { AtlasGuestGate } from "@/components/atlas/app/AtlasGuestGate";
import {
  APPLICATION_STATUS_LABELS,
  type JobApplicationStatus,
} from "@/lib/atlas/job-utils";

export default async function MyApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <AtlasGuestGate
        title="My Applications"
        description="Sign in to track your job applications."
        redirect="/atlas/jobs/applications"
      />
    );
  }

  const person = await getPersonProfileByUserId(session.user.id);
  if (!person) {
    return (
      <div className="max-w-3xl mx-auto py-6 px-4">
        <p className="text-muted">Create your network profile to apply for jobs.</p>
      </div>
    );
  }

  const applications = await getUserJobApplications(session.user.id);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="text-sm text-muted mt-1">Track application status across ATLAS jobs</p>
      </div>
      <Link href="/atlas/jobs" className="text-sm text-gold hover:underline">
        ← Browse jobs
      </Link>
      {applications.length === 0 ? (
        <div className="p-10 rounded-xl border border-white/10 bg-white/5 text-center">
          <p className="text-muted">You haven&apos;t applied to any roles yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(({ post, application }) => {
            const status = (application.status ?? "pending") as JobApplicationStatus;
            return (
              <Link
                key={post.id}
                href={`/atlas/jobs/${post.id}`}
                className="block p-4 rounded-xl border border-white/10 bg-white/5 hover:border-gold/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{post.title ?? "Role"}</p>
                    {post.business && (
                      <p className="text-sm text-muted mt-0.5">{post.business.display_name}</p>
                    )}
                    <p className="text-xs text-muted mt-2">
                      Applied {new Date(application.applied_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="shrink-0 px-2 py-1 rounded text-xs bg-gold/10 text-gold">
                    {APPLICATION_STATUS_LABELS[status] ?? status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
