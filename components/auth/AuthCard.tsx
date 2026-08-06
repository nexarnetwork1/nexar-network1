import { cn } from "@/lib/utils/cn";
import { AtlasLogo } from "@/components/ui/AtlasLogo";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export function AuthCard({ title, subtitle, children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "nxr-card luxury-border animate-atlas-fade-in mx-auto w-full max-w-[22rem] p-6 sm:max-w-[24rem] sm:p-7",
        className,
      )}
    >
      <div className="mb-5 flex justify-center">
        <AtlasLogo height={44} priority />
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
