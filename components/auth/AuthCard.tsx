import { cn } from "@/lib/utils/cn";

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
        "mx-auto w-full max-w-[22rem] rounded-2xl border border-border/80 bg-card/55 p-5 shadow-xl shadow-black/20 backdrop-blur-2xl sm:max-w-[24rem]",
        className
      )}
    >
      <h1 className="font-heading text-xl font-semibold text-gold">{title}</h1>
      {subtitle && <p className="mt-1.5 text-xs leading-relaxed text-muted">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}
