import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";

interface PremiumFeatureGridProps {
  features: Array<{
    icon?: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
  }>;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function PremiumFeatureGrid({
  features,
  columns = 3,
  className,
}: PremiumFeatureGridProps) {
  return (
    <div
      className={cn(
        "grid gap-6",
        columns === 2 && "md:grid-cols-2",
        columns === 3 && "md:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "md:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div
            key={index}
            className="group p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-gold/30 hover:bg-white/10 transition-all duration-300"
          >
            {Icon && (
              <div className="h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon className="h-6 w-6 text-gold" />
              </div>
            )}
            <h3 className="text-xl font-semibold mb-2 group-hover:text-gold transition-colors">
              {feature.title}
            </h3>
            <p className="text-muted leading-relaxed">{feature.description}</p>
          </div>
        );
      })}
    </div>
  );
}

interface PremiumChecklistProps {
  items: string[];
  className?: string;
}

export function PremiumChecklist({ items, className }: PremiumChecklistProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 mt-0.5">
            <Check className="h-3.5 w-3.5 text-gold" />
          </div>
          <p className="text-muted leading-relaxed">{item}</p>
        </div>
      ))}
    </div>
  );
}
