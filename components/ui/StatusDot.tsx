import { cn } from "@/lib/utils/cn";

type StatusDotProps = {
  /** "gold" = presale/live badge, "green" = active/online */
  color?: "gold" | "green";
  /** Size of the dot */
  size?: "xs" | "sm";
  className?: string;
};

const colorMap = {
  gold: {
    ping: "bg-gold",
    solid: "bg-gold",
  },
  green: {
    ping: "bg-success",
    solid: "bg-success",
  },
};

const sizeMap = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
};

export function StatusDot({ color = "gold", size = "sm", className }: StatusDotProps) {
  const colors = colorMap[color];
  const dims = sizeMap[size];

  return (
    <span
      aria-hidden="true"
      className={cn("relative inline-flex", dims, className)}
    >
      <span
        className={cn(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-40",
          colors.ping,
        )}
      />
      <span
        className={cn(
          "relative inline-flex rounded-full",
          dims,
          colors.solid,
        )}
      />
    </span>
  );
}
