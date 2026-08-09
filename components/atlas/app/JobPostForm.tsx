"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAtlasAuth } from "@/components/atlas/auth/AtlasAuthProvider";
import { createAtlasJobPostAction } from "@/modules/atlas-network/actions";
import { AiAssistMenu } from "@/components/atlas/ai/AiAssistMenu";
import { JOB_CATEGORIES, type JobCategoryId } from "@/lib/atlas/job-categories";
import { toast } from "sonner";

export function JobPostForm() {
  const { data: session } = useSession();
  const { openAtlasAuth } = useAtlasAuth();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [jobTitle, setJobTitle] = useState("");
  const [body, setBody] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState<
    "full_time" | "part_time" | "contract" | "internship" | "remote"
  >("full_time");
  const [salaryRange, setSalaryRange] = useState("");
  const [category, setCategory] = useState<JobCategoryId>("engineering");

  if (!session) {
    return (
      <div className="p-8 rounded-xl border border-white/10 bg-white/5 text-center">
        <p className="text-muted mb-4">Sign in to post a job</p>
        <button
          type="button"
          onClick={() =>
            openAtlasAuth({ mode: "signin", redirect: "/atlas/jobs/new" })
          }
          className="px-4 py-2 rounded-lg bg-gold text-background font-medium"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <h1 className="text-xl font-bold">Post a Job</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
        <input
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Job title"
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-gold/40"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="Role description, requirements, benefits..."
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40 resize-none"
        />
        <AiAssistMenu
          surface="job"
          text={body || jobTitle}
          context={{ jobTitle }}
          onApply={(content, action) => {
            if (action === "required_skills" || action === "responsibilities" || action === "interview_questions") {
              setBody((b) => `${b.trim()}\n\n${content}`.trim());
            } else {
              setBody(content);
            }
          }}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40"
          />
          <select
            value={employmentType}
            onChange={(e) =>
              setEmploymentType(e.target.value as typeof employmentType)
            }
            className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40"
          >
            <option value="full_time">Full time</option>
            <option value="part_time">Part time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="remote">Remote</option>
          </select>
        </div>
        <input
          value={salaryRange}
          onChange={(e) => setSalaryRange(e.target.value)}
          placeholder="Salary range (optional)"
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as JobCategoryId)}
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-gold/40"
        >
          {JOB_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || !jobTitle.trim() || !body.trim()}
          onClick={() =>
            startTransition(async () => {
              try {
                const result = await createAtlasJobPostAction({
                  postType: "job",
                  jobTitle: jobTitle.trim(),
                  body: body.trim(),
                  location: location.trim() || undefined,
                  employmentType,
                  salaryRange: salaryRange.trim() || undefined,
                  category,
                });
                toast.success("Job posted");
                router.push(`/atlas/jobs/${result.postId}`);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to post job");
              }
            })
          }
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gold text-background font-medium disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Publish Job
        </button>
      </div>
    </div>
  );
}
