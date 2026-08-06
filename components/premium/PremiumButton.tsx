import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface PremiumButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PremiumButton({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
}: PremiumButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200";
  
  const variantStyles = {
    primary: "bg-gold text-black hover:bg-gold-light",
    secondary: "bg-surface-2 border border-white/12 text-white hover:bg-surface-3",
    ghost: "text-text-secondary hover:text-white hover:bg-surface-1",
  };
  
  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };
  
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
  
  if (href) {
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    );
  }
  
  return (
    <button onClick={onClick} className={combinedClassName}>
      {children}
    </button>
  );
}

interface PremiumCtaProps {
  title: string;
  description: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
}

export function PremiumCta({
  title,
  description,
  primaryAction,
  secondaryAction,
}: PremiumCtaProps) {
  return (
    <section className="section-wide py-32">
      <div className="bg-surface-1 border border-white/8 rounded-2xl p-12 text-center">
        <h2 className="heading-lg mb-4">{title}</h2>
        <p className="text-body mb-8 max-w-2xl mx-auto">{description}</p>
        <div className="flex items-center justify-center gap-4">
          <PremiumButton href={primaryAction.href} size="lg">
            {primaryAction.label}
            <ArrowRight className="ml-2 h-5 w-5" />
          </PremiumButton>
          {secondaryAction && (
            <PremiumButton href={secondaryAction.href} variant="secondary" size="lg">
              {secondaryAction.label}
            </PremiumButton>
          )}
        </div>
      </div>
    </section>
  );
}
