import { cn } from "@/lib/utils/cn";
import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

interface PremiumModuleCardProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  status?: "active" | "beta" | "new";
  features?: string[];
  className?: string;
}

export function PremiumModuleCard({
  icon: Icon,
  title,
  description,
  href,
  status,
  features,
  className,
}: PremiumModuleCardProps) {
  const statusColors = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    beta: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    new: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  return (
    <Link
      href={href}
      className={cn(
        "group block p-8 rounded-3xl border border-white/10 bg-white/5 hover:border-gold/30 hover:bg-white/10 transition-all duration-300",
        className
      )}
    >
      <div className="flex items-start justify-between mb-6">
        {Icon && (
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className="h-8 w-8 text-gold" />
          </div>
        )}
        {status && (
          <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border", statusColors[status])}>
            {status === "new" && <Zap className="h-3 w-3 inline mr-1" />}
            {status.toUpperCase()}
          </span>
        )}
      </div>
      
      <h3 className="text-2xl font-bold mb-3 group-hover:text-gold transition-colors">
        {title}
      </h3>
      <p className="text-muted mb-6 leading-relaxed">{description}</p>
      
      {features && features.length > 0 && (
        <div className="space-y-2 mb-6">
          {features.slice(0, 3).map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted">
              <div className="h-1.5 w-1.5 rounded-full bg-gold" />
              {feature}
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-center gap-2 text-gold font-medium group-hover:gap-3 transition-all">
        Explore
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
