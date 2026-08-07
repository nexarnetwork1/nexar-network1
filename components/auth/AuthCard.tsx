import { cn } from "@/lib/utils/cn";
import { AtlasLogo } from "@/components/ui/AtlasLogo";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

/** Shared ATLAS auth shell — aligned with Atlas Identity card styling. */
export function AuthCard({ title, subtitle, children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[22rem] overflow-hidden rounded-[1.25rem] border border-gold/20 bg-[#070708]/95 p-5 shadow-[0_0_60px_-20px_rgba(212,175,55,0.4)] backdrop-blur-xl sm:max-w-[24rem] sm:p-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="mb-5 flex justify-center">
        <AtlasLogo height={40} priority />
      </div>
      <h1 className="text-center font-heading text-xl font-bold tracking-tight text-white">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5 text-center text-xs leading-relaxed text-muted">{subtitle}</p>
      )}
      <div className="mt-5">{children}</div>
    </div>
  );
}
