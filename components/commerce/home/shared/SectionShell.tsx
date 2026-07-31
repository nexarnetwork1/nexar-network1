"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Container } from "@/components/ui/Container";

type SectionShellProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center";
};

export function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  align = "left",
}: SectionShellProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className={cn(
        "relative scroll-mt-[var(--nxr-header-offset)] py-[var(--nxr-section-gap)] sm:py-[calc(var(--nxr-section-gap)*1.05)]",
        className,
      )}
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "mb-10 max-w-3xl sm:mb-12",
            align === "center" && "mx-auto text-center",
          )}
        >
          {eyebrow ? (
            <p className="mb-4 text-[11px] tracking-[0.24em] text-gold uppercase">{eyebrow}</p>
          ) : null}
          <h2
            id={id ? `${id}-heading` : undefined}
            className="font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              {description}
            </p>
          ) : null}
        </motion.div>
        {children}
      </Container>
    </section>
  );
}
