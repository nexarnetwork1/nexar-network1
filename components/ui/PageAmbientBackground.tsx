import { cn } from "@/lib/utils/cn";

type PageAmbientBackgroundProps = {
  variant?: "home" | "marketplace" | "presale" | "login" | "default";
  className?: string;
};

const VARIANTS = {
  home: "from-gold/[0.03] via-transparent to-emerald-500/[0.02]",
  marketplace: "from-violet-500/[0.04] via-transparent to-gold/[0.02]",
  presale: "from-amber-500/[0.04] via-transparent to-gold/[0.03]",
  login: "from-gold/[0.05] via-transparent to-blue-500/[0.03]",
  default: "from-white/[0.02] via-transparent to-gold/[0.02]",
} as const;

export function PageAmbientBackground({
  variant = "default",
  className,
}: PageAmbientBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", VARIANTS[variant])} />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212,175,55,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,175,55,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />
      <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-gold/10 blur-[120px]" />
      <div className="absolute -right-24 bottom-1/4 h-64 w-64 rounded-full bg-emerald-500/5 blur-[100px]" />
    </div>
  );
}
