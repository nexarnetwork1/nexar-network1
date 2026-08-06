import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface PremiumModuleCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  status?: "active" | "beta" | "new";
}

export function PremiumModuleCard({
  icon: Icon,
  title,
  description,
  href,
  status,
}: PremiumModuleCardProps) {
  return (
    <Link
      href={href}
      className="group block p-6 bg-surface-1 border border-white/8 rounded-xl hover:border-white/12 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-12 rounded-lg bg-surface-2 flex items-center justify-center group-hover:bg-surface-3 transition-colors">
          <Icon className="h-6 w-6 text-text-secondary group-hover:text-white transition-colors" />
        </div>
        {status && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold">
            {status}
          </span>
        )}
      </div>
      
      <h3 className="heading-sm mb-2 group-hover:text-gold transition-colors">
        {title}
      </h3>
      <p className="text-sm text-text-secondary line-clamp-2 mb-4">
        {description}
      </p>
      
      <div className="flex items-center gap-2 text-gold text-sm font-medium">
        Explore
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
