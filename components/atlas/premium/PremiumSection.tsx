import { cn } from "@/lib/utils/cn";

interface PremiumSectionProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "gradient" | "dark" | "gold";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

export function PremiumSection({
  children,
  className,
  variant = "default",
  padding = "lg",
}: PremiumSectionProps) {
  const variants = {
    default: "bg-canvas",
    gradient: "bg-gradient-to-br from-[var(--nxr-canvas-primary)] via-[var(--nxr-canvas-secondary)] to-[var(--nxr-canvas-primary)]",
    dark: "bg-chrome",
    gold: "bg-gradient-to-br from-gold/5 via-transparent to-gold/5",
  };

  const paddings = {
    none: "py-0",
    sm: "py-8",
    md: "py-12",
    lg: "py-20",
    xl: "py-32",
  };

  return (
    <section className={cn(variants[variant], paddings[padding], className)}>
      {children}
    </section>
  );
}
