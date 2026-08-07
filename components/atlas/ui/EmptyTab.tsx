import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type EmptyTabProps = {
  message: string;
  action?: ReactNode;
  className?: string;
};

/** Atlas-styled empty tab panel — shared by profile and company views. */
export function EmptyTab({ message, action, className }: EmptyTabProps) {
  return (
    <div
      role="status"
      className={cn(
        "p-8 rounded-xl border border-white/10 bg-white/5 text-center text-muted text-sm",
        className,
      )}
    >
      <p>{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
