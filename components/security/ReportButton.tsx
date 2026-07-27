"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { reportContentAction } from "@/modules/reports/actions";
import type { ReportTarget } from "@/types";
import { Button } from "@/components/ui/Button";

const REASONS = [
  "Spam or fake content",
  "Inappropriate content",
  "Misleading information",
  "Counterfeit or illegal product",
  "Harassment or abuse",
  "Other",
];

type ReportButtonProps = {
  targetType: ReportTarget;
  targetId: string;
  label?: string;
};

export function ReportButton({ targetType, targetId, label = "Report" }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    formData.set("targetType", targetType);
    formData.set("targetId", targetId);

    startTransition(async () => {
      const result = await reportContentAction(formData);
      if (result.success) {
        toast.success("Report submitted. Our team will review it.");
        setOpen(false);
      } else {
        toast.error(result.error ?? "Failed to submit report");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-red-400"
        aria-label={`Report this ${targetType.replace("_", " ")}`}
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <form
      action={submit}
      className="w-full max-w-sm rounded-xl border border-border bg-surface p-4"
      aria-label="Report form"
    >
      <p className="text-sm font-medium">Report content</p>
      <label className="mt-3 block">
        <span className="text-xs text-muted">Reason</span>
        <select
          name="reason"
          required
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block">
        <span className="text-xs text-muted">Details (optional)</span>
        <textarea
          name="details"
          rows={2}
          maxLength={500}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <div className="mt-3 flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          Submit
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
