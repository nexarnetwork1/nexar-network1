import { cn } from "@/lib/utils/cn";
import { Logo } from "@/components/ui/Logo";

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
        "nxr-card luxury-border mx-auto w-full max-w-[22rem] p-6 sm:max-w-[24rem] sm:p-7",
        className,
      )}
    >
      <div className="mb-4 flex justify-center">
        <Logo showText={false} />
      </div>
      <p className="text-center text-[10px] font-semibold tracking-[0.22em] text-gold uppercase">
        Nexar Network
      </p>
      <h1 className="mt-2 text-center font-heading text-xl font-bold tracking-tight text-white">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5 text-center text-xs leading-relaxed text-muted">{subtitle}</p>
      )}
      <div className="mt-5">{children}</div>
    </div>
  );
}
