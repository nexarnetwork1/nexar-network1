import { cn } from "@/lib/utils/cn";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
};

/** Charcoal surface card — named historically; no frosted glass / neon. */
export function GlassCard({ children, className, hover = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        "nxr-card luxury-border p-6",
        hover && "nxr-card-interactive",
        className,
      )}
    >
      {children}
    </div>
  );
}
