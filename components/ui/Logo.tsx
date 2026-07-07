import { useId } from "react";
import { cn } from "@/lib/utils/cn";
import { SITE } from "@/lib/constants/site";

type LogoProps = {
  className?: string;
  showText?: boolean;
};

export function Logo({ className, showText = true }: LogoProps) {
  // useId generates a unique ID per component instance, preventing duplicate
  // SVG gradient IDs when Logo renders in Navbar, MobileMenu, and Footer.
  const gradientId = useId();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex h-10 w-10 items-center justify-center">
        <div className="absolute inset-0 rounded-xl bg-gold/10 blur-md" />
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-surface/80 backdrop-blur-sm">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              d="M8 22L16 6L24 22"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.5 18H21.5"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient
                id={gradientId}
                x1="8"
                y1="6"
                x2="24"
                y2="22"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#F5E39E" />
                <stop offset="1" stopColor="#D4AF37" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-heading text-sm font-semibold tracking-[0.18em] text-white uppercase">
            Nexar Network
          </span>
          <span className="font-mono text-[10px] tracking-[0.35em] text-gold-secondary/80 uppercase">
            {SITE.ticker}
          </span>
        </div>
      )}
    </div>
  );
}
