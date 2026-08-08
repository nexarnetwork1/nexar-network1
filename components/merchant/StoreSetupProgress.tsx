import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { merchantCommerceConfig } from "@/config/merchant-commerce";
import { cn } from "@/lib/utils/cn";

type StoreSetupProgressProps = {
  completedStepIds?: string[];
  className?: string;
};

export function StoreSetupProgress({
  completedStepIds = ["store"],
  className,
}: StoreSetupProgressProps) {
  return (
    <ol className={cn("space-y-3", className)}>
      {merchantCommerceConfig.setupSteps.map((step) => {
        const done = completedStepIds.includes(step.id);
        return (
          <li
            key={step.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/30 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted" />
              )}
              <span className={cn("text-sm", done ? "text-white" : "text-muted")}>{step.label}</span>
            </div>
            <Link href={step.href} className="text-xs text-gold hover:underline">
              {done ? "Review" : "Start"}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
