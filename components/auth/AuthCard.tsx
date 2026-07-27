import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function AuthCard({ title, subtitle, children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md rounded-2xl border border-border bg-card/60 p-8 backdrop-blur-xl",
        className
      )}
    >
      <h1 className="font-heading text-2xl font-semibold text-gold">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}
