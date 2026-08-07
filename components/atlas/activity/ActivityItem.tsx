import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { PresentedNetworkActivity } from "@/lib/atlas/activity-presenter";

type ActivityItemProps = {
  activity: PresentedNetworkActivity;
  className?: string;
};

/** Unified network activity row with deep links into the ATLAS ecosystem. */
export function ActivityItem({ activity, className }: ActivityItemProps) {
  const content = (
    <>
      <p className="text-sm">
        {activity.actorName ? (
          <span className="font-medium text-white">{activity.actorName}</span>
        ) : null}
        {activity.actorName ? " · " : null}
        <span className="text-muted">{activity.label}</span>
      </p>
      <p className="text-xs text-muted mt-1">
        {new Date(activity.createdAt).toLocaleString()}
      </p>
    </>
  );

  const shellClass = cn(
    "block p-3 rounded-xl border border-white/10 bg-white/5 text-sm transition-colors",
    activity.href && "hover:border-gold/20",
    className,
  );

  if (activity.href) {
    return (
      <Link href={activity.href} className={shellClass}>
        {content}
      </Link>
    );
  }

  return <div className={shellClass}>{content}</div>;
}
