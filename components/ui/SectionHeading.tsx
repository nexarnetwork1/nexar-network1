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
        <p className="mb-4 text-xs font-medium tracking-[0.24em] text-gold uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-lg leading-8 text-muted">{description}</p>
      )}
    </div>
  );
}
