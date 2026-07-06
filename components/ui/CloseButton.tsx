import { forwardRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type CloseButtonProps = {
  onClick: () => void;
  className?: string;
  /** "sm" = 32px (modals), "md" = 40px (nav) */
  size?: "sm" | "md";
  label?: string;
};

export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ onClick, className, size = "sm", label = "Close" }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          "flex items-center justify-center rounded-full border border-border text-muted transition-colors hover:text-white",
          size === "sm" && "h-8 w-8",
          size === "md" && "h-10 w-10 hover:border-gold/30",
          className,
        )}
      >
        <X className="h-4 w-4" />
      </button>
    );
  },
);

CloseButton.displayName = "CloseButton";
