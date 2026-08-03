import { cn } from "@/lib/utils/cn";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-3 text-[11px] font-semibold tracking-[0.22em] text-gold uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.1] tracking-tight text-white">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-7 text-text-secondary sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
