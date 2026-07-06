import { cn } from "@/lib/utils/cn";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
};

export function GlassCard({ children, className, hover = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        "luxury-border rounded-2xl bg-card/40 p-6 backdrop-blur-xl",
        hover &&
          "transition-all duration-500 hover:border-gold/20 hover:bg-card/60 hover:shadow-[0_0_60px_-20px_rgba(212,175,55,0.15)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
