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
        "mx-auto w-full max-w-md rounded-2xl border border-border/80 bg-card/50 p-8 shadow-xl shadow-black/20 backdrop-blur-2xl",
        className
      )}
    >
      <h1 className="font-heading text-2xl font-semibold text-gold">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}
