import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { SITE } from "@/lib/constants/site";

type LogoProps = {
  className?: string;
  showText?: boolean;
};

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex h-10 w-auto items-center justify-center">
        <Image
          src="/images/logo.png"
          alt="Nexar Network Logo"
          width={160}
          height={40}
          className="h-10 w-auto"
          priority
        />
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
