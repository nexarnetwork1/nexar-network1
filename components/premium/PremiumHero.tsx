import { PremiumButton } from "./PremiumButton";
import { ArrowRight, Play } from "lucide-react";

interface PremiumHeroProps {
  badge?: string;
  title: string;
  subtitle: string;
  description: string;
  primaryAction: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  showVideo?: boolean;
}

export function PremiumHero({
  badge,
  title,
  subtitle,
  description,
  primaryAction,
  secondaryAction,
  showVideo = false,
}: PremiumHeroProps) {
  return (
    <section className="section-wide pt-16 pb-24">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-8">
          {badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium">
              {badge}
            </div>
          )}
          
          <div className="space-y-4">
            <h1 className="heading-xl tracking-tight">{title}</h1>
            <p className="text-2xl text-gold font-light tracking-wide">{subtitle}</p>
          </div>
          
          <p className="text-body">{description}</p>
          
          <div className="flex items-center gap-4">
            <PremiumButton href={primaryAction.href} onClick={primaryAction.onClick} size="lg">
              {primaryAction.label}
              <ArrowRight className="ml-2 h-5 w-5" />
            </PremiumButton>
            {secondaryAction && (
              <PremiumButton href={secondaryAction.href} onClick={secondaryAction.onClick} variant="secondary" size="lg">
                {secondaryAction.label}
              </PremiumButton>
            )}
          </div>
        </div>

        {/* Right Content - Video or Illustration */}
        {showVideo ? (
          <div className="relative">
            <div className="aspect-video bg-surface-1 border border-white/8 rounded-2xl overflow-hidden">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              >
                <source src="/videos/atlas-showcase.mp4" type="video/mp4" />
              </video>
            </div>
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-16 w-16 rounded-full bg-gold/20 backdrop-blur-sm flex items-center justify-center">
                <Play className="h-8 w-8 text-gold ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="aspect-square bg-surface-1 border border-white/8 rounded-2xl overflow-hidden">
              {/* Abstract geometric illustration */}
              <div className="absolute inset-0 bg-gradient-to-br from-surface-2 to-surface-3" />
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gold/10 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-surface-3 rounded-full blur-3xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-xl bg-gold mx-auto mb-4 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-black" />
                  </div>
                  <p className="text-text-secondary">ATLAS Platform</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
