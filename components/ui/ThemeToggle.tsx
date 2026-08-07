"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { ThemePreference } from "@/lib/theme/constants";

const OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "dark", label: "Dark theme", icon: Moon },
  { value: "system", label: "System theme", icon: Monitor },
];

type ThemeToggleProps = {
  className?: string;
  compact?: boolean;
};

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn(
        "inline-flex items-center rounded-[0.625rem] border border-border bg-surface/80 p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-label={label}
            aria-pressed={active}
            title={label}
            className={cn(
              "inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
              compact ? "h-8 w-8" : "h-9 w-9",
              active
                ? "bg-gold/15 text-gold"
                : "text-muted hover:text-foreground hover:bg-foreground/5",
            )}
          >
            <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
