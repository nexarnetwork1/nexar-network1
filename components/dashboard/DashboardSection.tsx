import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type DashboardSectionProps = {
  title?: ReactNode;
  description?: ReactNode;
  /** Buttons or links aligned opposite the title. */
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  headingClassName?: string;
  id?: string;
  as?: "section" | "div";
  level?: "h1" | "h2" | "h3";
};

/**
 * Page or section header with an optional action cluster. Wraps to its own row
 * on narrow screens instead of squeezing the title.
 */
export function DashboardSection({
  title,
  description,
  actions,
  children,
  className,
  headingClassName,
  id,
  as = "section",
  level = "h2",
}: DashboardSectionProps) {
  const Component = as;
  const Heading = level;

  const sizeByLevel = {
    h1: "text-2xl sm:text-3xl",
    h2: "text-lg sm:text-xl",
    h3: "text-base sm:text-lg",
  } as const;

  return (
    <Component id={id} className={cn("min-w-0", className)}>
      {(title || actions || description) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <Heading
                className={cn(
                  "font-heading font-semibold text-white",
                  sizeByLevel[level],
                  headingClassName,
                )}
              >
                {title}
              </Heading>
            )}
            {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
          </div>

          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}

      {children && <div className="mt-5 min-w-0">{children}</div>}
    </Component>
  );
}
