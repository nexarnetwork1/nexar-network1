import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface PremiumHeroProps {
  badge?: string;
  title: string;
  subtitle: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function PremiumHero({
  badge,
  title,
  subtitle,
  description,
  primaryAction,
  secondaryAction,
  className,
}: PremiumHeroProps) {
  return (
    <div className={cn("text-center space-y-8 max-w-5xl mx-auto", className)}>
      {badge && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          {badge}
        </div>
      )}
      
      <div className="space-y-4">
        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-2xl lg:text-3xl text-gold font-light tracking-wide">
          {subtitle}
        </p>
      </div>
      
      <p className="text-lg text-muted max-w-3xl mx-auto leading-relaxed">
        {description}
      </p>
      
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center justify-center gap-4 pt-4">
          {primaryAction && (
            <Button
              size="lg"
              onClick={primaryAction.onClick}
              className="px-8 py-4 text-base bg-gold hover:bg-gold-secondary text-background border-gold/30"
            >
              {primaryAction.label}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors font-medium text-base"
            >
              {secondaryAction.label}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
